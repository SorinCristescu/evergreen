/** community — the social feed + composing a post. */
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser, getCurrentUserOrThrow } from './lib/auth';
import { mapGardenerRef } from './lib/mappers';
import type { Post } from '../src/data/types';

/** Short-lived URL the client POSTs a post photo to before calling createPost. */
export const generatePostUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/** Delete one of your own posts (with its comments + uploaded photos). */
export const deletePost = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const post = await ctx.db.get(postId);
    if (!post || post.userId !== user._id) throw new Error('Post not found');
    for (const c of await ctx.db.query('comments').withIndex('by_post', (q) => q.eq('postId', postId)).collect()) {
      await ctx.db.delete(c._id);
    }
    for (const sid of post.photoStorageIds) await ctx.storage.delete(sid);
    await ctx.db.delete(postId);
    return null;
  },
});

/** Create a community post with a caption and/or uploaded photos. */
export const createPost = mutation({
  args: { caption: v.string(), photoStorageIds: v.array(v.id('_storage')), taggedPlantId: v.optional(v.id('plants')) },
  handler: async (ctx, { caption, photoStorageIds, taggedPlantId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const text = caption.trim();
    if (!text && photoStorageIds.length === 0) throw new Error('Add a photo or some text');
    let taggedSpeciesId;
    if (taggedPlantId) {
      const plant = await ctx.db.get(taggedPlantId);
      if (!plant || plant.userId !== user._id) throw new Error('Plant not found');
      taggedSpeciesId = plant.speciesId;
    }
    return ctx.db.insert('posts', {
      userId: user._id,
      caption: text,
      photoStorageIds,
      taggedPlantId,
      taggedSpeciesId,
      likeCount: 0,
      moderation: 'ok',
      createdAt: Date.now(),
    });
  },
});

const DAY = 24 * 60 * 60 * 1000;
function relativeLabel(at: number, now: number): string {
  const diff = Math.max(0, now - at);
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(diff / DAY);
  return days === 1 ? '1d' : `${days}d`;
}

export const communityFeed = query({
  args: {},
  handler: async (ctx): Promise<Post[]> => {
    const me = await getCurrentUser(ctx);
    const now = Date.now();

    const posts = await ctx.db.query('posts').withIndex('by_createdAt').order('desc').take(50);

    // who I follow / blocked / saved (for flags)
    const following = new Set<string>();
    const blocked = new Set<string>();
    const saved = new Set<string>();
    if (me) {
      for (const f of await ctx.db
        .query('follows')
        .withIndex('by_follower', (q) => q.eq('followerId', me._id))
        .collect())
        following.add(f.followeeId);
      for (const b of await ctx.db
        .query('blocks')
        .withIndex('by_blocker', (q) => q.eq('blockerId', me._id))
        .collect())
        blocked.add(b.blockedId);
      for (const s of await ctx.db
        .query('saves')
        .withIndex('by_user', (q) => q.eq('userId', me._id))
        .collect())
        saved.add(s.postId);
    }

    const out: Post[] = [];
    for (const post of posts) {
      if (post.moderation !== 'ok') continue;
      if (blocked.has(post.userId)) continue;
      const author = await ctx.db.get(post.userId);
      if (!author) continue;

      const photoUrls: string[] = [];
      for (const sid of post.photoStorageIds) {
        const u = await ctx.storage.getUrl(sid);
        if (u) photoUrls.push(u);
      }
      const comments = await ctx.db
        .query('comments')
        .withIndex('by_post', (q) => q.eq('postId', post._id))
        .collect();

      let taggedPlant: { id: string; label: string } | undefined;
      if (post.taggedPlantId) {
        const tp = await ctx.db.get(post.taggedPlantId);
        if (tp) {
          let label = tp.nickname;
          if (!label && tp.speciesId) {
            const sp = await ctx.db.get(tp.speciesId);
            label = sp?.commonNames[0] ?? sp?.scientificName;
          }
          taggedPlant = { id: tp._id, label: label ?? 'Plant' };
        }
      }

      out.push({
        id: post._id,
        author: await mapGardenerRef(ctx, author),
        photoUrls,
        caption: post.caption,
        likeCount: post.likeCount,
        commentCount: comments.length,
        liked: false, // per-user like records are a later phase
        saved: saved.has(post._id),
        following: following.has(post.userId),
        taggedPlant,
        createdAtLabel: relativeLabel(post.createdAt, now),
      });
    }
    return out;
  },
});
