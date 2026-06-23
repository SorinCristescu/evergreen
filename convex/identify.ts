import { action, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { getCurrentUserOrThrow } from './lib/auth';
import { fnv1aHex, parsePlantIdResult, type CareProfile, type RawCandidate } from './lib/plantId';

const PLANTID_URL =
  'https://plant.id/api/v3/identification?details=common_names,taxonomy,watering,best_light_condition,best_soil_type,toxicity,description&language=en';

type ResolvedCandidate = {
  speciesId: import('./_generated/dataModel').Id<'species'>;
  scientificName: string;
  commonName?: string;
  confidence: number;
  careProfile: CareProfile;
};
export type IdentifyResult = { notAPlant: boolean; candidates: ResolvedCandidate[] };

/** Per-user cache: prior identification of the same image bytes → resolved candidates (joined to species). */
export const identificationByHash = internalQuery({
  args: { imageHash: v.string() },
  handler: async (ctx, { imageHash }): Promise<IdentifyResult | null> => {
    const user = await getCurrentUserOrThrow(ctx);
    const rows = await ctx.db
      .query('identifications')
      .withIndex('by_hash', (q) => q.eq('imageHash', imageHash))
      .collect();
    const mine = rows.find((r) => r.userId === user._id);
    if (!mine) return null;
    const candidates: ResolvedCandidate[] = [];
    for (const c of mine.candidates) {
      if (!c.speciesId) continue;
      const sp = await ctx.db.get(c.speciesId);
      if (!sp) continue;
      candidates.push({
        speciesId: c.speciesId,
        scientificName: c.scientificName,
        commonName: sp.commonNames[0],
        confidence: c.confidence,
        careProfile: sp.careProfile,
      });
    }
    return candidates.length ? { notAPlant: false, candidates } : null;
  },
});

/** Upsert species for each candidate, then store the identification row. Returns resolved candidates. */
export const saveIdentification = internalMutation({
  args: {
    storageId: v.id('_storage'),
    imageHash: v.string(),
    candidates: v.array(
      v.object({
        scientificName: v.string(),
        commonName: v.optional(v.string()),
        confidence: v.number(),
        careProfile: v.object({
          light: v.union(v.literal('direct'), v.literal('indirect'), v.literal('shade')),
          waterDays: v.number(),
          difficulty: v.union(v.literal('easy'), v.literal('medium'), v.literal('hard')),
          humidityRange: v.optional(v.object({ min: v.number(), max: v.number() })),
        }),
      }),
    ),
  },
  handler: async (ctx, { storageId, imageHash, candidates }): Promise<IdentifyResult> => {
    const user = await getCurrentUserOrThrow(ctx);
    const resolved: ResolvedCandidate[] = [];
    for (const c of candidates) {
      const existing = await ctx.db
        .query('species')
        .withIndex('by_scientificName', (q) => q.eq('scientificName', c.scientificName))
        .unique();
      const speciesId =
        existing?._id ??
        (await ctx.db.insert('species', {
          scientificName: c.scientificName,
          commonNames: c.commonName ? [c.commonName] : [],
          careProfile: c.careProfile,
          source: 'ai',
          verified: false,
        }));
      const sp = existing ?? (await ctx.db.get(speciesId))!;
      resolved.push({
        speciesId,
        scientificName: c.scientificName,
        commonName: sp.commonNames[0] ?? c.commonName,
        confidence: c.confidence,
        careProfile: sp.careProfile,
      });
    }
    await ctx.db.insert('identifications', {
      userId: user._id,
      storageId,
      imageHash,
      candidates: resolved.map((r) => ({ speciesId: r.speciesId, scientificName: r.scientificName, confidence: r.confidence })),
      createdAt: Date.now(),
    });
    return { notAPlant: false, candidates: resolved };
  },
});

/** Read the uploaded photo, hash it, check cache, call Plant.id, persist, return resolved candidates. */
export const identifyPlant = action({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }): Promise<IdentifyResult> => {
    const apiKey = process.env.PLANTID_API_KEY;
    if (!apiKey) throw new Error('Plant identification is not configured.');

    const blob = await ctx.storage.get(storageId);
    if (!blob) throw new Error('Photo not found.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const imageHash = fnv1aHex(bytes);

    const cached: IdentifyResult | null = await ctx.runQuery(internal.identify.identificationByHash, { imageHash });
    if (cached) return cached;

    // bytes → base64 (chunked to avoid call-stack limits on large images)
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    const base64 = btoa(binary);

    const res = await fetch(PLANTID_URL, {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: [base64], similar_images: true }),
    });
    if (!res.ok) throw new Error(`Plant.id failed (${res.status})`);
    const json = await res.json();

    const { isPlant, candidates }: { isPlant: boolean; candidates: RawCandidate[] } = parsePlantIdResult(json);
    if (!isPlant) return { notAPlant: true, candidates: [] };

    return await ctx.runMutation(internal.identify.saveIdentification, {
      storageId,
      imageHash,
      candidates: candidates.slice(0, 5),
    });
  },
});
