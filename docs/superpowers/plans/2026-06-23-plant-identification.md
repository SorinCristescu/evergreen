# Plant Identification (Plant.id) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mocked "Identify" flow on the capture screen with real plant identification via the Plant.id (Kindwise) v3 API — captured photo → species + confidence + care guide → add to garden linked to a species, with the photo as cover.

**Architecture:** A Convex `action` (`identifyPlant`) reads the uploaded photo from storage, hashes it, checks a per-user cache, calls Plant.id over `fetch`, and persists results via an internal mutation that upserts a `species` row and inserts an `identifications` row. Pure parsing/mapping logic lives in a Convex-free module unit-tested with vitest. The capture screen uploads the frame, calls the action, and renders real results; "Add to Garden" links the plant to the upserted species and reuses the uploaded photo as cover. The UI is otherwise unchanged.

**Tech Stack:** Expo SDK 56 / React Native 0.85, Convex (default runtime, `fetch`), Plant.id v3, vitest (new, dev-only), TypeScript.

## Global Constraints

- Convex functions live in the **default runtime** — do NOT add `"use node";` (we only use `fetch`, which is available). Copied from spec.
- **Every** Convex function has argument validators. Copied from Convex guidelines.
- **Never** accept `userId` as an argument; derive the user server-side via `getCurrentUserOrThrow(ctx)` (queries/mutations only — NOT in actions, which lack `ctx.db`). Copied from guidelines.
- Actions must NOT use `ctx.db`; all DB access goes through `ctx.runQuery` / `ctx.runMutation`. `ctx.storage.get(storageId)` IS allowed in actions and returns `Blob | null`.
- **No new native modules** — keep everything JS/dev-only so NO new EAS dev build is required (vitest is dev-only). Copied from spec decision on image >2MP.
- `species.careProfile` exact shape: `{ light: 'direct'|'indirect'|'shade'; waterDays: number; humidityRange?: {min,max}; tempRange?: {min,max}; petSafe?: boolean; airPurifying?: boolean; difficulty: 'easy'|'medium'|'hard' }`. Copied from `convex/schema.ts:66-86`.
- Plant.id: `POST https://plant.id/api/v3/identification?details=common_names,taxonomy,watering,best_light_condition,best_soil_type,toxicity,description&language=en`, header `Api-Key: $PLANTID_API_KEY`, body `{ images: ["<base64>"], similar_images: true }`. Key set via `npx convex env set PLANTID_API_KEY <key>`.
- Scope: **Identify only**. No Diagnose, no care-task/care-plan generation (Today tasks are out of scope — linking a species only surfaces the care *guide* on plant detail).

---

### Task 1: Pure Plant.id mappers + vitest (TDD)

Pure, Convex-free functions for hashing the image and parsing/mapping the Plant.id response. These are the only unit-tested pieces.

**Files:**
- Create: `convex/lib/plantId.ts`
- Create: `convex/lib/plantId.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest` devDependency + `test` script)

**Interfaces:**
- Produces:
  - `fnv1aHex(bytes: Uint8Array): string`
  - `type RawCandidate = { scientificName: string; commonName?: string; confidence: number; careProfile: CareProfile }`
  - `type CareProfile = { light: 'direct'|'indirect'|'shade'; waterDays: number; difficulty: 'easy'|'medium'|'hard'; humidityRange?: { min: number; max: number } }`
  - `parsePlantIdResult(json: unknown): { isPlant: boolean; candidates: RawCandidate[] }`

- [ ] **Step 1: Add vitest dev dependency**

Run: `pnpm add -D vitest`
Expected: `vitest` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add the test script**

Edit `package.json` `scripts` to add (keep existing scripts):

```json
"test": "vitest run"
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['convex/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Write the failing tests**

Create `convex/lib/plantId.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fnv1aHex, parsePlantIdResult } from './plantId';

