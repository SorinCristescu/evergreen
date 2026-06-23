/** plants — garden cards, grouped-by-space, the full plant detail, and owner edits. */
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getCurrentUser, getCurrentUserOrThrow } from './lib/auth';
import { accessiblePlants, canAccessPlant } from './lib/access';
import { earliestOpenWaterForPlants } from './lib/care';
import { mapCareTaskItem, mapPlantSummary, mapSpaceRef } from './lib/mappers';
import { petSafetyFromToxicity } from './lib/plantId';
import type { MutationCtx, QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { CareTaskItem, PlantDetail, PlantSummary, SpaceRef, Treatment } from '../src/data/types';
import type { UserDoc } from './lib/auth';

async function summarize(
  ctx: QueryCtx,
  user: UserDoc,
  plants: Doc<'plants'>[],
  now: number,
): Promise<{ summary: PlantSummary; spaceId: Id<'spaces'>; order: number }[]> {
  const spaceCache = new Map<string, Doc<'spaces'>>();
  const speciesCache = new Map<string, Doc<'species'> | null>();
  const waterByPlant = await earliestOpenWaterForPlants(ctx, plants);

  const out: { summary: PlantSummary; spaceId: Id<'spaces'>; order: number }[] = [];
  for (const plant of plants) {
    let space = spaceCache.get(plant.spaceId);
    if (!space) {
      const fetched = await ctx.db.get(plant.spaceId);
      if (!fetched) continue;
      space = fetched;
      spaceCache.set(plant.spaceId, space);
    }
    let species: Doc<'species'> | null = null;
    if (plant.speciesId) {
      if (speciesCache.has(plant.speciesId)) species = speciesCache.get(plant.speciesId) ?? null;
      else {
        species = await ctx.db.get(plant.speciesId);
        speciesCache.set(plant.speciesId, species);
      }
    }
    const summary = await mapPlantSummary(ctx, plant, space, species, waterByPlant.get(plant._id), now);
    out.push({ summary, spaceId: plant.spaceId, order: space.order });
  }
  return out;
}

export const listPlants = query({
  args: { locationId: v.optional(v.id('locations')) },
  handler: async (ctx, { locationId }): Promise<PlantSummary[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const now = Date.now();
    const plants = await accessiblePlants(ctx, user, locationId);
    const rows = await summarize(ctx, user, plants, now);
    return rows.map((r) => r.summary);
  },
});

export const plantsBySpace = query({
  args: { locationId: v.optional(v.id('locations')) },
  handler: async (ctx, { locationId }): Promise<{ space: SpaceRef; plants: PlantSummary[] }[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const now = Date.now();
    const plants = await accessiblePlants(ctx, user, locationId);
    const rows = await summarize(ctx, user, plants, now);

    // group by space, preserving space order, dropping empty spaces
    const groups = new Map<string, { space: SpaceRef; order: number; plants: PlantSummary[] }>();
    for (const r of rows) {
      let g = groups.get(r.spaceId);
      if (!g) {
        const spaceDoc = await ctx.db.get(r.spaceId);
        if (!spaceDoc) continue;
        g = { space: mapSpaceRef(spaceDoc), order: r.order, plants: [] };
        groups.set(r.spaceId, g);
      }
      g.plants.push(r.summary);
    }
    return [...groups.values()].sort((a, b) => a.order - b.order).map(({ space, plants }) => ({ space, plants }));
  },
});

function mapTreatment(t: Doc<'treatments'>): Treatment {
  return {
    id: t._id,
    diagnosis: t.diagnosis,
    issueType: t.issueType,
    severity: t.severity,
    currentStep: t.steps.filter((s) => s.done).length,
    totalSteps: t.steps.length,
    status: t.status,
    steps: t.steps.map((s, i) => ({ id: `${t._id}-${i}`, text: s.text, done: s.done })),
  };
}

export const plantDetail = query({
  args: { plantId: v.id('plants') },
  handler: async (ctx, { plantId }): Promise<PlantDetail | null> => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const plant = await ctx.db.get(plantId);
    if (!plant || !(await canAccessPlant(ctx, user, plant))) return null;
    const space = await ctx.db.get(plant.spaceId);
    if (!space) return null;
    const species = plant.speciesId ? await ctx.db.get(plant.speciesId) : null;
    const now = Date.now();

    const waterByPlant = await earliestOpenWaterForPlants(ctx, [plant]);
    const summary = await mapPlantSummary(ctx, plant, space, species, waterByPlant.get(plant._id), now);

    // open care tasks for this plant
    const tasks = await ctx.db
      .query('careTasks')
      .withIndex('by_plant', (q) => q.eq('plantId', plant._id))
      .collect();
    const openTasks = tasks
      .filter((t) => t.status === 'due' || t.status === 'snoozed')
      .sort((a, b) => a.dueAt - b.dueAt)
      .map((t) => mapCareTaskItem(t, summary, now));

    // photos → journal + timeline + photoUrls
    const photos = await ctx.db
      .query('plantPhotos')
      .withIndex('by_plant', (q) => q.eq('plantId', plant._id))
      .collect();
    photos.sort((a, b) => b.takenAt - a.takenAt);
    const photoUrls: string[] = [];
    const journal: PlantDetail['journal'] = [];
    const timeline: PlantDetail['timeline'] = [];
    for (const p of photos) {
      const u = p.storageId ? (await ctx.storage.getUrl(p.storageId)) ?? undefined : undefined;
      if (u) photoUrls.push(u);
      if (p.note) journal.push({ id: p._id, note: p.note, atLabel: relativeLabel(p.takenAt, now) });
      // text-only notes live in the Journal only; the Timeline shows photo/milestone entries
      if (p.storageId || p.title) timeline.push({ id: p._id, photoUrl: u, atLabel: relativeLabel(p.takenAt, now), title: p.title, note: p.note });
    }

    // latest active treatment
    const treatments = await ctx.db
      .query('treatments')
      .withIndex('by_plant', (q) => q.eq('plantId', plant._id))
      .collect();
    const active = treatments.filter((t) => t.status === 'active').sort((a, b) => b.createdAt - a.createdAt)[0];

    const careGuide = species
      ? {
          light:
            species.careProfile.light === 'direct'
              ? 'Direct sun'
              : species.careProfile.light === 'shade'
                ? 'Low light'
                : 'Bright indirect',
          water: `Every ${species.careProfile.waterDays} days`,
          humidity: species.careProfile.humidityRange
            ? `${species.careProfile.humidityRange.min}–${species.careProfile.humidityRange.max}%`
            : '40–60%',
        }
      : undefined;

    // About tab: the owner's description as the lead, plus any species facts we know.
    const facts: { label: string; value: string }[] = [];
    const notes: string[] = species?.funFacts ? [...species.funFacts] : [];
    let source: { label: string; url?: string } | undefined;
    if (species) {
      const fam = species.taxonomy?.family ?? species.family;
      if (fam) facts.push({ label: 'Family', value: fam });
      if (species.taxonomy?.genus) facts.push({ label: 'Genus', value: species.taxonomy.genus });
      if (species.origin) facts.push({ label: 'Origin', value: species.origin });
      if (careGuide) facts.push({ label: 'Light', value: careGuide.light });
      facts.push({ label: 'Difficulty', value: cap(species.careProfile.difficulty) });
      const pet =
        petSafetyFromToxicity(species.toxicity) ??
        (species.careProfile.petSafe === true ? 'Yes' : species.careProfile.petSafe === false ? 'Caution' : undefined);
      if (pet) facts.push({ label: 'Pet-safe', value: pet });
      if (species.soilText) facts.push({ label: 'Soil', value: shorten(species.soilText) });

      if (!species.funFacts?.length) {
        if (species.lightText) notes.push(species.lightText);
        if (species.soilText) notes.push(species.soilText);
        if (species.toxicity) notes.push(species.toxicity);
      }

      if (species.description) {
        source = { label: species.description.licenseName ?? 'Source', url: species.description.licenseUrl ?? species.description.citation };
      }
    }
    const aboutLead =
      species?.description?.value ?? plant.description ?? `Notes about ${summary.nickname ?? 'this plant'} will appear here.`;
    const about =
      species?.description?.value || plant.description || facts.length || notes.length
        ? { lead: aboutLead, facts, notes, source }
        : undefined;

    return {
      ...summary,
      description: plant.description,
      photoUrls,
      potSizeCm: plant.potSizeCm,
      soilType: plant.soilType,
      careTasks: openTasks,
      treatment: active ? mapTreatment(active) : undefined,
      journal,
      timeline,
      careGuide,
      about,
    };
  },
});

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function shorten(s: string, max = 48): string {
  const first = s.split(/[.;]/)[0].trim();
  return first.length <= max ? first : `${first.slice(0, max - 1).trimEnd()}…`;
}

