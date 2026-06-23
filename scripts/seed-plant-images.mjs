/**
 * Seeds the dev user's garden from local images: one plant per file in plants-images/,
 * spread across Indoor / Outdoor / Greenhouse, with each image uploaded to Convex _storage
 * as the plant's cover.
 *
 * Prereq: signed in once in the app (so a users row exists) + `npx convex dev` has deployed.
 * Run:   node scripts/seed-plant-images.mjs
 */
import { ConvexHttpClient } from 'convex/browser';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from '../convex/_generated/api.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES_DIR = join(root, 'plants-images');

// Read the Convex URL from .env.local
const env = readFileSync(join(root, '.env.local'), 'utf8');
const url = (env.match(/^EXPO_PUBLIC_CONVEX_URL=(.+)$/m) || env.match(/^CONVEX_URL=(.+)$/m))?.[1]?.trim();
if (!url) throw new Error('EXPO_PUBLIC_CONVEX_URL not found in .env.local');

const NICKNAMES = [
  'Mara', 'Fiddle', 'Pancake', 'Olive', 'Fern', 'Jade', 'Ivy', 'Aloe', 'Sage', 'Basil',
  'Rosemary', 'Thyme', 'Lily', 'Palmer', 'Cactus', 'Hosta', 'Pothos', 'Zee', 'Snake', 'Mint',
  'Calla', 'Ruby', 'Willow', 'Clover', 'Dahlia', 'Maple', 'Hazel', 'Juniper', 'Pepper', 'Coral',
];

const client = new ConvexHttpClient(url);

const files = readdirSync(IMAGES_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
console.log(`Found ${files.length} images. Preparing garden…`);

const { spaces, species } = await client.mutation(api.seed.prepareGarden, {});
// spaces = [Home/indoor, Home/outdoor, Home/greenhouse, Studio/indoor, Studio/outdoor, Studio/greenhouse]
const spaceNames = ['Home·Indoor', 'Home·Outdoor', 'Home·Greenhouse', 'Studio·Indoor', 'Studio·Outdoor', 'Studio·Greenhouse'];

let created = 0;
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const ext = file.split('.').pop().toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  try {
    const uploadUrl = await client.mutation(api.seed.generateUploadUrl, {});
    const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': contentType }, body: readFileSync(join(IMAGES_DIR, file)) });
    if (!res.ok) throw new Error(`upload ${res.status}`);
    const { storageId } = await res.json();
    const waterInDays = i % 3 === 0 ? -1 : i % 3 === 1 ? (i % 6) + 1 : undefined;
    const slot = i % spaces.length;
    await client.mutation(api.seed.addPlantWithCover, {
      storageId,
      spaceId: spaces[slot],
      speciesId: species[i % species.length],
      nickname: NICKNAMES[i % NICKNAMES.length],
      waterInDays,
      treatment: i % 4 === 0, // Dr. Plant treatment on ~1 in 4 plants
    });
    created++;
    console.log(`  ${created}/${files.length} ${NICKNAMES[i % NICKNAMES.length]} → ${spaceNames[slot]}${i % 4 === 0 ? ' (treatment)' : ''}`);
  } catch (e) {
    console.warn(`  ! skipped ${file}: ${e.message}`);
  }
}

console.log(`Done. Created ${created} plants with covers.`);
