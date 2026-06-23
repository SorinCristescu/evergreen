/** Care helpers shared by plants.ts and careTasks.ts. */
import type { QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import type { UserDoc } from './auth';

function collectWater(tasks: Doc<'careTasks'>[], map: Map<string, Doc<'careTasks'>>) {
  for (const t of tasks) {
    if (t.type !== 'water' || t.status !== 'due') continue;
    const prev = map.get(t.plantId);
    if (!prev || t.dueAt < prev.dueAt) map.set(t.plantId, t);
  }
}

/** Map of plantId → its earliest still-open `water` task (drives Garden card status). */
export async function earliestOpenWaterByPlant(
  ctx: QueryCtx,
  user: UserDoc,
): Promise<Map<string, Doc<'careTasks'>>> {
  const tasks = await ctx.db
    .query('careTasks')
    .withIndex('by_user_due', (q) => q.eq('userId', user._id))
    .collect();
  const map = new Map<string, Doc<'careTasks'>>();
  collectWater(tasks, map);
  return map;
}

/** Same map, but for an arbitrary set of plants — resolves each plant's owner so shared (other
 *  people's) plants get their real water status, not just the viewer's own tasks. */
export async function earliestOpenWaterForPlants(
  ctx: QueryCtx,
  plants: Doc<'plants'>[],
): Promise<Map<string, Doc<'careTasks'>>> {
  const ownerIds = new Set<string>(plants.map((p) => p.userId));
  const map = new Map<string, Doc<'careTasks'>>();
  for (const oid of ownerIds) {
    const tasks = await ctx.db
      .query('careTasks')
      .withIndex('by_user_due', (q) => q.eq('userId', oid as Id<'users'>))
      .collect();
    collectWater(tasks, map);
  }
  return map;
}
