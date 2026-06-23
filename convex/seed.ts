/**
 * seedDevUser — seeds the signed-in dev user with 20 plants + care plans/tasks, the Mara
 * treatment, and 3 community posts, then downloads a cover photo for each plant into Convex
 * `_storage` and sets `coverStorageId`. Idempotent (wipes the dev user's owned rows first).
 *
 * Run AFTER signing in once:  npx convex run seed:seedDevUser
 *
 * Images come from picsum.photos (stable per-plant seed). Swap the URL in `coverUrlFor` for real
 * plant photos any time — the storage pipeline is the same.
 */
import { internalAction, internalMutation, mutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import type { MutationCtx } from './_generated/server';
import type { Doc, Id, TableNames } from './_generated/dataModel';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

type SpeciesSeed = {
  key: string;
  scientificName: string;
  common: string;
  waterDays: number;
  light: 'direct' | 'indirect' | 'shade';
  difficulty: 'easy' | 'medium' | 'hard';
};

const SPECIES: SpeciesSeed[] = [
  { key: 's1', scientificName: 'Ficus lyrata', common: 'Fiddle-leaf fig', waterDays: 7, light: 'indirect', difficulty: 'medium' },
  { key: 's2', scientificName: 'Monstera deliciosa', common: 'Swiss cheese plant', waterDays: 7, light: 'indirect', difficulty: 'easy' },
  { key: 's3', scientificName: 'Pilea peperomioides', common: 'Chinese money plant', waterDays: 7, light: 'indirect', difficulty: 'easy' },
  { key: 's4', scientificName: 'Salvia rosmarinus', common: 'Rosemary', waterDays: 5, light: 'direct', difficulty: 'easy' },
  { key: 's5', scientificName: 'Ocimum basilicum', common: 'Basil', waterDays: 3, light: 'direct', difficulty: 'medium' },
  { key: 's6', scientificName: 'Zamioculcas zamiifolia', common: 'ZZ plant', waterDays: 14, light: 'shade', difficulty: 'easy' },
  { key: 's7', scientificName: 'Dracaena trifasciata', common: 'Snake plant', waterDays: 14, light: 'shade', difficulty: 'easy' },
];

type SpaceKey = 'living' | 'balcony' | 'office' | 'greenhouse';
const SPACE_KEYS: SpaceKey[] = ['living', 'balcony', 'office', 'greenhouse'];

// 20 plants, distributed across spaces, with varied water states (deterministic, no RNG).
const NICKNAMES = [
  'Fiddle', 'Mara', 'Pancake', 'Rosemary', 'Basil', 'Zee', 'Snake', 'Ivy', 'Fern', 'Cactus',
  'Aloe', 'Olive', 'Mint', 'Lily', 'Palmer', 'Jade', 'Hosta', 'Sage', 'Thyme', 'Pothos',
];

type WaterPlan = 'overdue' | number | 'none';
type PlantSeed = { nickname: string; speciesKey: string; spaceKey: SpaceKey; water: WaterPlan; imageSeed: string };

const PLANTS: PlantSeed[] = NICKNAMES.map((nickname, i) => ({
  nickname,
  speciesKey: SPECIES[i % SPECIES.length].key,
  spaceKey: SPACE_KEYS[i % SPACE_KEYS.length],
  water: i % 3 === 0 ? 'overdue' : i % 3 === 1 ? ((i % 6) + 1) : 'none',
  imageSeed: `evergreen-${nickname.toLowerCase()}`,
}));

const COMMUNITY = [
  { clerkId: 'seed_fernfiend', handle: 'fernfiend', name: 'Fern Fiend', caption: 'New leaf unfurled this morning — third one this month. Patience pays off.', likeCount: 142, ageHours: 2, follow: true, save: false },
  { clerkId: 'seed_leaflydia', handle: 'leaf.lydia', name: 'Leaf Lydia', caption: 'Finally rooted my Pilea babies. Swapping a few — DM if you’re local.', likeCount: 88, ageHours: 5, follow: false, save: false },
  { clerkId: 'seed_pottedpete', handle: 'potted.pete', name: 'Potted Pete', caption: 'Week 3 of the #BrightWindow challenge. The calathea is loving it.', likeCount: 203, ageHours: 24, follow: false, save: true },
];

async function deleteAll<T extends TableNames>(ctx: MutationCtx, rows: Doc<T>[]) {
  for (const r of rows) await ctx.db.delete(r._id);
}

async function wipeOwned(ctx: MutationCtx, userId: Id<'users'>) {
  await deleteAll(ctx, await ctx.db.query('careTasks').withIndex('by_user_due', (q) => q.eq('userId', userId)).collect());
  await deleteAll(ctx, await ctx.db.query('carePlans').withIndex('by_user', (q) => q.eq('userId', userId)).collect());
  await deleteAll(ctx, await ctx.db.query('treatments').withIndex('by_user', (q) => q.eq('userId', userId)).collect());
  await deleteAll(ctx, await ctx.db.query('plants').withIndex('by_user', (q) => q.eq('userId', userId)).collect());
  await deleteAll(ctx, await ctx.db.query('spaces').withIndex('by_user', (q) => q.eq('userId', userId)).collect());
  await deleteAll(ctx, await ctx.db.query('locations').withIndex('by_user', (q) => q.eq('userId', userId)).collect());
}

async function getOrCreateSpecies(ctx: MutationCtx, s: SpeciesSeed): Promise<Id<'species'>> {
  const existing = await ctx.db.query('species').withIndex('by_scientificName', (q) => q.eq('scientificName', s.scientificName)).unique();
  if (existing) return existing._id;
  return ctx.db.insert('species', {
    scientificName: s.scientificName,
    commonNames: [s.common],
    careProfile: { light: s.light, waterDays: s.waterDays, difficulty: s.difficulty, humidityRange: { min: 40, max: 60 } },
    source: 'seed',
    verified: true,
  });
}

async function getOrCreateUserByHandle(ctx: MutationCtx, c: { clerkId: string; handle: string; name: string }): Promise<Id<'users'>> {
  const existing = await ctx.db.query('users').withIndex('by_handle', (q) => q.eq('handle', c.handle)).unique();
  if (existing) return existing._id;
  return ctx.db.insert('users', {
    clerkId: c.clerkId, name: c.name, handle: c.handle, role: 'user', entitlement: 'free',
    aiIdsThisPeriod: 0, aiIdsPeriodStart: Date.now(), streakCount: 0,
    notificationPrefs: { care: true, community: true, chat: true },
  });
}

/** Creates all rows (no images). Returns the plant ids + their image seeds for the action to cover. */
export const createSeedData = internalMutation({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, { clerkId }): Promise<{ plants: { plantId: Id<'plants'>; imageSeed: string }[] }> => {
    const user = clerkId
      ? await ctx.db.query('users').withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId)).unique()
      : (await ctx.db.query('users').collect()).find((u) => !u.clerkId.startsWith('seed_')) ?? null;
    if (!user) throw new Error('No users row — sign in once (ensureUser) before seeding.');

    await ctx.db.patch(user._id, { name: 'Sorin C.', handle: 'sorin.grows', entitlement: 'free', streakCount: 12, bestStreak: 21, tasksDoneTotal: 248 });
    await wipeOwned(ctx, user._id);

    const now = Date.now();
    const speciesId: Record<string, Id<'species'>> = {};
    for (const s of SPECIES) speciesId[s.key] = await getOrCreateSpecies(ctx, s);

    const homeId = await ctx.db.insert('locations', {
      userId: user._id, name: 'Home', climate: { label: 'Lisbon', lat: 38.72, lon: -9.14 },
      gardeningLevel: 'intermediate', goals: ['alive'], status: 'active', order: 0,
    });
    await ctx.db.insert('locations', {
      userId: user._id, name: 'Holiday house', climate: { label: 'Sintra', lat: 38.8, lon: -9.39 },
      gardeningLevel: 'beginner', goals: [], status: 'locked', order: 1,
    });

    const spaceId: Record<SpaceKey, Id<'spaces'>> = {
      living: await ctx.db.insert('spaces', { userId: user._id, locationId: homeId, place: 'indoor', name: 'Living Room', order: 0 }),
      balcony: await ctx.db.insert('spaces', { userId: user._id, locationId: homeId, place: 'outdoor', name: 'Balcony', order: 1 }),
      office: await ctx.db.insert('spaces', { userId: user._id, locationId: homeId, place: 'indoor', name: 'Office', order: 2 }),
      greenhouse: await ctx.db.insert('spaces', { userId: user._id, locationId: homeId, place: 'greenhouse', name: 'Greenhouse', order: 3 }),
    };

    const out: { plantId: Id<'plants'>; imageSeed: string }[] = [];
    for (const p of PLANTS) {
      const sid = speciesId[p.speciesKey];
      const plantId = await ctx.db.insert('plants', {
        userId: user._id, spaceId: spaceId[p.spaceKey], speciesId: sid, nickname: p.nickname, tags: [], status: 'alive',
      });
      const carePlanId = await ctx.db.insert('carePlans', {
        plantId, userId: user._id,
        generatedFrom: { speciesId: sid, locationId: homeId, climate: 'Lisbon', place: p.spaceKey === 'balcony' ? 'outdoor' : 'indoor', level: 'intermediate' },
        baseWaterDays: SPECIES.find((s) => s.key === p.speciesKey)!.waterDays, seasonalMultiplier: 1, updatedAt: now,
      });
      const addTask = (type: Doc<'careTasks'>['type'], dueAt: number) =>
        ctx.db.insert('careTasks', { carePlanId, plantId, userId: user._id, type, dueAt, status: 'due' });
      if (p.water === 'overdue') await addTask('water', now - 1 * DAY);
      else if (typeof p.water === 'number') await addTask('water', now + p.water * DAY);

      if (p.nickname === 'Mara') {
        await addTask('mist', now + 6 * HOUR);
        await ctx.db.insert('treatments', {
          plantId, userId: user._id, diagnosis: 'Spider mites', issueType: 'pest', severity: 'medium',
          steps: [
            { text: 'Isolate from other plants', done: true },
            { text: 'Wipe leaves, both sides', done: true },
            { text: 'Apply neem oil weekly', done: false },
            { text: 'Raise humidity around the plant', done: false },
            { text: 'Re-check in 2 weeks', done: false },
          ],
          status: 'active', createdAt: now - 3 * DAY,
        });
      }
      out.push({ plantId, imageSeed: p.imageSeed });
    }

    for (const c of COMMUNITY) {
      const authorId = await getOrCreateUserByHandle(ctx, c);
      const existingPosts = await ctx.db.query('posts').withIndex('by_user', (q) => q.eq('userId', authorId)).collect();
      const already = existingPosts.find((pp) => pp.caption === c.caption);
      const postId = already?._id ?? (await ctx.db.insert('posts', {
        userId: authorId, caption: c.caption, photoStorageIds: [], likeCount: c.likeCount, moderation: 'ok', createdAt: now - c.ageHours * HOUR,
      }));
      if (c.follow) {
        const f = await ctx.db.query('follows').withIndex('by_follower', (q) => q.eq('followerId', user._id)).collect();
        if (!f.some((x) => x.followeeId === authorId)) await ctx.db.insert('follows', { followerId: user._id, followeeId: authorId });
      }
      if (c.save) {
        const s = await ctx.db.query('saves').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
        if (!s.some((x) => x.postId === postId)) await ctx.db.insert('saves', { userId: user._id, postId });
      }
    }

    return { plants: out };
  },
});

