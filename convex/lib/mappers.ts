/**
 * Mappers — turn Convex rows into the app's view-model shapes (src/data/types) so the
 * `src/data` hooks stay one-liners. Storage ids are resolved to URLs here.
 *
 * `import type` keeps these as pure types (erased at build) — no runtime dependency on `src/`.
 */
import type { QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import type {
  CareTaskItem,
  GardenerRef,
  PlantSummary,
  SpaceRef,
  SpeciesRef,
  Urgency,
} from '../../src/data/types';

const DAY = 24 * 60 * 60 * 1000;

function startOfUtcDay(now: number): number {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** overdue (before today) · today (due today) · upcoming (future). Server UTC. */
export function computeUrgency(dueAt: number, now: number): Urgency {
  const start = startOfUtcDay(now);
  const end = start + DAY;
  if (dueAt < start) return 'overdue';
  if (dueAt < end) return 'today';
  return 'upcoming';
}

/** "Living Room · today" / "· 2 days overdue" / "· in 3 days" / "· tomorrow". */
export function buildDueLabel(spaceName: string, dueAt: number, now: number): string {
  const urgency = computeUrgency(dueAt, now);
  if (urgency === 'today') return `${spaceName} · today`;
  if (urgency === 'overdue') {
    const days = Math.max(1, Math.ceil((startOfUtcDay(now) - dueAt) / DAY));
    return `${spaceName} · ${days === 1 ? '1 day overdue' : `${days} days overdue`}`;
  }
  const days = Math.max(1, Math.ceil((dueAt - now) / DAY));
  return `${spaceName} · ${days === 1 ? 'tomorrow' : `in ${days} days`}`;
}

export function mapSpaceRef(space: Doc<'spaces'>): SpaceRef {
  return { id: space._id, name: space.name, place: space.place };
}

export function mapSpeciesRef(species: Doc<'species'> | null): SpeciesRef | undefined {
  if (!species) return undefined;
  return { id: species._id, scientificName: species.scientificName, commonName: species.commonNames[0] };
}

async function url(ctx: QueryCtx, id: Id<'_storage'> | undefined): Promise<string | undefined> {
  if (!id) return undefined;
  return (await ctx.storage.getUrl(id)) ?? undefined;
}

/**
 * Plant card. `openWaterTask` is the plant's earliest still-open `water` task (if any) — drives
 * the warn/ok/good status the Garden card shows.
 */
export async function mapPlantSummary(
  ctx: QueryCtx,
  plant: Doc<'plants'>,
  space: Doc<'spaces'>,
  species: Doc<'species'> | null,
  openWaterTask: Doc<'careTasks'> | undefined,
  now: number,
): Promise<PlantSummary> {
  let status: PlantSummary['status'] = 'good';
  let statusLabel = 'Healthy';
  let needsWater = false;
  if (openWaterTask) {
    if (openWaterTask.dueAt <= now) {
      status = 'warn';
      statusLabel = 'Needs water';
      needsWater = true;
    } else {
      const days = Math.max(1, Math.ceil((openWaterTask.dueAt - now) / DAY));
      status = 'ok';
      statusLabel = `Water in ${days}d`;
    }
  }
  return {
    id: plant._id,
    nickname: plant.nickname,
    coverUrl: await url(ctx, plant.coverStorageId),
    species: mapSpeciesRef(species),
    needsWater,
    status,
    statusLabel,
    space: mapSpaceRef(space),
  };
}

export function mapCareTaskItem(
  task: Doc<'careTasks'>,
  plant: PlantSummary,
  now: number,
): CareTaskItem {
  return {
    id: task._id,
    type: task.type,
    status: task.status,
    urgency: computeUrgency(task.dueAt, now),
    dueLabel: buildDueLabel(plant.space.name, task.dueAt, now),
    plant,
  };
}

export async function mapGardenerRef(ctx: QueryCtx, user: Doc<'users'>): Promise<GardenerRef> {
  return {
    id: user._id,
    handle: user.handle,
    name: user.name,
    avatarUrl: await url(ctx, user.avatarStorageId),
  };
}