describe('fnv1aHex', () => {
  it('is stable and hex for the same bytes', () => {
    const a = fnv1aHex(new Uint8Array([1, 2, 3, 4]));
    const b = fnv1aHex(new Uint8Array([1, 2, 3, 4]));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]+$/);
  });
  it('differs for different bytes', () => {
    expect(fnv1aHex(new Uint8Array([1, 2, 3]))).not.toBe(fnv1aHex(new Uint8Array([1, 2, 4])));
  });
});

describe('parsePlantIdResult', () => {
  const base = {
    result: {
      is_plant: { binary: true, probability: 0.99 },
      classification: {
        suggestions: [
          {
            name: 'Monstera deliciosa',
            probability: 0.96,
            details: {
              common_names: ['Swiss cheese plant'],
              watering: { min: 2, max: 2 },
              best_light_condition: 'Thrives in bright, indirect light.',
            },
          },
          { name: 'Philodendron hederaceum', probability: 0.21, details: { common_names: [] } },
        ],
      },
    },
  };

  it('extracts is_plant and ranked candidates', () => {
    const r = parsePlantIdResult(base);
    expect(r.isPlant).toBe(true);
    expect(r.candidates).toHaveLength(2);
    expect(r.candidates[0].scientificName).toBe('Monstera deliciosa');
    expect(r.candidates[0].commonName).toBe('Swiss cheese plant');
    expect(r.candidates[0].confidence).toBeCloseTo(0.96);
  });

  it('maps watering=2 to ~7 waterDays and indirect light', () => {
    const cp = parsePlantIdResult(base).candidates[0].careProfile;
    expect(cp.waterDays).toBe(7);
    expect(cp.light).toBe('indirect');
    expect(cp.difficulty).toBe('medium');
  });

  it('defaults care profile when details are missing', () => {
    const cp = parsePlantIdResult(base).candidates[1].careProfile;
    expect(cp.waterDays).toBe(7);
    expect(cp.light).toBe('indirect');
  });

  it('flags not-a-plant', () => {
    const r = parsePlantIdResult({ result: { is_plant: { binary: false, probability: 0.02 }, classification: { suggestions: [] } } });
    expect(r.isPlant).toBe(false);
    expect(r.candidates).toEqual([]);
  });

  it('detects direct and shade light from text', () => {
    const mk = (text: string) => ({ result: { is_plant: { binary: true }, classification: { suggestions: [{ name: 'X', probability: 0.5, details: { best_light_condition: text } }] } } });
    expect(parsePlantIdResult(mk('Needs full direct sun all day')).candidates[0].careProfile.light).toBe('direct');
    expect(parsePlantIdResult(mk('Tolerates deep shade and low light')).candidates[0].careProfile.light).toBe('shade');
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './plantId'` (file not created yet).

- [ ] **Step 6: Implement the module**

Create `convex/lib/plantId.ts`:

```ts
/** Pure, Convex-free helpers for the Plant.id (Kindwise) v3 identification flow. Unit-tested. */

export type CareProfile = {
  light: 'direct' | 'indirect' | 'shade';
  waterDays: number;
  difficulty: 'easy' | 'medium' | 'hard';
  humidityRange?: { min: number; max: number };
};

export type RawCandidate = {
  scientificName: string;
  commonName?: string;
  confidence: number; // 0..1
  careProfile: CareProfile;
};

/** FNV-1a 32-bit hash → hex. Stable image fingerprint for the identifications cache. */
export function fnv1aHex(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Plant.id `watering` is a 1(dry)–3(wet) scale; map to a watering interval in days. */
function wateringToDays(watering: unknown): number {
  const max = (watering as { max?: number } | undefined)?.max;
  if (max === 3) return 3;
  if (max === 1) return 14;
  return 7; // 2 or unknown
}

/** Plant.id `best_light_condition` is free text; bucket into our enum. */
function lightFromText(text: unknown): CareProfile['light'] {
  const t = typeof text === 'string' ? text.toLowerCase() : '';
  if (t.includes('shade') || t.includes('low light')) return 'shade';
  if (t.includes('direct') || t.includes('full sun')) return 'direct';
  return 'indirect';
}

type Suggestion = {
  name?: string;
  probability?: number;
  details?: { common_names?: string[]; watering?: { min?: number; max?: number }; best_light_condition?: string };
};

/** Parse a Plant.id v3 identification response into is_plant + ranked, care-mapped candidates. */
export function parsePlantIdResult(json: unknown): { isPlant: boolean; candidates: RawCandidate[] } {
  const result = (json as { result?: { is_plant?: { binary?: boolean }; classification?: { suggestions?: Suggestion[] } } })?.result;
  const isPlant = result?.is_plant?.binary !== false;
  const suggestions = result?.classification?.suggestions ?? [];
  const candidates: RawCandidate[] = suggestions
    .filter((s): s is Suggestion & { name: string } => typeof s.name === 'string' && s.name.length > 0)
    .map((s) => ({
      scientificName: s.name,
      commonName: s.details?.common_names?.[0],
      confidence: typeof s.probability === 'number' ? s.probability : 0,
      careProfile: {
        light: lightFromText(s.details?.best_light_condition),
        waterDays: wateringToDays(s.details?.watering),
        difficulty: 'medium',
        humidityRange: { min: 40, max: 60 },
      },
    }));
  return { isPlant: isPlant && candidates.length > 0, candidates };
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all `plantId.test.ts` tests green.

- [ ] **Step 8: Commit**

```bash
git add convex/lib/plantId.ts convex/lib/plantId.test.ts vitest.config.ts package.json pnpm-lock.yaml
git commit -m "feat(identify): pure Plant.id mappers + vitest setup"
```

---

### Task 2: `createPlant` accepts `speciesId` + `coverStorageId`

Let the identify flow link a plant to an already-upserted species and reuse the already-uploaded photo as cover, without re-uploading or re-resolving by name.

**Files:**
- Modify: `convex/plants.ts` (the `createPlant` mutation, ~lines 253-294)

**Interfaces:**
- Produces: `createPlant({ nickname?, scientificName?, description?, spaceId?, speciesId?, coverStorageId? }) => Id<'plants'>`. When `speciesId` is provided it is used directly (skip name lookup). When `coverStorageId` is provided, a `plantPhotos` row is inserted and set as cover.

- [ ] **Step 1: Add the two optional args**

In `convex/plants.ts`, extend `createPlant`'s `args` (keep existing fields):

```ts
  args: {
    nickname: v.optional(v.string()),
    scientificName: v.optional(v.string()),
    description: v.optional(v.string()),
    spaceId: v.optional(v.id('spaces')),
    speciesId: v.optional(v.id('species')),
    coverStorageId: v.optional(v.id('_storage')),
  },
```

- [ ] **Step 2: Use them in the handler**

Update the handler signature and the insert. Replace the final `return ctx.db.insert('plants', {...})` block with:

```ts
  handler: async (ctx, { nickname, scientificName, description, spaceId, speciesId, coverStorageId }): Promise<Id<'plants'>> => {
    const user = await getCurrentUserOrThrow(ctx);
    // ... existing space-resolution logic unchanged ...

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
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors). If `npx convex dev` is running it will also re-typecheck and deploy cleanly.

- [ ] **Step 4: Commit**

```bash
git add convex/plants.ts
git commit -m "feat(identify): createPlant accepts speciesId + coverStorageId"
```

---

### Task 3: Convex `identify.ts` — cache query, persist mutation, action

The server pipeline: hash → cache lookup → Plant.id fetch → persist (upsert species + identification).

**Files:**
- Create: `convex/identify.ts`

**Interfaces:**
- Consumes: `fnv1aHex`, `parsePlantIdResult`, `RawCandidate`, `CareProfile` from `convex/lib/plantId.ts` (Task 1); `getCurrentUserOrThrow` from `convex/lib/auth`.
- Produces:
  - `identifyPlant` (action): `({ storageId: Id<'_storage'> }) => IdentifyResult`
  - `type IdentifyResult = { notAPlant: boolean; candidates: Array<{ speciesId: Id<'species'>; scientificName: string; commonName?: string; confidence: number; careProfile: CareProfile }> }`
  - internal: `identificationByHash`, `saveIdentification`

- [ ] **Step 1: Create the file with the cache query**

Create `convex/identify.ts`:

```ts
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
```

- [ ] **Step 2: Add the persist mutation**

Append to `convex/identify.ts`:

```ts
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
```

- [ ] **Step 3: Add the action**

Append to `convex/identify.ts`:

```ts
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
```

- [ ] **Step 4: Deploy + typecheck**

Run: `npx convex dev --once`
Expected: Functions compile and deploy with no type errors; `identifyPlant`, `identify.identificationByHash`, `identify.saveIdentification` appear in the dashboard.

- [ ] **Step 5: Commit**

```bash
git add convex/identify.ts
git commit -m "feat(identify): Plant.id action with image-hash cache + species upsert"
```

---

### Task 4: Data layer — types + hooks

Expose the upload + identify pipeline to the UI and let `createPlant` pass `speciesId` + `coverStorageId`.

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/hooks.ts`

**Interfaces:**
- Consumes: `api.identify.identifyPlant`, `api.plants.generatePlantUploadUrl` (existing), the `uploadFileToStorage` helper (existing in `hooks.ts`), `useCreatePlant` (existing).
- Produces:
  - `type IdentifiedCandidate = { speciesId: ID; scientificName: string; commonName?: string; confidence: number; careProfile: { light: 'direct'|'indirect'|'shade'; waterDays: number; difficulty: 'easy'|'medium'|'hard'; humidityRange?: { min: number; max: number } } }`
  - `type IdentificationResult = { notAPlant: boolean; candidates: IdentifiedCandidate[] }`
  - `useUploadImage(): (fileUri: string, contentType?: string) => Promise<ID>`
  - `useIdentifyPlant(): (storageId: ID) => Promise<IdentificationResult>`
  - `useCreatePlant` extended: `NewPlant` gains `speciesId?: ID` and `coverStorageId?: ID`.

- [ ] **Step 1: Add the result types**

In `src/data/types.ts`, add near the other plant types:

```ts
export type IdentifiedCandidate = {
  speciesId: ID;
  scientificName: string;
  commonName?: string;
  confidence: number; // 0..1
  careProfile: { light: 'direct' | 'indirect' | 'shade'; waterDays: number; difficulty: 'easy' | 'medium' | 'hard'; humidityRange?: { min: number; max: number } };
};
export type IdentificationResult = { notAPlant: boolean; candidates: IdentifiedCandidate[] };
```

- [ ] **Step 2: Add `useUploadImage` + `useIdentifyPlant`**

In `src/data/hooks.ts`, import `useAction` from `convex/react` (add to the existing `convex/react` import) and the new types, then add:

```ts
/** Upload a local file URI to Convex storage (no plant attachment) → storageId. */
export function useUploadImage(): (fileUri: string, contentType?: string) => Promise<ID> {
  const uploadUrlMut = useMutation(api.plants.generatePlantUploadUrl);
  return useCallback(
    async (fileUri: string, contentType = 'image/jpeg') => {
      const uploadUrl = await uploadUrlMut({});
      return (await uploadFileToStorage(uploadUrl, fileUri, contentType)) as unknown as ID;
    },
    [uploadUrlMut],
  );
}

/** Identify a previously-uploaded photo via Plant.id. */
export function useIdentifyPlant(): (storageId: ID) => Promise<IdentificationResult> {
  const run = useAction(api.identify.identifyPlant);
  return useCallback(
    async (storageId: ID) => (await run({ storageId: storageId as Id<'_storage'> })) as IdentificationResult,
    [run],
  );
}
```

> Note: `uploadFileToStorage` returns `Id<'_storage'>`; cast through `ID` for the view-model boundary, consistent with the file's other casts.

- [ ] **Step 3: Extend `NewPlant` + `useCreatePlant`**

In `src/data/hooks.ts`, update `NewPlant` and the `createPlant` call:

```ts
export type NewPlant = { nickname?: string; scientificName?: string; description?: string; spaceId?: ID; speciesId?: ID; coverStorageId?: ID };
```

```ts
export function useCreatePlant(): (input: NewPlant) => Promise<ID> {
  const createMut = useMutation(api.plants.createPlant);
  return useCallback(
    async ({ nickname, scientificName, description, spaceId, speciesId, coverStorageId }: NewPlant) =>
      (await createMut({
        nickname,
        scientificName,
        description,
        spaceId: spaceId as Id<'spaces'> | undefined,
        speciesId: speciesId as Id<'species'> | undefined,
        coverStorageId: coverStorageId as Id<'_storage'> | undefined,
      })) as ID,
    [createMut],
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/types.ts src/data/hooks.ts
git commit -m "feat(identify): data hooks for upload + identify, createPlant species/cover"
```

---

### Task 5: Capture screen — wire the real Identify flow

Replace the mock identify path: on shutter (or gallery) in `identify` mode, upload → identify (loading) → render real candidates; care cards from the species careProfile; Add to Garden links species + cover; "see other matches" lists candidates.

**Files:**
- Modify: `src/app/(app)/capture.tsx`

**Interfaces:**
- Consumes: `useUploadImage`, `useIdentifyPlant`, `useCreatePlant` (extended), `IdentifiedCandidate` (Task 4).

- [ ] **Step 1: Imports + state**

Add imports: `useUploadImage, useIdentifyPlant` from `@/data`, and `type IdentifiedCandidate` from `@/data`. Add state near the other `useState`s:

```tsx
const uploadImage = useUploadImage();
const identifyPlant = useIdentifyPlant();
const [identifying, setIdentifying] = useState(false);
const [candidates, setCandidates] = useState<IdentifiedCandidate[] | null>(null);
const [chosen, setChosen] = useState<IdentifiedCandidate | null>(null);
const [identifyError, setIdentifyError] = useState<string | null>(null);
```

- [ ] **Step 2: Identify routine**

Replace the `identify` branch of `handleCaptured` (currently `setPhase('result')` with mocks) so that, for `mode === 'identify'`, it uploads + identifies. Modify `handleCaptured`:

```tsx
const handleCaptured = async (uri: string | null) => {
  if (uri) setCapturedUri(uri);
  if (mode === 'photo') {
    if (plantId && uri) {
      setBusy(true);
      try { await addPhoto(plantId, uri); } finally { setBusy(false); }
    }
    close();
    return;
  }
  if (mode === 'diagnose') {
    setDx(MOCK_DIAGNOSES[Math.floor(Math.random() * MOCK_DIAGNOSES.length)]);
    setPhase('result');
    return;
  }
  if (mode === 'identify') {
    setPhase('result');
    if (!uri) return;
    setIdentifying(true);
    setIdentifyError(null);
    setCandidates(null);
    setChosen(null);
    try {
      const storageId = await uploadImage(uri);
      setCapturedStorageId(storageId);
      const result = await identifyPlant(storageId);
      if (result.notAPlant || result.candidates.length === 0) {
        setIdentifyError('notAPlant');
      } else {
        setCandidates(result.candidates);
        setChosen(result.candidates[0]);
      }
    } catch {
      setIdentifyError('failed');
    } finally {
      setIdentifying(false);
    }
    return;
  }
  setPhase('result'); // manual
};
```

Add the supporting state:

```tsx
const [capturedStorageId, setCapturedStorageId] = useState<ID | null>(null);
```

(import `type ID` from `@/data`.)

- [ ] **Step 3: Render the real identify result**

In the result sheet, replace the mocked identification block (the `else` branch using `IDENTIFIED` / hardcoded "96% confident" / "Bright indirect" / "Every 7 days") with real data driven by `identifying` / `identifyError` / `chosen`:

```tsx
) : identifying ? (
  <View style={{ alignItems: 'center', paddingVertical: 36, gap: 12 }}>
    <ActivityIndicator color={Palette.ever400} />
    <AppText variant="small" tone="muted">Identifying your plant…</AppText>
  </View>
) : identifyError ? (
  <View style={{ alignItems: 'center', paddingVertical: 28, gap: 10 }}>
    <Icon name="image" size={30} color={Palette.ever400} />
    <AppText variant="subtitle" align="center">
      {identifyError === 'notAPlant' ? "Hmm, that doesn't look like a plant" : "Couldn't identify that"}
    </AppText>
    <AppText variant="small" tone="subtle" align="center">Try a clearer, closer photo of the leaves.</AppText>
    <Pressable onPress={() => setPhase('camera')} style={{ paddingVertical: Spacing.sm }}>
      <AppText variant="small" color={Palette.ever400}>Retake photo</AppText>
    </Pressable>
  </View>
) : chosen ? (
  <>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 14 }}>
      <Image source={capturedUri ? { uri: capturedUri } : plantPhotoForSeed(chosen.scientificName)} style={{ width: 58, height: 58, borderRadius: 14 }} contentFit="cover" transition={150} />
      <View style={{ flex: 1 }}>
        <AppText variant="meta" tone="subtle" uppercase>We found a match</AppText>
        <AppText variant="title" style={{ marginTop: 2 }}>{chosen.scientificName}</AppText>
        {chosen.commonName ? <AppText variant="small" tone="muted" style={{ marginTop: 1 }}>{chosen.commonName}</AppText> : null}
      </View>
    </View>

    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(62,124,79,0.14)', marginBottom: 13 }}>
      <Icon name="star" size={13} color={Palette.leaf} filled />
      <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 11.5 }} color={Palette.leaf}>
        {Math.round(chosen.confidence * 100)}% confident
      </AppText>
    </View>

    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
      <NeuSurface elevation="pressed" radius={14} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 }}>
        <Icon name="sun" size={17} tone="accent" />
        <View>
          <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9 }} tone="subtle" uppercase>Light</AppText>
          <AppText variant="bodyBold" style={{ fontSize: 12.5, marginTop: 1 }}>
            {chosen.careProfile.light === 'direct' ? 'Direct sun' : chosen.careProfile.light === 'shade' ? 'Low light' : 'Bright indirect'}
          </AppText>
        </View>
      </NeuSurface>
      <NeuSurface elevation="pressed" radius={14} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 }}>
        <Icon name="droplet" size={17} tone="accent" />
        <View>
          <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9 }} tone="subtle" uppercase>Water</AppText>
          <AppText variant="bodyBold" style={{ fontSize: 12.5, marginTop: 1 }}>Every {chosen.careProfile.waterDays} days</AppText>
        </View>
      </NeuSurface>
    </View>

    <View style={{ marginBottom: 14 }}>
      <TextField label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="Give it a name…" />
    </View>

    <NeuPressable
      onPress={() => addPlant({ nickname, speciesId: chosen.speciesId })}
      disabled={busy}
      radius={Radius.md}
      elevation="raised"
      stretch
      backgroundColor={t.ever100}
      accessibilityLabel="Add to Garden"
      style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: busy ? 0.5 : 1 }}
    >
      {busy ? <ActivityIndicator color={Palette.ever400} /> : (
        <>
          <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Add to Garden</AppText>
          <Icon name="arrowUpRight" size={18} color={Palette.ever400} />
        </>
      )}
    </NeuPressable>

    {candidates && candidates.length > 1 ? (
      <View style={{ marginTop: 10, gap: 6 }}>
        <AppText variant="meta" tone="subtle" uppercase>Other matches</AppText>
        {candidates.filter((c) => c.speciesId !== chosen.speciesId).map((c) => (
          <Pressable key={c.speciesId} onPress={() => setChosen(c)} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <AppText variant="small" style={{ flex: 1 }} numberOfLines={1}>{c.scientificName}</AppText>
            <AppText variant="small" tone="subtle">{Math.round(c.confidence * 100)}%</AppText>
          </Pressable>
        ))}
      </View>
    ) : null}
  </>
) : null}
```

- [ ] **Step 4: Update `addPlant` to pass the captured cover**

In the existing `addPlant`, pass `coverStorageId` when we have one from the identify upload (so we don't re-upload):

```tsx
const addPlant = async (input: { nickname?: string; scientificName?: string; description?: string; speciesId?: ID }) => {
  if (busy) return;
  setBusy(true);
  try {
    await createPlant({ ...input, spaceId, coverStorageId: capturedStorageId ?? undefined });
    router.replace('/(app)/(tabs)/garden');
  } finally {
    setBusy(false);
  }
};
```

(Removed the prior `addPhoto(newId, capturedUri, …)` cover step — the cover now goes through `createPlant`'s `coverStorageId`, since identify already uploaded the image. For the `manual` mode, `capturedStorageId` is null, matching today's behavior.)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/capture.tsx"
git commit -m "feat(identify): wire capture screen to real Plant.id identification"
```

---

### Task 6: Configure key + device verification

No code — set the API key and verify end-to-end on the physical device dev build (the camera/native modules are already in the installed build; this feature is JS + Convex only, so NO new dev build is needed).

- [ ] **Step 1: Set the Plant.id key**

Sign up at plant.id / kindwise.com, get an API key, then:

```bash
npx convex env set PLANTID_API_KEY <your-key>
```

- [ ] **Step 2: Run the app**

Run: `npx convex dev` (one terminal) and `npx expo start --dev-client` (another). Open the app on the iPhone.

- [ ] **Step 3: Happy path**

Garden FAB → Identify → photograph a real houseplant → loading → real species + common name + real confidence % + light/water cards from the care profile. Tap **Add to Garden**.
Expected: lands in Garden with the new plant; its cover is your photo. Open the plant → the **care guide** shows the species' light / "Every X days" / humidity. (No Today tasks — out of scope.)

- [ ] **Step 4: Cache**

Re-identify the **same** photo (use the gallery button to pick the same image).
Expected: result returns quickly; no new Plant.id credit consumed (check the Plant.id dashboard usage).

- [ ] **Step 5: Edge cases**

- Photograph a non-plant (a mug) → "doesn't look like a plant" state, Retake, no garden write.
- Temporarily unset the key (`npx convex env set PLANTID_API_KEY ""`) and identify → "Couldn't identify that" error state, no crash. Re-set the key afterward.
- Tap an entry under **Other matches** → the result swaps to that species; Add to Garden links it.

- [ ] **Step 6: Commit any verification-driven fixes**

```bash
git add -A
git commit -m "fix(identify): address device verification findings"
```

---

## Self-Review

- **Spec coverage:** Plant.id action + key (Task 3/6) ✓; cache by image hash (Task 1 hash + Task 3 query) ✓; upsert species + careProfile mapping with defaults (Task 1 mapper + Task 3 mutation) ✓; link plant→species + cover (Task 2 + Task 5) ✓; real result sheet w/ care guide (Task 5) ✓; not-a-plant / API-error / cache-hit handling (Task 3 + Task 5) ✓; "other matches" (Task 5) ✓; Diagnose untouched ✓; care tasks descoped (no task creates them) ✓; image >2MP accepted as-is (no downscaling task) ✓.
- **Placeholder scan:** none — every code step has full code; verification steps are concrete commands.
- **Type consistency:** `careProfile` shape identical across `plantId.ts`, `saveIdentification` validator, `IdentifiedCandidate`, and capture rendering (light enum, waterDays, difficulty, humidityRange). `IdentifyResult`/`IdentificationResult` shape matches between Convex return and the hook. `createPlant` args (`speciesId`, `coverStorageId`) match between Task 2 (mutation), Task 4 (hook), and Task 5 (callers).
- **Known heuristic:** Plant.id `watering`/light → careProfile mapping is approximate by design (`verified:false`); covered by unit tests with documented expectations.
