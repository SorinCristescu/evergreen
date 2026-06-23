/**
 * Shared-access helpers — a user can read a location (and the plants/tasks within it) when they
 * own it OR an active accessGrant lists it. These resolve "accessible" sets so the plant and care
 * queries return owned + shared content uniformly.
 */
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import type { UserDoc } from './auth';

type Ctx = QueryCtx | MutationCtx;

/** Location ids the user can access: owned + granted-to-them via an active grant. */
export async function accessibleLocationIds(ctx: Ctx, user: UserDoc): Promise<Set<string>> {
  const owned = await ctx.db
    .query('locations')
    .withIndex('by_user', (q) => q.eq('userId', user._id))
    .collect();
  const ids = new Set<string>(owned.map((l) => l._id));
  const grants = await ctx.db
    .query('accessGrants')
    .withIndex('by_grantee', (q) => q.eq('granteeUserId', user._id))
    .collect();
  for (const g of grants) {
    if (g.status !== 'active') continue;
    for (const lid of g.locationIds) ids.add(lid);
  }
  return ids;
}

/** All alive plants in the user's accessible locations (owned + shared); optionally one location. */
export async function accessiblePlants(ctx: Ctx, user: UserDoc, locationId?: Id<'locations'>): Promise<Doc<'plants'>[]> {
  const accessible = await accessibleLocationIds(ctx, user);
  const locIds = locationId ? (accessible.has(locationId) ? [locationId] : []) : [...accessible];
  const out: Doc<'plants'>[] = [];
  for (const lid of locIds) {
    const spaces = await ctx.db
      .query('spaces')
      .withIndex('by_location', (q) => q.eq('locationId', lid as Id<'locations'>))
      .collect();
    for (const space of spaces) {
      const plants = await ctx.db
        .query('plants')
        .withIndex('by_space', (q) => q.eq('spaceId', space._id))
        .collect();
      for (const p of plants) if (p.status === 'alive') out.push(p);
    }
  }
  return out;
}

/** Can the user access this plant (owns it, or it sits in a location granted to them)? */
export async function canAccessPlant(ctx: Ctx, user: UserDoc, plant: Doc<'plants'>): Promise<boolean> {
  if (plant.userId === user._id) return true;
  const space = await ctx.db.get(plant.spaceId);
  if (!space) return false;
  const accessible = await accessibleLocationIds(ctx, user);
  return accessible.has(space.locationId);
}
