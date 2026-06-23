/** careTasks — the Today queue + complete/snooze/skip mutations. */
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser, getCurrentUserOrThrow } from './lib/auth';
import { accessiblePlants, canAccessPlant } from './lib/access';
import { earliestOpenWaterForPlants } from './lib/care';
import { computeUrgency, mapCareTaskItem, mapPlantSummary } from './lib/mappers';
import type { QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { CareTaskItem, PlantSummary } from '../src/data/types';
import type { UserDoc } from './lib/auth';

const DAY = 24 * 60 * 60 * 1000;

/** Tasks shown on Today: open (due/snoozed) within a one-week horizon + done-today (so the
 *  completed check persists). */
async function relevantTasks(
  ctx: QueryCtx,
  user: UserDoc,
  now: number,
  locationId?: Id<'locations'>,
): Promise<Doc<'careTasks'>[]> {
  // tasks for every plant the user can access (owned + shared), optionally one location
  const plants = await accessiblePlants(ctx, user, locationId);
  const plantIds = new Set<string>(plants.map((p) => p._id));
  const ownerIds = new Set<string>(plants.map((p) => p.userId));
  const all: Doc<'careTasks'>[] = [];
  for (const oid of ownerIds) {
    const tasks = await ctx.db
      .query('careTasks')
      .withIndex('by_user_due', (q) => q.eq('userId', oid as Id<'users'>))
      .collect();
    for (const t of tasks) if (plantIds.has(t.plantId)) all.push(t);
  }
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const startOfToday = start.getTime();
  const horizon = startOfToday + 7 * DAY;
  return all.filter((t) => {
    if (t.status === 'due' || t.status === 'snoozed') return t.dueAt < horizon;
    if (t.status === 'done') return (t.completedAt ?? 0) >= startOfToday;
    return false;
  });
}

/** Build a PlantSummary for each distinct plant referenced by the tasks. */
async function plantSummaries(
  ctx: QueryCtx,
  user: UserDoc,
  tasks: Doc<'careTasks'>[],
  now: number,
): Promise<Map<string, PlantSummary>> {
  // distinct plants referenced by the tasks, then their owner-aware water status
  const plantDocs: Doc<'plants'>[] = [];
  const seen = new Set<string>();
  for (const t of tasks) {
    if (seen.has(t.plantId)) continue;
    seen.add(t.plantId);
    const plant = await ctx.db.get(t.plantId);
    if (plant) plantDocs.push(plant);
  }
  const water = await earliestOpenWaterForPlants(ctx, plantDocs);
  const byPlant = new Map<string, PlantSummary>();
  for (const plant of plantDocs) {
    const space = await ctx.db.get(plant.spaceId);
    if (!space) continue;
    const species = plant.speciesId ? await ctx.db.get(plant.speciesId) : null;
    byPlant.set(plant._id, await mapPlantSummary(ctx, plant, space, species, water.get(plant._id), now));
  }
  return byPlant;
}

export const todayTasks = query({
  args: { locationId: v.optional(v.id('locations')) },
  handler: async (ctx, { locationId }): Promise<CareTaskItem[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const now = Date.now();
    const tasks = await relevantTasks(ctx, user, now, locationId);
    const summaries = await plantSummaries(ctx, user, tasks, now);
    const items: CareTaskItem[] = [];
    for (const t of tasks) {
      const plant = summaries.get(t.plantId);
      if (plant) items.push(mapCareTaskItem(t, plant, now));
    }
    // overdue → today → upcoming, then by due time
    const rank: Record<string, number> = { overdue: 0, today: 1, upcoming: 2 };
    items.sort((a, b) => rank[a.urgency] - rank[b.urgency]);
    return items;
  },
});

export const hasActionableToday = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;
    const now = Date.now();
    const plants = await accessiblePlants(ctx, user);
    const plantIds = new Set<string>(plants.map((p) => p._id));
    const ownerIds = new Set<string>(plants.map((p) => p.userId));
    for (const oid of ownerIds) {
      const tasks = await ctx.db
        .query('careTasks')
        .withIndex('by_user_due', (q) => q.eq('userId', oid as Id<'users'>))
        .collect();
      for (const t of tasks) {
        if (!plantIds.has(t.plantId) || t.status !== 'due') continue;
        const u = computeUrgency(t.dueAt, now);
        if (u === 'overdue' || u === 'today') return true;
      }
    }
    return false;
  },
});

/** A task the user may act on: their own, or one on a plant in a location shared with them. */
async function accessibleTask(ctx: QueryCtx, taskId: Doc<'careTasks'>['_id']): Promise<Doc<'careTasks'>> {
  const user = await getCurrentUserOrThrow(ctx);
  const task = await ctx.db.get(taskId);
  if (!task) throw new Error('Task not found');
  const plant = await ctx.db.get(task.plantId);
  if (!plant || !(await canAccessPlant(ctx, user, plant))) throw new Error('Task not found');
  return task;
}

/** Toggle completion (done ↔ due) so the UI's tap-to-toggle behaves as before. */
export const completeTask = mutation({
  args: { taskId: v.id('careTasks') },
  handler: async (ctx, { taskId }) => {
    const task = await accessibleTask(ctx, taskId);
    const user = await getCurrentUserOrThrow(ctx);
    if (task.status === 'done') {
      await ctx.db.patch(taskId, { status: 'due', completedAt: undefined });
      await ctx.db.patch(user._id, { tasksDoneTotal: Math.max(0, (user.tasksDoneTotal ?? 0) - 1) });
    } else {
      await ctx.db.patch(taskId, { status: 'done', completedAt: Date.now() });
      await ctx.db.patch(user._id, { tasksDoneTotal: (user.tasksDoneTotal ?? 0) + 1 });
    }
    return null;
  },
});

export const snoozeTask = mutation({
  args: { taskId: v.id('careTasks') },
  handler: async (ctx, { taskId }) => {
    const task = await accessibleTask(ctx, taskId);
    await ctx.db.patch(taskId, { status: 'snoozed', dueAt: task.dueAt + DAY });
    return null;
  },
});

export const skipTask = mutation({
  args: { taskId: v.id('careTasks') },
  handler: async (ctx, { taskId }) => {
    await accessibleTask(ctx, taskId);
    await ctx.db.patch(taskId, { status: 'skipped' });
    return null;
  },
});
