/** locations — the user's geographical places (Home, Holiday house, …). */
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser, getCurrentUserOrThrow } from './lib/auth';
import type { Doc, Id } from './_generated/dataModel';
import type { LocationRef } from '../src/data/types';

async function plantCountForLocation(
  ctx: Parameters<typeof getCurrentUser>[0],
  location: Doc<'locations'>,
): Promise<number> {
  const spaces = await ctx.db
    .query('spaces')
    .withIndex('by_location', (q) => q.eq('locationId', location._id))
    .collect();
  let total = 0;
  for (const space of spaces) {
    const plants = await ctx.db
      .query('plants')
      .withIndex('by_space', (q) => q.eq('spaceId', space._id))
      .collect();
    total += plants.filter((p) => p.status === 'alive').length;
  }
  return total;
}

async function toRef(
  ctx: Parameters<typeof getCurrentUser>[0],
  location: Doc<'locations'>,
  sharedByName?: string,
): Promise<LocationRef> {
  return {
    id: location._id,
    name: location.name,
    climateLabel: location.climate.label,
    tempLabel: undefined, // live temp now comes from the weather service (client-side)
    plantCount: await plantCountForLocation(ctx, location),
    locked: location.status === 'locked',
    lat: location.climate.lat,
    lon: location.climate.lon,
    sharedByName,
  };
}

export const listLocations = query({
  args: {},
  handler: async (ctx): Promise<LocationRef[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const owned = await ctx.db
      .query('locations')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    owned.sort((a, b) => a.order - b.order);
    const refs = await Promise.all(owned.map((l) => toRef(ctx, l)));

    // locations shared with this user via active grants (appended after their own)
    const grants = await ctx.db
      .query('accessGrants')
      .withIndex('by_grantee', (q) => q.eq('granteeUserId', user._id))
      .collect();
    const sharedIds = new Set<string>();
    for (const g of grants) if (g.status === 'active') for (const lid of g.locationIds) sharedIds.add(lid);
    for (const lid of sharedIds) {
      const loc = await ctx.db.get(lid as Id<'locations'>);
      if (!loc || loc.userId === user._id) continue;
      const owner = await ctx.db.get(loc.userId);
      refs.push(await toRef(ctx, loc, owner?.name ?? 'Someone'));
    }
    return refs;
  },
});

/** Finish onboarding: create the user's first location + space. No-op if already onboarded. */
export const completeOnboarding = mutation({
  args: {
    name: v.string(),
    climateLabel: v.string(),
    level: v.union(v.literal('beginner'), v.literal('intermediate'), v.literal('expert')),
    goals: v.array(v.string()),
    place: v.union(v.literal('indoor'), v.literal('outdoor'), v.literal('greenhouse')),
    spaceName: v.string(),
    lat: v.optional(v.number()), // real device coords when "Use my location" was used
    lon: v.optional(v.number()),
  },
  handler: async (ctx, a) => {
    const user = await getCurrentUserOrThrow(ctx);
    const existing = await ctx.db.query('locations').withIndex('by_user', (q) => q.eq('userId', user._id)).first();
    if (existing) return existing._id; // already onboarded — don't duplicate

    const locationId = await ctx.db.insert('locations', {
      userId: user._id,
      name: a.name.trim() || 'Home',
      climate: { label: a.climateLabel.trim() || 'Your city', lat: a.lat ?? 0, lon: a.lon ?? 0 },
      gardeningLevel: a.level,
      goals: a.goals,
      status: 'active',
      order: 0,
    });
    await ctx.db.insert('spaces', {
      userId: user._id,
      locationId,
      place: a.place,
      name: a.spaceName.trim() || 'My space',
      order: 0,
    });
    return locationId;
  },
});

/**
 * Add an additional location + its first space (the "Add a location" flow on Profile › Locations).
 * Unlike completeOnboarding this is NOT gated — it always creates a new location, appended after the
 * existing ones. Returns both ids so the caller can drop the first plant straight into the new space.
 */
export const addLocation = mutation({
  args: {
    name: v.string(),
    climateLabel: v.string(),
    level: v.union(v.literal('beginner'), v.literal('intermediate'), v.literal('expert')),
    goals: v.array(v.string()),
    place: v.union(v.literal('indoor'), v.literal('outdoor'), v.literal('greenhouse')),
    spaceName: v.string(),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
  },
  handler: async (ctx, a): Promise<{ locationId: Id<'locations'>; spaceId: Id<'spaces'> }> => {
    const user = await getCurrentUserOrThrow(ctx);
    const existing = await ctx.db
      .query('locations')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    const order = existing.length ? Math.max(...existing.map((l) => l.order)) + 1 : 0;

    const locationId = await ctx.db.insert('locations', {
      userId: user._id,
      name: a.name.trim() || 'New place',
      climate: { label: a.climateLabel.trim() || 'Your city', lat: a.lat ?? 0, lon: a.lon ?? 0 },
      gardeningLevel: a.level,
      goals: a.goals,
      status: 'active',
      order,
    });
    const spaceId = await ctx.db.insert('spaces', {
      userId: user._id,
      locationId,
      place: a.place,
      name: a.spaceName.trim() || 'My space',
      order: 0,
    });
    return { locationId, spaceId };
  },
});

/**
 * Delete a location and everything inside it — its spaces, every plant in those spaces, and each
 * plant's care plans / tasks / photos / treatments. Ownership-scoped and irreversible.
 */
export const deleteLocation = mutation({
  args: { locationId: v.id('locations') },
  handler: async (ctx, { locationId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const location = await ctx.db.get(locationId);
    if (!location || location.userId !== user._id) throw new Error('Location not found');

    const spaces = await ctx.db
      .query('spaces')
      .withIndex('by_location', (q) => q.eq('locationId', locationId))
      .collect();
    for (const space of spaces) {
      const plants = await ctx.db
        .query('plants')
        .withIndex('by_space', (q) => q.eq('spaceId', space._id))
        .collect();
      for (const plant of plants) {
        for (const table of ['careTasks', 'carePlans', 'plantPhotos', 'treatments'] as const) {
          const rows = await ctx.db
            .query(table)
            .withIndex('by_plant', (q) => q.eq('plantId', plant._id))
            .collect();
          for (const row of rows) await ctx.db.delete(row._id);
        }
        await ctx.db.delete(plant._id);
      }
      await ctx.db.delete(space._id);
    }
    await ctx.db.delete(locationId);
    return null;
  },
});

/** First active location (the one the Garden tab shows). */
export const activeLocation = query({
  args: {},
  handler: async (ctx): Promise<LocationRef | null> => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const rows = await ctx.db
      .query('locations')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    rows.sort((a, b) => a.order - b.order);
    const active = rows.find((l) => l.status === 'active') ?? rows[0];
    return active ? toRef(ctx, active) : null;
  },
});
