/** users — current profile (read) + lazy provisioning (write). */
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser as currentUserDoc, getCurrentUserOrThrow, getOrCreateUser } from './lib/auth';
import type { UserProfile } from '../src/data/types';

/** The signed-in user's profile, or null while unauthenticated / not yet provisioned. */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx): Promise<UserProfile | null> => {
    const user = await currentUserDoc(ctx);
    if (!user) return null;
    const identity = await ctx.auth.getUserIdentity();

    const plants = await ctx.db
      .query('plants')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    const alive = plants.filter((p) => p.status === 'alive').length;

    let tasksDone = user.tasksDoneTotal;
    if (tasksDone === undefined) {
      const done = await ctx.db
        .query('careTasks')
        .withIndex('by_user_due', (q) => q.eq('userId', user._id))
        .filter((q) => q.eq(q.field('status'), 'done'))
        .collect();
      tasksDone = done.length;
    }

    const avatarUrl = user.avatarStorageId
      ? ((await ctx.storage.getUrl(user.avatarStorageId)) ?? undefined)
      : undefined;

    return {
      id: user._id,
      handle: user.handle,
      name: user.name,
      email: identity?.email ?? '',
      avatarUrl,
      entitlement: user.entitlement,
      streak: user.streakCount,
      stats: {
        plants: alive,
        streak: user.streakCount,
        tasksDone,
        bestStreak: user.bestStreak,
      },
    };
  },
});

/** Called once after Convex becomes authenticated — creates the `users` row if missing, and
 *  activates any pending shared-access grants addressed to this user's email. */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateUser(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email?.trim().toLowerCase();
    if (email) {
      const grants = await ctx.db
        .query('accessGrants')
        .withIndex('by_email', (q) => q.eq('email', email))
        .collect();
      for (const g of grants) {
        if (g.status !== 'active' || g.granteeUserId !== user._id) {
          await ctx.db.patch(g._id, { status: 'active', granteeUserId: user._id });
        }
      }
    }
    return user._id;
  },
});

/** Short-lived URL the client POSTs the avatar image to before calling setAvatar. */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/** Set the signed-in user's avatar to a previously-uploaded image. */
export const setAvatar = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    await ctx.db.patch(user._id, { avatarStorageId: storageId });
  },
});