// ── Image-directory seeding (DEV ONLY — public, no auth) ─────────────────────────
// Used by scripts/seed-plant-images.mjs to upload local images and create a plant per image.
// Resolve the single real (non-seed) user server-side so the client never passes a userId.

async function resolveDevUser(ctx: MutationCtx): Promise<Doc<'users'>> {
  const user = (await ctx.db.query('users').collect()).find((u) => !u.clerkId.startsWith('seed_'));
  if (!user) throw new Error('No users row — sign in once before seeding.');
  return user;
}

/** Wipe the dev garden and create the 3 spaces + species + community. Returns ids for the script. */
export const prepareGarden = mutation({
  args: {},
  handler: async (ctx): Promise<{ spaces: Id<'spaces'>[]; species: Id<'species'>[] }> => {
    const user = await resolveDevUser(ctx);
    // Premium account so multiple locations + Dr. Plant are unlocked.
    await ctx.db.patch(user._id, { name: 'Sorin C.', handle: 'sorin.grows', entitlement: 'plus', streakCount: 12, bestStreak: 21, tasksDoneTotal: 248 });
    await wipeOwned(ctx, user._id);

    const speciesIds: Id<'species'>[] = [];
    for (const s of SPECIES) speciesIds.push(await getOrCreateSpecies(ctx, s));

    // Two ACTIVE locations (premium). Each gets indoor / outdoor / greenhouse spaces.
    const mkSpaces = async (locationId: Id<'locations'>): Promise<Id<'spaces'>[]> => [
      await ctx.db.insert('spaces', { userId: user._id, locationId, place: 'indoor', name: 'Living Room', order: 0 }),
      await ctx.db.insert('spaces', { userId: user._id, locationId, place: 'outdoor', name: 'Balcony', order: 1 }),
      await ctx.db.insert('spaces', { userId: user._id, locationId, place: 'greenhouse', name: 'Greenhouse', order: 2 }),
    ];
    const homeId = await ctx.db.insert('locations', {
      userId: user._id, name: 'Home', climate: { label: 'Lisbon', lat: 38.72, lon: -9.14 },
      gardeningLevel: 'intermediate', goals: ['alive'], status: 'active', order: 0,
    });
    const studioId = await ctx.db.insert('locations', {
      userId: user._id, name: 'Studio', climate: { label: 'Porto', lat: 41.15, lon: -8.61 },
      gardeningLevel: 'expert', goals: ['grow'], status: 'active', order: 1,
    });
    const spaces = [...(await mkSpaces(homeId)), ...(await mkSpaces(studioId))]; // 6 spaces across 2 locations

    const now = Date.now();
    for (const c of COMMUNITY) {
      const authorId = await getOrCreateUserByHandle(ctx, c);
      const existing = await ctx.db.query('posts').withIndex('by_user', (q) => q.eq('userId', authorId)).collect();
      const postId = existing.find((pp) => pp.caption === c.caption)?._id
        ?? (await ctx.db.insert('posts', { userId: authorId, caption: c.caption, photoStorageIds: [], likeCount: c.likeCount, moderation: 'ok', createdAt: now - c.ageHours * HOUR }));
      if (c.follow) {
        const f = await ctx.db.query('follows').withIndex('by_follower', (q) => q.eq('followerId', user._id)).collect();
        if (!f.some((x) => x.followeeId === authorId)) await ctx.db.insert('follows', { followerId: user._id, followeeId: authorId });
      }
      if (c.save) {
        const sv = await ctx.db.query('saves').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();
        if (!sv.some((x) => x.postId === postId)) await ctx.db.insert('saves', { userId: user._id, postId });
      }
    }
    return { spaces, species: speciesIds };
  },
});

