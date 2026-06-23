/** treatments — owner edits for the active Dr. Plant treatment plan. */
import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUserOrThrow } from './lib/auth';

/**
 * Accept a Dr. Plant diagnosis: create the active treatment for a plant from the recommended
 * plan. Any prior active treatment is marked resolved so the Care section shows only the latest.
 * Steps arrive as plain strings (the recommendation) and start unchecked.
 */
export const createTreatment = mutation({
  args: {
    plantId: v.id('plants'),
    diagnosis: v.string(),
    issueType: v.union(v.literal('disease'), v.literal('pest'), v.literal('deficiency')),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    steps: v.array(v.string()),
  },
  handler: async (ctx, { plantId, diagnosis, issueType, severity, steps }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plant = await ctx.db.get(plantId);
    if (!plant || plant.userId !== user._id) throw new Error('Plant not found');

    const existing = await ctx.db
      .query('treatments')
      .withIndex('by_plant', (q) => q.eq('plantId', plantId))
      .collect();
    for (const tr of existing) {
      if (tr.status === 'active') await ctx.db.patch(tr._id, { status: 'resolved' });
    }

    return ctx.db.insert('treatments', {
      plantId,
      userId: user._id,
      diagnosis,
      issueType,
      severity,
      steps: steps.map((text) => ({ text, done: false })),
      status: 'active',
      createdAt: Date.now(),
    });
  },
});

/** Flip a single treatment step's done state (check / uncheck), ownership-scoped. */
export const toggleStep = mutation({
  args: { treatmentId: v.id('treatments'), stepIndex: v.number() },
  handler: async (ctx, { treatmentId, stepIndex }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const treatment = await ctx.db.get(treatmentId);
    if (!treatment || treatment.userId !== user._id) throw new Error('Treatment not found');
    const steps = treatment.steps.map((s, i) => (i === stepIndex ? { ...s, done: !s.done } : s));
    await ctx.db.patch(treatmentId, { steps });
  },
});