// ── Owner edits ──────────────────────────────────────────────────────────────

/** Load a plant the signed-in user owns, or throw. */
async function ownedPlantOrThrow(ctx: MutationCtx, plantId: Id<'plants'>): Promise<Doc<'plants'>> {
  const user = await getCurrentUserOrThrow(ctx);
  const plant = await ctx.db.get(plantId);
  if (!plant || plant.userId !== user._id) throw new Error('Plant not found');
  return plant;
}

/** Reuse a species row by exact scientific name, or create a minimal user-supplied one. */
async function getOrCreateSpeciesByName(ctx: MutationCtx, scientificName: string): Promise<Id<'species'>> {
  const name = scientificName.trim();
  const existing = await ctx.db
    .query('species')
    .withIndex('by_scientificName', (q) => q.eq('scientificName', name))
    .first();
  if (existing) return existing._id;
  return ctx.db.insert('species', {
    scientificName: name,
    commonNames: [],
    careProfile: { light: 'indirect', waterDays: 7, difficulty: 'medium' },
    source: 'ai',
    verified: false,
  });
}

/** Edit a plant's nickname, description, and/or scientific name (species reassignment). */
export const updatePlant = mutation({
  args: {
    plantId: v.id('plants'),
    nickname: v.optional(v.string()),
    description: v.optional(v.string()),
    scientificName: v.optional(v.string()),
  },
  handler: async (ctx, { plantId, nickname, description, scientificName }) => {
    const plant = await ownedPlantOrThrow(ctx, plantId);
    const patch: Partial<Doc<'plants'>> = {};
    if (nickname !== undefined) {
      const n = nickname.trim();
      patch.nickname = n.length ? n : undefined;
    }
    if (description !== undefined) {
      const d = description.trim();
      patch.description = d.length ? d : undefined;
    }
    if (scientificName !== undefined) {
      const s = scientificName.trim();
      patch.speciesId = s.length ? await getOrCreateSpeciesByName(ctx, s) : undefined;
    }
    await ctx.db.patch(plant._id, patch);
  },
});