/** Short-lived URL the script POSTs an image file to. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

/** Create one plant (with cover + a water task) from an uploaded image. */
export const addPlantWithCover = mutation({
  args: {
    storageId: v.id('_storage'),
    spaceId: v.id('spaces'),
    speciesId: v.id('species'),
    nickname: v.string(),
    waterInDays: v.optional(v.number()), // -1 = overdue, undefined = healthy (no open water task)
    treatment: v.optional(v.boolean()), // Dr. Plant diagnosis with a multi-step treatment
  },
  handler: async (ctx, { storageId, spaceId, speciesId, nickname, waterInDays, treatment }) => {
    const user = await resolveDevUser(ctx);
    const now = Date.now();
    const plantId = await ctx.db.insert('plants', {
      userId: user._id, spaceId, speciesId, nickname, coverStorageId: storageId, tags: [], status: 'alive',
    });
    if (treatment) {
      const DIAGS = [
        { diagnosis: 'Spider mites', issueType: 'pest' as const, severity: 'medium' as const },
        { diagnosis: 'Root rot', issueType: 'disease' as const, severity: 'high' as const },
        { diagnosis: 'Nitrogen deficiency', issueType: 'deficiency' as const, severity: 'low' as const },
      ];
      const d = DIAGS[nickname.length % DIAGS.length];
      await ctx.db.insert('treatments', {
        plantId, userId: user._id, diagnosis: d.diagnosis, issueType: d.issueType, severity: d.severity,
        steps: [
          { text: 'Isolate from other plants', done: true },
          { text: 'Remove affected leaves', done: true },
          { text: 'Apply treatment weekly', done: false },
          { text: 'Adjust light & humidity', done: false },
          { text: 'Re-check in 2 weeks', done: false },
        ],
        status: 'active', createdAt: now - 3 * DAY,
      });
    }
    const carePlanId = await ctx.db.insert('carePlans', {
      plantId, userId: user._id,
      generatedFrom: { speciesId, locationId: (await ctx.db.get(spaceId))!.locationId, climate: 'Lisbon', place: 'indoor', level: 'intermediate' },
      baseWaterDays: 7, seasonalMultiplier: 1, updatedAt: now,
    });
    if (waterInDays !== undefined) {
      await ctx.db.insert('careTasks', {
        carePlanId, plantId, userId: user._id, type: 'water',
        dueAt: waterInDays < 0 ? now - DAY : now + waterInDays * DAY, status: 'due',
      });
    }
    return plantId;
  },
});

