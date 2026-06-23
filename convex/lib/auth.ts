/**
 * Identity helpers — resolve the Clerk identity to a `users` row and lazily provision it.
 *
 * Queries can't write, so they use `getCurrentUser` (returns null when the row isn't there yet);
 * mutations use `getCurrentUserOrThrow` / `getOrCreateUser`. The client calls `users.ensureUser`
 * once right after Convex becomes authenticated so reads find the row.
 */
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';

export type UserDoc = Doc<'users'>;

/** The signed-in user's row, or null (no identity, or not provisioned yet). Safe in queries. */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<UserDoc | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();
}

/** Like getCurrentUser but throws — use in mutations / reads that must have a provisioned user. */
export async function getCurrentUserOrThrow(ctx: QueryCtx | MutationCtx): Promise<UserDoc> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error('Not authenticated or user not provisioned');
  return user;
}

/** Derive a unique-ish community handle from an email local-part + a short suffix. */
function deriveHandle(identity: { email?: string; nickname?: string; subject: string }): string {
  const base =
    identity.nickname ??
    identity.email?.split('@')[0] ??
    `gardener_${identity.subject.slice(-6)}`;
  const clean = base.toLowerCase().replace(/[^a-z0-9._]/g, '');
  const suffix = identity.subject.slice(-4);
  return `${clean || 'gardener'}.${suffix}`;
}

/** Mutation-only: return the existing row or create one from the Clerk identity. */
export async function getOrCreateUser(ctx: MutationCtx): Promise<UserDoc> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  const existing = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();
  if (existing) return existing;

  const now = Date.now();
  const id = await ctx.db.insert('users', {
    clerkId: identity.subject,
    name: identity.name ?? identity.nickname ?? 'Gardener',
    handle: deriveHandle({ email: identity.email, nickname: identity.nickname, subject: identity.subject }),
    role: 'user',
    entitlement: 'free',
    aiIdsThisPeriod: 0,
    aiIdsPeriodStart: now,
    streakCount: 0,
    notificationPrefs: { care: true, community: true, chat: true },
  });
  const created = await ctx.db.get(id);
  if (!created) throw new Error('Failed to provision user');
  return created;
}
