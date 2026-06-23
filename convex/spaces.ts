/** spaces — rooms/areas within a location. */
import { query } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from './lib/auth';
import { mapSpaceRef } from './lib/mappers';
import type { SpaceRef } from '../src/data/types';

export const listSpaces = query({
  args: { locationId: v.optional(v.id('locations')) },
  handler: async (ctx, { locationId }): Promise<SpaceRef[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const rows = locationId
      ? await ctx.db
          .query('spaces')
          .withIndex('by_location', (q) => q.eq('locationId', locationId))
          .collect()
      : await ctx.db
          .query('spaces')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .collect();
    const owned = rows.filter((s) => s.userId === user._id);
    owned.sort((a, b) => a.order - b.order);
    return owned.map(mapSpaceRef);
  },
});