/** Patch a plant's cover after the action stored its photo. */
export const setPlantCover = internalMutation({
  args: { plantId: v.id('plants'), storageId: v.id('_storage') },
  handler: async (ctx, { plantId, storageId }) => {
    await ctx.db.patch(plantId, { coverStorageId: storageId });
    return null;
  },
});

// ── About / Timeline / Journal enrichment (DEV ONLY — public, no auth) ───────────
// Fills in About copy (plant.description + species family/origin/funFacts) and inserts a set of
// Timeline + Journal photo entries per plant. Idempotent: re-running replaces the photo entries.

type SpeciesAbout = { family: string; origin: string; lead: string; funFacts: string[] };
const SPECIES_ABOUT: Record<string, SpeciesAbout> = {
  'Ficus lyrata': {
    family: 'Moraceae', origin: 'Lowland rainforest, West Africa',
    lead: 'The fiddle-leaf fig is a sculptural statement plant, prized for its large, violin-shaped leaves. It rewards a steady routine and bright, indirect light.',
    funFacts: ['Hates being moved — pick a spot and leave it there.', 'Dust the broad leaves so they can soak up light.', 'In the wild it can grow into a 12m tree.'],
  },
  'Monstera deliciosa': {
    family: 'Araceae', origin: 'Tropical forests, southern Mexico',
    lead: 'The Swiss cheese plant is a fast, forgiving climber. Its iconic split leaves (fenestrations) appear as it matures and gets enough light.',
    funFacts: ['The leaf holes are called fenestrations.', 'Give it a moss pole to climb and leaves grow bigger.', 'Ripe fruit tastes like a fruit-salad mix — hence “deliciosa”.'],
  },
  'Pilea peperomioides': {
    family: 'Urticaceae', origin: 'Yunnan Province, China',
    lead: 'The Chinese money plant is a cheerful, easy grower with round, coin-like leaves. It readily produces “pups” you can share with friends.',
    funFacts: ['Famous for sprouting baby plants you can pass on.', 'Rotate it weekly so it grows evenly.', 'Also called the “pass-it-on plant”.'],
  },
  'Salvia rosmarinus': {
    family: 'Lamiaceae', origin: 'Mediterranean coast',
    lead: 'Rosemary is a fragrant, woody herb that thrives on sun and sharp drainage. Snip sprigs often to keep it bushy and productive.',
    funFacts: ['Loves full sun and dislikes wet feet.', 'Regular trimming keeps it from getting leggy.', 'The name means “dew of the sea”.'],
  },
  'Ocimum basilicum': {
    family: 'Lamiaceae', origin: 'Tropical Asia & Africa',
    lead: 'Basil is a tender, aromatic annual that grows quickly in warmth and sun. Pinch the tops regularly to delay flowering and boost leaf growth.',
    funFacts: ['Pinch off flower buds to keep leaves tasty.', 'Loves warmth — keep it away from cold draughts.', 'Harvest from the top down to encourage bushiness.'],
  },
  'Zamioculcas zamiifolia': {
    family: 'Araceae', origin: 'Eastern Africa',
    lead: 'The ZZ plant is nearly indestructible — glossy leaves, drought tolerance, and happy in low light. The ideal plant for forgetful waterers.',
    funFacts: ['Stores water in potato-like rhizomes.', 'Tolerates low light better than almost any plant.', 'Let the soil dry fully between waterings.'],
  },
  'Dracaena trifasciata': {
    family: 'Asparagaceae', origin: 'West Africa',
    lead: 'The snake plant is an architectural, tough survivor with upright, sword-like leaves. It shrugs off neglect and even cleans the air at night.',
    funFacts: ['Releases oxygen at night, unlike most plants.', 'Overwatering is the only real way to kill it.', 'Also known as “mother-in-law’s tongue”.'],
  },
};
const GENERIC_ABOUT: SpeciesAbout = {
  family: 'Plantae', origin: 'Cultivated houseplant',
  lead: 'A lovely, easygoing houseplant. Give it bright, indirect light, water when the top of the soil dries out, and it will reward you with steady new growth.',
  funFacts: ['Check the top inch of soil before watering.', 'Rotate occasionally for even growth.', 'Wipe leaves now and then so they can breathe.'],
};