/**
 * Add a new plant to the garden (the Garden capture flow: AI Identify or Add manually).
 * Resolves a target space — explicit `spaceId`, else the first space of the user's active location.
 * A scientific name resolves/creates the species; nickname & description are optional free text.
 */
export const createPlant = mutation({
  args: {
    nickname: v.optional(v.string()),
    scientificName: v.optional(v.string()),
    description: v.optional(v.string()),
    spaceId: v.optional(v.id('spaces')),
    speciesId: v.optional(v.id('species')),
    coverStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, { nickname, scientificName, description, spaceId, speciesId, coverStorageId }): Promise<Id<'plants'>> => {
    const user = await getCurrentUserOrThrow(ctx);

    let space: Doc<'spaces'> | null = null;
    if (spaceId) {
      space = await ctx.db.get(spaceId);
      if (!space || space.userId !== user._id) throw new Error('Space not found');
    } else {
      const spaces = (
        await ctx.db.query('spaces').withIndex('by_user', (q) => q.eq('userId', user._id)).collect()
      ).sort((a, b) => a.order - b.order);
      const locations = await ctx.db
        .query('locations')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      const active = locations.filter((l) => l.status === 'active').sort((a, b) => a.order - b.order)[0] ?? locations[0];
      space = (active ? spaces.find((s) => s.locationId === active._id) : undefined) ?? spaces[0] ?? null;
    }
    if (!space) throw new Error('No space to add the plant to — finish onboarding first.');

    const sci = scientificName?.trim();
    const nick = nickname?.trim();
    const desc = description?.trim();

    // Prefer an explicitly-resolved species (from identify); else resolve by name; else none.
    let resolvedSpeciesId = speciesId;
    if (!resolvedSpeciesId && sci) resolvedSpeciesId = await getOrCreateSpeciesByName(ctx, sci);
    if (resolvedSpeciesId) {
      const sp = await ctx.db.get(resolvedSpeciesId);
      if (!sp) throw new Error('Species not found');
    }

    const plantId = await ctx.db.insert('plants', {
      userId: user._id,
      spaceId: space._id,
      speciesId: resolvedSpeciesId,
      nickname: nick || undefined,
      description: desc || undefined,
      coverStorageId: coverStorageId ?? undefined,
      tags: [],
      status: 'alive',
    });
    if (coverStorageId) {
      await ctx.db.insert('plantPhotos', { plantId, userId: user._id, storageId: coverStorageId, takenAt: Date.now() });
    }
    return plantId;
  },
});

/** Delete a plant and its owned children (care plans/tasks, photos, treatments). */
export const deletePlant = mutation({
  args: { plantId: v.id('plants') },
  handler: async (ctx, { plantId }) => {
    const plant = await ownedPlantOrThrow(ctx, plantId);
    for (const table of ['careTasks', 'carePlans', 'plantPhotos', 'treatments'] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex('by_plant', (q) => q.eq('plantId', plant._id))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
    await ctx.db.delete(plant._id);
  },
});

/** Short-lived URL the client POSTs a photo to before calling addPlantPhoto. */
export const generatePlantUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/** Add a text-only journal note (no photo) to a plant. */
export const addJournalNote = mutation({
  args: { plantId: v.id('plants'), note: v.string() },
  handler: async (ctx, { plantId, note }) => {
    const plant = await ownedPlantOrThrow(ctx, plantId);
    const text = note.trim();
    if (!text) return;
    await ctx.db.insert('plantPhotos', { plantId: plant._id, userId: plant.userId, note: text, takenAt: Date.now() });
  },
});

/** Attach an uploaded photo to a plant; promote it to cover when asked (or when there's none). */
export const addPlantPhoto = mutation({
  args: { plantId: v.id('plants'), storageId: v.id('_storage'), setCover: v.optional(v.boolean()) },
  handler: async (ctx, { plantId, storageId, setCover }) => {
    const plant = await ownedPlantOrThrow(ctx, plantId);
    await ctx.db.insert('plantPhotos', {
      plantId: plant._id,
      userId: plant.userId,
      storageId,
      takenAt: Date.now(),
    });
    if (setCover || !plant.coverStorageId) await ctx.db.patch(plant._id, { coverStorageId: storageId });
  },
});

const DAY = 24 * 60 * 60 * 1000;
function relativeLabel(at: number, now: number): string {
  const diff = now - at;
  if (diff < DAY) return 'Today';
  const days = Math.round(diff / DAY);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  const months = Math.round(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}