// A varied set of upcoming care tasks so every plant's "Up next" has something to show.
type TaskSeed = { type: Doc<'careTasks'>['type']; inDays: number };
const UP_NEXT: TaskSeed[][] = [
  [{ type: 'fertilize', inDays: 5 }, { type: 'rotate', inDays: 2 }],
  [{ type: 'mist', inDays: 1 }, { type: 'prune', inDays: 9 }],
  [{ type: 'fertilize', inDays: 4 }, { type: 'mist', inDays: 7 }, { type: 'rotate', inDays: 12 }],
  [{ type: 'clean', inDays: 3 }, { type: 'rotate', inDays: 8 }],
  [{ type: 'mist', inDays: 2 }, { type: 'fertilize', inDays: 6 }, { type: 'repot', inDays: 20 }],
];

type PhotoSeed = { daysAgo: number; title: string; note: string };
const PHOTO_TIMELINE: PhotoSeed[] = [
  { daysAgo: 84, title: 'Brought home', note: 'Settled into a new spot by the window. Fingers crossed!' },
  { daysAgo: 52, title: 'Repotted', note: 'Moved up a pot size with fresh, well-draining soil.' },
  { daysAgo: 28, title: 'New growth', note: 'Spotted a fresh leaf unfurling — first one this season.' },
  { daysAgo: 11, title: 'Pruned', note: 'Tidied up a couple of tired leaves to redirect energy.' },
  { daysAgo: 3, title: 'Health check', note: 'Looking great — perky, deep-green leaves and firm stems.' },
];

/** Populate About copy + Timeline/Journal entries for every plant the dev user owns. */
export const enrichPlants = mutation({
  args: {},
  handler: async (ctx): Promise<{ plants: number; photos: number; tasks: number; species: number }> => {
    const user = await resolveDevUser(ctx);
    const now = Date.now();
    const plants = await ctx.db.query('plants').withIndex('by_user', (q) => q.eq('userId', user._id)).collect();

    const speciesTouched = new Set<string>();
    let photos = 0;
    let tasks = 0;

    for (let i = 0; i < plants.length; i++) {
      const plant = plants[i];
      const species = plant.speciesId ? await ctx.db.get(plant.speciesId) : null;
      const about = (species && SPECIES_ABOUT[species.scientificName]) || GENERIC_ABOUT;
      const common = species?.commonNames[0];
      const name = plant.nickname ?? common ?? 'This plant';

      // About: a personalised lead for the plant.
      const description = `${name}${common ? ` is our ${common.toLowerCase()}` : ''}. ${about.lead}`;
      await ctx.db.patch(plant._id, { description });

      // About facts/notes live on the species — enrich it once.
      if (species && !speciesTouched.has(species._id)) {
        speciesTouched.add(species._id);
        await ctx.db.patch(species._id, {
          family: species.family ?? about.family,
          origin: species.origin ?? about.origin,
          funFacts: species.funFacts && species.funFacts.length ? species.funFacts : about.funFacts,
        });
      }

      // Timeline + Journal come from plantPhotos. Replace any we previously seeded.
      const existing = await ctx.db.query('plantPhotos').withIndex('by_plant', (q) => q.eq('plantId', plant._id)).collect();
      for (const e of existing) await ctx.db.delete(e._id);

      if (plant.coverStorageId) {
        const count = 3 + (i % 3); // 3–5 entries, varied per plant
        for (const entry of PHOTO_TIMELINE.slice(0, count)) {
          await ctx.db.insert('plantPhotos', {
            plantId: plant._id,
            userId: user._id,
            storageId: plant.coverStorageId,
            title: entry.title,
            note: entry.note,
            takenAt: now - entry.daysAgo * DAY,
          });
          photos++;
        }
      }

      // "Up next": keep the water task (drives badges), refresh the upcoming care tasks.
      const plan = await ctx.db.query('carePlans').withIndex('by_plant', (q) => q.eq('plantId', plant._id)).first();
      const planTasks = await ctx.db.query('careTasks').withIndex('by_plant', (q) => q.eq('plantId', plant._id)).collect();
      for (const tk of planTasks) if (tk.type !== 'water') await ctx.db.delete(tk._id);
      if (plan) {
        for (const e of UP_NEXT[i % UP_NEXT.length]) {
          await ctx.db.insert('careTasks', {
            carePlanId: plan._id, plantId: plant._id, userId: user._id, type: e.type, dueAt: now + e.inDays * DAY, status: 'due',
          });
          tasks++;
        }
      }
    }

    return { plants: plants.length, photos, tasks, species: speciesTouched.size };
  },
});

/** Orchestrator: create rows, then download + store a cover photo per plant. */
export const seedDevUser = internalAction({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, { clerkId }): Promise<{ ok: boolean; plants: number; covered: number }> => {
    const { plants }: { plants: { plantId: Id<'plants'>; imageSeed: string }[] } = await ctx.runMutation(
      internal.seed.createSeedData,
      { clerkId },
    );
    let covered = 0;
    for (const p of plants) {
      try {
        const res = await fetch(`https://picsum.photos/seed/${p.imageSeed}/600/800`);
        if (!res.ok) continue;
        const blob = await res.blob();
        const storageId = await ctx.storage.store(blob);
        await ctx.runMutation(internal.seed.setPlantCover, { plantId: p.plantId, storageId });
        covered++;
      } catch {
        // leave this plant with a placeholder cover
      }
    }
    return { ok: true, plants: plants.length, covered };
  },
});
