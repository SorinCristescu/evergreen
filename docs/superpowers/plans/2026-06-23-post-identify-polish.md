# Post-Identify Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close five gaps in the plant/garden flow — (A) AI-identified plants show a bare About tab; (B) "Add to Garden" picks no place/space; (C) a dedicated Encyclopedia screen showing everything the encyclopedia API returns, reached from the About tab; (D) the Care tab shows an "Up next" label even when nothing is scheduled; (E) no way to move an existing plant to another location/place/space.

**Architecture:** (A) is backend-heavy — persist the Plant.id `details` we already fetch and expose them in `plantDetail.about`. (B) + (E) share a reusable `SpacePicker` (location+space chips). (C) enriches the keyless iNaturalist+GBIF lookup to return a comprehensive `EncyclopediaEntry` and renders it on a new routed screen. (D) is a one-line conditional.

**Tech Stack:** Convex (actions/queries/mutations, default runtime), Expo SDK 56 + expo-router (typed routes; the `(app)` Stack auto-registers screen files), React Native, vitest. No new native modules → **no EAS rebuild**.

## Global Constraints

- Richer-About follows `docs/superpowers/specs/2026-06-23-richer-about-section-design.md`: persist all Plant.id `details` except `similar_images`; origin lives in description prose (no separate field, no Claude call); show **Family + Genus** facts (store full lineage); derive Pet-safe from `toxicity` text only when clear (never guess); attribution link from `description` license/citation; all new `species` fields **optional** (additive, no migration/backfill).
- No new Plant.id credits; the encyclopedia lookup stays free + keyless (iNaturalist + GBIF) and best-effort (a failed/empty source omits its fields, never throws the whole lookup).
- Pure parsing logic lives in `convex/lib/*.ts` (Convex-free, unit-tested); Convex files import from it.
- `petSafetyFromToxicity` checks the negative ("non-toxic") **before** the positive ("toxic") — "non-toxic" contains the substring "toxic".
- `EncyclopediaEntry` is defined in **two** places that must stay in sync: `convex/lib/encyclopedia.ts` (server) and `src/data/types.ts` (client). Update both identically.
- The identify-flow `EncyclopediaCompare` behaviour must remain unchanged; new entry fields are optional and simply ignored there.
- Space pickers prefill to the route/initial space if given, else the active location's first space; `createPlant`/`updatePlant` tolerate an undefined `spaceId` (server falls back / no-op).

---

### Task 1: Extend the Plant.id parser + pet-safety helper

**Files:**
- Modify: `convex/lib/plantId.ts`
- Test: `convex/lib/plantId.test.ts`

**Interfaces:**
- Produces: `type Taxonomy = { kingdom?; phylum?; class?; order?; family?; genus?: string }`; `type SpeciesDescription = { value: string; citation?; licenseName?; licenseUrl?: string }`; `RawCandidate` gains optional `family`, `taxonomy`, `description`, `lightText`, `soilText`, `toxicity`; `petSafetyFromToxicity(text: unknown): 'Yes' | 'Caution' | undefined`.

- [ ] **Step 1: Write the failing tests** — append to `convex/lib/plantId.test.ts`:

```ts
import { petSafetyFromToxicity } from './plantId';

describe('parsePlantIdResult — rich details', () => {
  const rich = {
    result: {
      is_plant: { binary: true },
      classification: {
        suggestions: [
          {
            name: 'Monstera deliciosa',
            probability: 0.96,
            details: {
              common_names: ['Swiss cheese plant'],
              best_light_condition: 'Bright, indirect light.',
              best_soil_type: 'Well-draining, peat-based potting mix.',
              toxicity: 'Toxic to cats and dogs if ingested.',
              taxonomy: { genus: 'Monstera', family: 'Araceae', order: 'Alismatales', class: 'Liliopsida', phylum: 'Tracheophyta', kingdom: 'Plantae' },
              description: { value: 'A species native to southern Mexico.', citation: 'https://en.wikipedia.org/wiki/Monstera_deliciosa', license_name: 'CC BY-SA 3.0', license_url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
            },
          },
        ],
      },
    },
  };

  it('parses family, taxonomy, description, soil/light/toxicity text', () => {
    const c = parsePlantIdResult(rich).candidates[0];
    expect(c.family).toBe('Araceae');
    expect(c.taxonomy?.genus).toBe('Monstera');
    expect(c.taxonomy?.kingdom).toBe('Plantae');
    expect(c.description?.value).toBe('A species native to southern Mexico.');
    expect(c.description?.licenseName).toBe('CC BY-SA 3.0');
    expect(c.description?.licenseUrl).toBe('https://creativecommons.org/licenses/by-sa/3.0/');
    expect(c.lightText).toBe('Bright, indirect light.');
    expect(c.soilText).toBe('Well-draining, peat-based potting mix.');
    expect(c.toxicity).toBe('Toxic to cats and dogs if ingested.');
  });

  it('degrades to undefined when details are missing (no throw)', () => {
    const c = parsePlantIdResult({ result: { is_plant: { binary: true }, classification: { suggestions: [{ name: 'X', probability: 0.5 }] } } }).candidates[0];
    expect(c.family).toBeUndefined();
    expect(c.taxonomy).toBeUndefined();
    expect(c.description).toBeUndefined();
    expect(c.lightText).toBeUndefined();
    expect(c.soilText).toBeUndefined();
    expect(c.toxicity).toBeUndefined();
  });
});

describe('petSafetyFromToxicity', () => {
  it('returns Yes for explicit non-toxic', () => {
    expect(petSafetyFromToxicity('This plant is non-toxic to pets.')).toBe('Yes');
    expect(petSafetyFromToxicity('Not toxic to cats or dogs.')).toBe('Yes');
  });
  it('returns Caution for toxic / poisonous', () => {
    expect(petSafetyFromToxicity('Toxic to cats and dogs.')).toBe('Caution');
    expect(petSafetyFromToxicity('Poisonous if ingested.')).toBe('Caution');
  });
  it('returns undefined when unclear or empty', () => {
    expect(petSafetyFromToxicity('')).toBeUndefined();
    expect(petSafetyFromToxicity(undefined)).toBeUndefined();
    expect(petSafetyFromToxicity('Keep out of direct sun.')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail** — `pnpm test` → FAIL (`petSafetyFromToxicity` not exported; rich fields undefined).

- [ ] **Step 3: Implement** in `convex/lib/plantId.ts`. Add exported types after `CareProfile`:

```ts
export type Taxonomy = {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
};

export type SpeciesDescription = {
  value: string;
  citation?: string;
  licenseName?: string;
  licenseUrl?: string;
};
```

Extend `RawCandidate` with the new optional fields:

```ts
export type RawCandidate = {
  scientificName: string;
  commonName?: string;
  confidence: number; // 0..1
  careProfile: CareProfile;
  family?: string;
  taxonomy?: Taxonomy;
  description?: SpeciesDescription;
  lightText?: string;
  soilText?: string;
  toxicity?: string;
};
```

Replace the `Suggestion` type:

```ts
type SuggestionDetails = {
  common_names?: string[];
  watering?: { min?: number; max?: number };
  best_light_condition?: string;
  best_soil_type?: string;
  toxicity?: string;
  taxonomy?: { kingdom?: string; phylum?: string; class?: string; order?: string; family?: string; genus?: string };
  description?: { value?: string; citation?: string; license_name?: string; license_url?: string };
};

type Suggestion = {
  name?: string;
  probability?: number;
  details?: SuggestionDetails;
};
```

Add helpers above `parsePlantIdResult`:

```ts
function strOrUndef(x: unknown): string | undefined {
  return typeof x === 'string' && x.trim().length ? x.trim() : undefined;
}

function parseTaxonomy(tax: SuggestionDetails['taxonomy']): Taxonomy | undefined {
  if (!tax || typeof tax !== 'object') return undefined;
  const t: Taxonomy = {
    kingdom: strOrUndef(tax.kingdom),
    phylum: strOrUndef(tax.phylum),
    class: strOrUndef(tax.class),
    order: strOrUndef(tax.order),
    family: strOrUndef(tax.family),
    genus: strOrUndef(tax.genus),
  };
  return Object.values(t).some(Boolean) ? t : undefined;
}

function parseDescription(d: SuggestionDetails['description']): SpeciesDescription | undefined {
  const value = strOrUndef(d?.value);
  if (!value) return undefined;
  return { value, citation: strOrUndef(d?.citation), licenseName: strOrUndef(d?.license_name), licenseUrl: strOrUndef(d?.license_url) };
}

/** Derive a pet-safety label from Plant.id free-text toxicity. undefined when unclear (don't guess). */
export function petSafetyFromToxicity(text: unknown): 'Yes' | 'Caution' | undefined {
  const t = typeof text === 'string' ? text.toLowerCase() : '';
  if (!t) return undefined;
  // Negative first — "non-toxic" contains the substring "toxic".
  if (t.includes('non-toxic') || t.includes('nontoxic') || t.includes('non toxic') || t.includes('not toxic')) return 'Yes';
  if (t.includes('toxic') || t.includes('poison')) return 'Caution';
  return undefined;
}
```

In `parsePlantIdResult`'s `.map`, compute `taxonomy` once and add the new fields:

```ts
    .map((s) => {
      const taxonomy = parseTaxonomy(s.details?.taxonomy);
      return {
        scientificName: s.name,
        commonName: s.details?.common_names?.[0],
        confidence: typeof s.probability === 'number' ? s.probability : 0,
        careProfile: {
          light: lightFromText(s.details?.best_light_condition),
          waterDays: wateringToDays(s.details?.watering),
          difficulty: 'medium',
          humidityRange: { min: 40, max: 60 },
        },
        family: taxonomy?.family,
        taxonomy,
        description: parseDescription(s.details?.description),
        lightText: strOrUndef(s.details?.best_light_condition),
        soilText: strOrUndef(s.details?.best_soil_type),
        toxicity: strOrUndef(s.details?.toxicity),
      };
    });
```

- [ ] **Step 4: Run tests + typecheck** — `pnpm test` PASS; `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** — `git add convex/lib/plantId.ts convex/lib/plantId.test.ts && git commit -m "feat(identify): parse rich Plant.id details + pet-safety helper"`

---

### Task 2: Persist rich details on the species record

**Files:**
- Modify: `convex/schema.ts` (species table, after `funFacts`, before `careProfile`)
- Modify: `convex/identify.ts` (`saveIdentification`)
- Regenerate: `convex/_generated/`

**Interfaces:**
- Consumes: `RawCandidate` rich fields (Task 1) — they already flow into `saveIdentification` via `candidates.slice(0, 5)`.
- Produces: `species` docs may carry `taxonomy`, `description`, `lightText`, `soilText`, `toxicity`; `family` set from `taxonomy.family`.

- [ ] **Step 1: Add optional fields to `species`** in `convex/schema.ts`:

```ts
    taxonomy: v.optional(
      v.object({
        kingdom: v.optional(v.string()),
        phylum: v.optional(v.string()),
        class: v.optional(v.string()),
        order: v.optional(v.string()),
        family: v.optional(v.string()),
        genus: v.optional(v.string()),
      }),
    ),
    description: v.optional(
      v.object({
        value: v.string(),
        citation: v.optional(v.string()),
        licenseName: v.optional(v.string()),
        licenseUrl: v.optional(v.string()),
      }),
    ),
    lightText: v.optional(v.string()),
    soilText: v.optional(v.string()),
    toxicity: v.optional(v.string()),
```

- [ ] **Step 2: Extend `saveIdentification`'s candidate validator** — inside `args.candidates` `v.object({...})`, after `careProfile`, add the same five optional validators (`family`, `taxonomy` as the object above, `description` as the object above, `lightText`, `soilText`, `toxicity`).

- [ ] **Step 3: Store on insert + enrich an existing AI species lacking them.** Replace the species-upsert block in the handler:

```ts
    for (const c of candidates) {
      const existing = await ctx.db
        .query('species')
        .withIndex('by_scientificName', (q) => q.eq('scientificName', c.scientificName))
        .unique();

      const richFields = {
        family: c.taxonomy?.family ?? c.family,
        taxonomy: c.taxonomy,
        description: c.description,
        lightText: c.lightText,
        soilText: c.soilText,
        toxicity: c.toxicity,
      };

      let speciesId;
      if (existing) {
        speciesId = existing._id;
        // Enrich on re-identification: backfill rich details onto an AI species that never got them.
        if (existing.source === 'ai' && !existing.description && c.description) {
          await ctx.db.patch(existing._id, richFields);
        }
      } else {
        speciesId = await ctx.db.insert('species', {
          scientificName: c.scientificName,
          commonNames: c.commonName ? [c.commonName] : [],
          careProfile: c.careProfile,
          source: 'ai',
          verified: false,
          ...richFields,
        });
      }
      const sp = (await ctx.db.get(speciesId))!;
      resolved.push({
        speciesId,
        scientificName: c.scientificName,
        commonName: sp.commonNames[0] ?? c.commonName,
        confidence: c.confidence,
        careProfile: sp.careProfile,
      });
    }
```

(`resolved`, the `identifications` insert, and the return are unchanged.)

- [ ] **Step 4: Codegen + typecheck** — `npx convex codegen && npx tsc --noEmit`.
- [ ] **Step 5: Commit** — `git add convex/schema.ts convex/identify.ts convex/_generated && git commit -m "feat(identify): persist rich species details"`

---

### Task 3: Expose rich About data in the query + render the Source link

**Files:**
- Modify: `convex/plants.ts` (about builder; add `shorten` helper; import `petSafetyFromToxicity`)
- Modify: `src/data/types.ts` (`about` type)
- Modify: `src/app/(app)/plant/[plantId].tsx` (About tab Source link)

**Interfaces:**
- Consumes: Task 2 species fields; Task 1 `petSafetyFromToxicity`.
- Produces: `PlantDetail['about']` gains `source?: { label: string; url?: string }`.

- [ ] **Step 1: Add `shorten` helper** next to `cap` in `convex/plants.ts`:

```ts
function shorten(s: string, max = 48): string {
  const first = s.split(/[.;]/)[0].trim();
  return first.length <= max ? first : `${first.slice(0, max - 1).trimEnd()}…`;
}
```

- [ ] **Step 2: Import + rewrite the About builder** in `convex/plants.ts`. Add `import { petSafetyFromToxicity } from './lib/plantId';` at top. Replace the `facts`/`notes`/`about` block (~160-172):

```ts
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
```

- [ ] **Step 3: Extend the `about` type** in `src/data/types.ts`:

```ts
  about?: {
    lead: string;
    facts: { label: string; value: string }[];
    notes: string[];
    source?: { label: string; url?: string };
  };
```

- [ ] **Step 4: Render the Source link** in `src/app/(app)/plant/[plantId].tsx`. Ensure `Linking` is imported from `react-native`. After the "Good to know" notes `</View>` (~512), before the bottom button (Task 6 replaces it):

```tsx
            {plant.about.source ? (
              <Pressable
                onPress={() => plant.about?.source?.url && Linking.openURL(plant.about.source.url)}
                disabled={!plant.about.source.url}
                accessibilityRole="link"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}
              >
                <AppText variant="meta" tone="subtle">Source:</AppText>
                <AppText variant="small" color={Palette.ever400} style={{ fontSize: 12.5 }}>{plant.about.source.label}</AppText>
              </Pressable>
            ) : null}
```

- [ ] **Step 5: Typecheck** — `npx tsc --noEmit`.
- [ ] **Step 6: Commit** — `git add convex/plants.ts src/data/types.ts "src/app/(app)/plant/[plantId].tsx" && git commit -m "feat(about): surface taxonomy/description/soil/toxicity + source link"`

---

### Task 4: Reusable SpacePicker + inline picker on Add to Garden

**Files:**
- Create: `src/components/domain/space-picker.tsx`
- Modify: `src/app/(app)/capture.tsx`

**Interfaces:**
- Produces: `SpacePicker` (default export-free named): `function SpacePicker({ initialSpaceId, onChange }: { initialSpaceId?: ID; onChange: (spaceId: ID | undefined) => void })`.

- [ ] **Step 1: Create `src/components/domain/space-picker.tsx`:**

```tsx
/** Location + space chip picker. Self-contained: manages location internally, reports the chosen space via onChange.
 *  Defaults to the active location's first space (or initialSpaceId when it belongs to the active location). */
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/app-text';
import { useActiveLocation, useLocations, useSpaces, type ID } from '@/data';

export function SpacePicker({ initialSpaceId, onChange }: { initialSpaceId?: ID; onChange: (spaceId: ID | undefined) => void }) {
  const locations = useLocations();
  const activeLocation = useActiveLocation();
  const [locationId, setLocationId] = useState<ID | undefined>(undefined);
  const effectiveLocationId = locationId ?? activeLocation?.id ?? locations?.[0]?.id;
  const spaces = useSpaces(effectiveLocationId);
  const [spaceId, setSpaceId] = useState<ID | undefined>(initialSpaceId);

  // Once spaces load, ensure a valid selection (first space) and report it up.
  useEffect(() => {
    if (spaces && !spaces.some((s) => s.id === spaceId)) {
      const next = spaces[0]?.id;
      setSpaceId(next);
      onChange(next);
    }
  }, [spaces, spaceId, onChange]);

  const selectLocation = (id: ID) => { setLocationId(id); setSpaceId(undefined); };
  const selectSpace = (id: ID) => { setSpaceId(id); onChange(id); };

  return (
    <View style={{ gap: 10 }}>
      {locations && locations.length > 1 ? (
        <View style={{ gap: 6 }}>
          <AppText variant="meta" tone="subtle" uppercase>Location</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {locations.map((l) => (
              <Chip key={l.id} label={l.name} selected={effectiveLocationId === l.id} onPress={() => selectLocation(l.id)} />
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ gap: 6 }}>
        <AppText variant="meta" tone="subtle" uppercase>Place / space</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(spaces ?? []).map((s) => (
            <Chip key={s.id} label={s.name} selected={spaceId === s.id} onPress={() => selectSpace(s.id)} />
          ))}
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Wire it into capture.** In `src/app/(app)/capture.tsx`: import `SpacePicker` and `useCallback` (from react). Add state: `const [pickedSpaceId, setPickedSpaceId] = useState<ID | undefined>(spaceId);` and a stable handler `const onPickSpace = useCallback((id: ID | undefined) => setPickedSpaceId(id), []);`. Change the `createPlant` call in `addPlant` to: `await createPlant({ ...input, spaceId: pickedSpaceId ?? spaceId, coverStorageId: cover ?? undefined });`

- [ ] **Step 3: Mount the picker** in both add forms:
  - Identify-chosen block: add `<View style={{ marginBottom: 14 }}><SpacePicker initialSpaceId={spaceId} onChange={onPickSpace} /></View>` immediately before the "Nickname (optional)" `TextField` wrapper (~660).
  - Add-manually form: add the same `<SpacePicker .../>` after the "Description" `TextField` (~564), before the manual Add button.

- [ ] **Step 4: Typecheck** — `npx tsc --noEmit`.
- [ ] **Step 5: Commit** — `git add src/components/domain/space-picker.tsx "src/app/(app)/capture.tsx" && git commit -m "feat(capture): reusable SpacePicker on Add to Garden"`

---

### Task 5: Enrich the encyclopedia lookup (parsers + action + type)

**Files:**
- Modify: `convex/lib/encyclopedia.ts` (+ types)
- Test: `convex/lib/encyclopedia.test.ts`
- Modify: `convex/encyclopedia.ts` (action)
- Modify: `src/data/types.ts` (client `EncyclopediaEntry` — keep in sync)

**Interfaces:**
- Produces: enriched `EncyclopediaEntry` (adds `photos`, `introducedRange`, `lineage`, `rank`, `observationsCount`, `conservationStatus`, `wikipediaUrl`); `EncyclopediaPhoto = { url: string; attribution?: string }`; new parsers `parseGbifMatch`, `parseGbifRanges`.

- [ ] **Step 1: Write failing tests** — append to `convex/lib/encyclopedia.test.ts`:

```ts
import { parseGbifMatch, parseGbifRanges } from './encyclopedia';

describe('parseINatTaxon — enriched', () => {
  const json = {
    results: [{
      preferred_common_name: 'Swiss cheese plant',
      wikipedia_summary: 'A <a href="#">species</a> of flowering plant.',
      wikipedia_url: 'https://en.wikipedia.org/wiki/Monstera_deliciosa',
      rank: 'species',
      observations_count: 12345,
      conservation_status: { status_name: 'Least Concern' },
      default_photo: { medium_url: 'https://x/med.jpg', attribution: '(c) someone' },
      taxon_photos: [{ photo: { medium_url: 'https://x/1.jpg', attribution: 'a' } }, { photo: { medium_url: 'https://x/2.jpg' } }],
    }],
  };
  it('extracts gallery, observations, conservation, wikipedia url, rank', () => {
    const e = parseINatTaxon(json);
    expect(e.commonName).toBe('Swiss cheese plant');
    expect(e.summary).toBe('A species of flowering plant.');
    expect(e.wikipediaUrl).toBe('https://en.wikipedia.org/wiki/Monstera_deliciosa');
    expect(e.rank).toBe('species');
    expect(e.observationsCount).toBe(12345);
    expect(e.conservationStatus).toBe('Least Concern');
    expect(e.photos?.length).toBe(2);
    expect(e.photos?.[0]).toEqual({ url: 'https://x/1.jpg', attribution: 'a' });
  });
  it('empty results → empty object', () => {
    expect(parseINatTaxon({ results: [] })).toEqual({});
  });
});

describe('parseGbifMatch', () => {
  it('builds family/genus + ordered lineage', () => {
    const m = parseGbifMatch({ usageKey: 1, kingdom: 'Plantae', phylum: 'Tracheophyta', class: 'Liliopsida', order: 'Alismatales', family: 'Araceae', genus: 'Monstera' });
    expect(m.family).toBe('Araceae');
    expect(m.genus).toBe('Monstera');
    expect(m.lineage?.map((l) => l.name)).toEqual(['Plantae', 'Tracheophyta', 'Liliopsida', 'Alismatales', 'Araceae', 'Monstera']);
    expect(m.lineage?.[0]).toEqual({ rank: 'Kingdom', name: 'Plantae' });
  });
  it('handles missing ranks', () => {
    const m = parseGbifMatch({ family: 'Araceae' });
    expect(m.lineage?.map((l) => l.name)).toEqual(['Araceae']);
    expect(m.genus).toBeUndefined();
  });
});

describe('parseGbifRanges', () => {
  const json = { results: [
    { country: 'Mexico', establishmentMeans: 'NATIVE' },
    { country: 'Mexico', establishmentMeans: 'NATIVE' },
    { country: 'Florida', establishmentMeans: 'INTRODUCED' },
  ]};
  it('splits native and introduced, deduped', () => {
    const r = parseGbifRanges(json);
    expect(r.native).toBe('Mexico');
    expect(r.introduced).toBe('Florida');
  });
});
```

- [ ] **Step 2: Run** — `pnpm test` → FAIL (new parsers/fields missing).

- [ ] **Step 3: Implement** in `convex/lib/encyclopedia.ts`. Replace the type + `parseINatTaxon` + add the new parsers; refactor `parseGbifDistributions` to delegate:

```ts
export type EncyclopediaPhoto = { url: string; attribution?: string };

export type EncyclopediaEntry = {
  imageUrl?: string;
  photos?: EncyclopediaPhoto[];
  commonName?: string;
  summary?: string;
  nativeRange?: string;
  introducedRange?: string;
  family?: string;
  genus?: string;
  lineage?: { rank: string; name: string }[];
  rank?: string;
  observationsCount?: number;
  conservationStatus?: string;
  wikipediaUrl?: string;
  sourceUrl?: string;
  photoAttribution?: string;
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

type INatPhoto = { medium_url?: string; large_url?: string; url?: string; attribution?: string };
type INatTaxon = {
  preferred_common_name?: string;
  wikipedia_summary?: string | null;
  wikipedia_url?: string;
  rank?: string;
  observations_count?: number;
  conservation_status?: { status_name?: string; status?: string } | null;
  default_photo?: INatPhoto;
  taxon_photos?: { photo?: INatPhoto }[];
};

export function parseINatTaxon(json: unknown): Partial<EncyclopediaEntry> {
  const r = (json as { results?: INatTaxon[] } | null)?.results?.[0];
  if (!r) return {};
  const out: Partial<EncyclopediaEntry> = {};
  if (typeof r.preferred_common_name === 'string') out.commonName = r.preferred_common_name;
  if (typeof r.wikipedia_summary === 'string' && r.wikipedia_summary.trim()) out.summary = stripHtml(r.wikipedia_summary);
  if (typeof r.wikipedia_url === 'string') { out.wikipediaUrl = r.wikipedia_url; out.sourceUrl = r.wikipedia_url; }
  if (typeof r.rank === 'string') out.rank = r.rank;
  if (typeof r.observations_count === 'number') out.observationsCount = r.observations_count;
  const cons = r.conservation_status?.status_name || r.conservation_status?.status;
  if (typeof cons === 'string' && cons.trim()) out.conservationStatus = cons;
  const photo = r.default_photo;
  if (photo && typeof photo.medium_url === 'string') out.imageUrl = photo.medium_url;
  if (photo && typeof photo.attribution === 'string') out.photoAttribution = photo.attribution;
  const photos: EncyclopediaPhoto[] = [];
  for (const tp of r.taxon_photos ?? []) {
    const p = tp?.photo;
    const url = p?.medium_url || p?.large_url || p?.url;
    if (typeof url === 'string') photos.push({ url, attribution: typeof p?.attribution === 'string' ? p.attribution : undefined });
    if (photos.length >= 8) break;
  }
  if (photos.length) out.photos = photos;
  return out;
}

type GbifMatch = { usageKey?: number; kingdom?: string; phylum?: string; class?: string; order?: string; family?: string; genus?: string };

export function parseGbifMatch(json: unknown): { family?: string; genus?: string; lineage?: { rank: string; name: string }[] } {
  const m = (json as GbifMatch | null) ?? {};
  const ranks: [string, unknown][] = [
    ['Kingdom', m.kingdom], ['Phylum', m.phylum], ['Class', m.class], ['Order', m.order], ['Family', m.family], ['Genus', m.genus],
  ];
  const lineage = ranks.filter(([, v]) => typeof v === 'string' && v).map(([rank, v]) => ({ rank, name: v as string }));
  return {
    family: typeof m.family === 'string' ? m.family : undefined,
    genus: typeof m.genus === 'string' ? m.genus : undefined,
    lineage: lineage.length ? lineage : undefined,
  };
}

type GbifDist = { country?: string | null; locality?: string | null; establishmentMeans?: string | null };

export function parseGbifRanges(json: unknown): { native?: string; introduced?: string } {
  const results = (json as { results?: GbifDist[] } | null)?.results ?? [];
  const collect = (means: string) => {
    const places: string[] = [];
    for (const r of results) {
      if (r?.establishmentMeans !== means) continue;
      const place = (typeof r.locality === 'string' && r.locality) || (typeof r.country === 'string' && r.country) || undefined;
      if (place && !places.includes(place)) places.push(place);
    }
    return places.length ? places.slice(0, 6).join(', ') : undefined;
  };
  return { native: collect('NATIVE'), introduced: collect('INTRODUCED') };
}

/** Back-compat: native range only (used by the identify-flow compare). */
export function parseGbifDistributions(json: unknown): string | undefined {
  return parseGbifRanges(json).native;
}
```

- [ ] **Step 4: Update the action** `convex/encyclopedia.ts` to use the new parsers:

```ts
import { parseINatTaxon, parseGbifMatch, parseGbifRanges, type EncyclopediaEntry } from './lib/encyclopedia';
```

Replace the GBIF block body:

```ts
      const m = await fetch(`https://api.gbif.org/v1/species/match?name=${name}`);
      if (m.ok) {
        const matchJson = await m.json();
        Object.assign(entry, parseGbifMatch(matchJson));
        const usageKey = (matchJson as { usageKey?: number }).usageKey;
        if (typeof usageKey === 'number') {
          try {
            const d = await fetch(`https://api.gbif.org/v1/species/${usageKey}/distributions?limit=100`);
            if (d.ok) {
              const ranges = parseGbifRanges(await d.json());
              if (ranges.native) entry.nativeRange = ranges.native;
              if (ranges.introduced) entry.introducedRange = ranges.introduced;
            }
          } catch {
            /* best-effort */
          }
        }
      }
```

- [ ] **Step 5: Mirror the type in `src/data/types.ts`** — replace the client `EncyclopediaEntry` (and add `EncyclopediaPhoto`) to match the server type exactly (the full field set above).

- [ ] **Step 6: Test + typecheck** — `pnpm test` PASS (incl. unchanged `parseGbifDistributions` tests); `npx tsc --noEmit` clean.
- [ ] **Step 7: Commit** — `git add convex/lib/encyclopedia.ts convex/lib/encyclopedia.test.ts convex/encyclopedia.ts src/data/types.ts && git commit -m "feat(encyclopedia): enrich lookup (gallery, lineage, ranges, conservation, observations)"`

---

### Task 6: Encyclopedia screen + navigate from the About tab

**Files:**
- Create: `src/app/(app)/encyclopedia.tsx`
- Modify: `src/app/(app)/plant/[plantId].tsx` (replace the dead bottom button with navigation)

**Interfaces:**
- Consumes: `useEncyclopediaLookup()` (returns `(scientificName) => Promise<EncyclopediaEntry>`), enriched `EncyclopediaEntry` (Task 5). Route params: `name` (scientific), `common` (optional common name).

- [ ] **Step 1: Create `src/app/(app)/encyclopedia.tsx`** — a pushed screen that looks up and renders everything:

```tsx
/** Full encyclopedia entry for a species (iNaturalist + GBIF). Reached from a plant's About tab. */
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Palette, Spacing } from '@/constants/tokens';
import { useEncyclopediaLookup, type EncyclopediaEntry } from '@/data';
import { useTheme } from '@/theme';

export default function EncyclopediaScreen() {
  const t = useTheme();
  const { name, common } = useLocalSearchParams<{ name?: string; common?: string }>();
  const lookup = useEncyclopediaLookup();
  const [entry, setEntry] = useState<EncyclopediaEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    if (!name) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    lookup(name)
      .then((e) => active && setEntry(e))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  };
  useEffect(load, [name, lookup]);

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={{ marginTop: 20 }}>
      <AppText variant="meta" tone="subtle" uppercase style={{ marginBottom: 8 }}>{label}</AppText>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader title={common || name || 'Encyclopedia'} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={Palette.ever400} /></View>
      ) : failed ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <AppText variant="small" tone="muted">Couldn't load encyclopedia data.</AppText>
          <Pressable onPress={load}><AppText variant="bodyBold" color={Palette.ever400}>Retry</AppText></Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 48 }}>
          {entry?.imageUrl ? (
            <Image source={{ uri: entry.imageUrl }} style={{ width: '100%', height: 220, borderRadius: 18 }} contentFit="cover" transition={150} />
          ) : null}
          <AppText variant="title" style={{ marginTop: 14 }}>{common || name}</AppText>
          <AppText variant="small" tone="muted" style={{ fontStyle: 'italic' }}>{name}</AppText>
          {entry?.commonName && entry.commonName !== common ? <AppText variant="small" tone="muted">{entry.commonName}</AppText> : null}

          {entry?.summary ? <Section label="About"><AppText variant="small" style={{ lineHeight: 21 }}>{entry.summary}</AppText></Section> : null}

          {entry?.photos?.length ? (
            <Section label="Gallery">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {entry.photos.map((p, i) => (
                  <Image key={i} source={{ uri: p.url }} style={{ width: 130, height: 130, borderRadius: 14 }} contentFit="cover" transition={150} />
                ))}
              </ScrollView>
            </Section>
          ) : null}

          {entry?.lineage?.length ? (
            <Section label="Taxonomy">
              <NeuSurface elevation="pressed" radius={14} style={{ padding: 14, gap: 8 }}>
                {entry.lineage.map((l) => (
                  <View key={l.rank} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="meta" tone="subtle" uppercase>{l.rank}</AppText>
                    <AppText variant="small" color={t.fg}>{l.name}</AppText>
                  </View>
                ))}
              </NeuSurface>
            </Section>
          ) : null}

          {entry?.nativeRange || entry?.introducedRange ? (
            <Section label="Distribution">
              {entry?.nativeRange ? <AppText variant="small"><AppText variant="bodyBold" style={{ fontSize: 13 }}>Native: </AppText>{entry.nativeRange}</AppText> : null}
              {entry?.introducedRange ? <AppText variant="small" style={{ marginTop: 4 }}><AppText variant="bodyBold" style={{ fontSize: 13 }}>Introduced: </AppText>{entry.introducedRange}</AppText> : null}
            </Section>
          ) : null}

          {entry?.conservationStatus || entry?.observationsCount || entry?.rank ? (
            <Section label="Facts">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {entry?.rank ? <Fact label="Rank" value={entry.rank} /> : null}
                {entry?.conservationStatus ? <Fact label="Conservation" value={entry.conservationStatus} /> : null}
                {typeof entry?.observationsCount === 'number' ? <Fact label="iNat observations" value={entry.observationsCount.toLocaleString()} /> : null}
              </View>
            </Section>
          ) : null}

          {entry?.photoAttribution ? <AppText variant="meta" tone="subtle" style={{ marginTop: 16 }}>Photo: {entry.photoAttribution}</AppText> : null}
          {entry?.wikipediaUrl ? (
            <Pressable onPress={() => Linking.openURL(entry.wikipediaUrl!)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <Icon name="search" size={15} color={Palette.ever400} />
              <AppText variant="small" color={Palette.ever400}>Read on Wikipedia</AppText>
            </Pressable>
          ) : null}

          {!entry || Object.keys(entry).length === 0 ? (
            <AppText variant="small" tone="muted" style={{ marginTop: 24 }}>No encyclopedia data found for this species.</AppText>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <NeuSurface elevation="pressed" radius={14} style={{ width: '47.5%', paddingVertical: 12, paddingHorizontal: 13 }}>
      <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 9 }}>{label}</AppText>
      <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13, marginTop: 3 }}>{value}</AppText>
    </NeuSurface>
  );
}
```

(If `NeuSurface`'s elevation prop name differs, match the existing usage in `plant/[plantId].tsx`. Confirm `Icon name="search"` exists — it's used in capture.)

- [ ] **Step 2: Replace the dead bottom button** in `src/app/(app)/plant/[plantId].tsx` (the `NeuPressable` "See full Species page" with `onPress={() => {}}` at ~513). Use `useRouter` (already imported as `router`):

```tsx
            {plant.species ? (
              <NeuPressable
                onPress={() => router.push({ pathname: '/(app)/encyclopedia', params: { name: plant.species!.scientificName, common: plant.species!.commonName ?? '' } })}
                elevation="raised-sm"
                radius={14}
                stretch
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, marginTop: 18 }}
              >
                <Icon name="search" size={16} color={Palette.ever400} />
                <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 13.5 }}>See in encyclopedia</AppText>
              </NeuPressable>
            ) : null}
```

- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` (resolve the typed-route literal for `/(app)/encyclopedia`; if typed routes complain, the route string must match the generated type — the file at `src/app/(app)/encyclopedia.tsx` produces `/(app)/encyclopedia`).
- [ ] **Step 4: Commit** — `git add "src/app/(app)/encyclopedia.tsx" "src/app/(app)/plant/[plantId].tsx" && git commit -m "feat(encyclopedia): full species screen from About tab"`

---

### Task 7: Hide the "Up next" label when nothing is scheduled

**Files:**
- Modify: `src/app/(app)/plant/[plantId].tsx` (~469)

- [ ] **Step 1: Gate the label** — replace `<SectionLabel>Up next</SectionLabel>` with:

```tsx
            {plant.careTasks.length > 0 ? <SectionLabel>Up next</SectionLabel> : null}
```

(The "Mark watered" quick-action button below stays as-is — it is not a scheduled task.)

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit`.
- [ ] **Step 3: Commit** — `git add "src/app/(app)/plant/[plantId].tsx" && git commit -m "fix(plant): hide Up next label when no tasks scheduled"`

---

### Task 8: Move a plant to another location / place / space

**Files:**
- Modify: `convex/plants.ts` (`updatePlant` — accept `spaceId`)
- Modify: `src/data/types.ts` (`PlantEdit` — add `spaceId`)
- Modify: `src/app/(app)/plant/[plantId].tsx` (Move sheet using `SpacePicker`)

**Interfaces:**
- Consumes: `SpacePicker` (Task 4); `usePlantEditor().updatePlant(plantId, { spaceId })`.
- Produces: `updatePlant` patches `plant.spaceId` after verifying the space belongs to the user.

- [ ] **Step 1: Backend** — in `convex/plants.ts` `updatePlant`, add `spaceId: v.optional(v.id('spaces'))` to args and handle it in the handler (before `ctx.db.patch`):

```ts
    if (spaceId !== undefined) {
      const space = await ctx.db.get(spaceId);
      if (!space || space.userId !== plant.userId) throw new Error('Space not found.');
      patch.spaceId = spaceId;
    }
```

(Add `spaceId` to the handler's destructured args.)

- [ ] **Step 2: Client type** — in `src/data/types.ts`, add `spaceId?: ID;` to the `PlantEdit` type. (No change needed in `usePlantEditor` — it spreads `edit` into the mutation.)

- [ ] **Step 3: Move sheet UI** — in `src/app/(app)/plant/[plantId].tsx`:
  - Import `SpacePicker` from `@/components/domain/space-picker`.
  - Add `'move'` to the `sheet` state union: `useState<null | 'options' | 'edit' | 'move' | 'treatment' | 'diagnosis' | 'note'>(null)`.
  - Add state: `const [moveSpaceId, setMoveSpaceId] = useState<ID | undefined>(undefined);` and `const onMovePick = useCallback((id: ID | undefined) => setMoveSpaceId(id), []);` (import `useCallback`, and `ID` from `@/data`).
  - Add a "Move plant" row to the **options** sheet (next to Edit), opening the move sheet: `onPress={() => { setMoveSpaceId(undefined); setSheet('move'); }}`. Match the existing options-row markup/styling.
  - Add the Move sheet near the other `<Sheet>`s:

```tsx
      <Sheet visible={sheet === 'move'} onClose={() => setSheet(null)}>
        <View style={{ gap: 16 }}>
          <AppText variant="title">Move plant</AppText>
          <SpacePicker onChange={onMovePick} />
          <NeuPressable
            onPress={async () => { if (moveSpaceId) { await updatePlant(plant.id, { spaceId: moveSpaceId }); } setSheet(null); }}
            elevation="raised"
            radius={16}
            stretch
            backgroundColor={t.ever100}
            style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}
          >
            <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Move here</AppText>
          </NeuPressable>
        </View>
      </Sheet>
```

(Match the exact `Sheet`/`NeuPressable` prop conventions already used in this file.)

- [ ] **Step 4: Codegen + typecheck** — `npx convex codegen && npx tsc --noEmit`.
- [ ] **Step 5: Commit** — `git add convex/plants.ts convex/_generated src/data/types.ts "src/app/(app)/plant/[plantId].tsx" && git commit -m "feat(plant): move a plant to another location/place/space"`

---

## Verification (whole feature, on device)

1. `pnpm test` green; `npx tsc --noEmit` clean.
2. With `PLANTID_API_KEY` set + `npx convex dev` running: identify a houseplant → **About tab** shows description lead, Family + Genus, Soil/Light/Toxicity notes, Pet-safe fact, working Source link.
3. **Add to Garden**: location (if >1) + space chips appear, prefilled; pick a different space → the plant lands there (verify in Garden + detail).
4. **See in encyclopedia** (About tab) → opens the new screen with photo, summary, gallery, taxonomy lineage, native/introduced range, conservation/observations facts, Wikipedia link; loading/error/empty states behave.
5. **Care tab** with no scheduled tasks → no "Up next" label; with tasks → label shows.
6. **Move plant** (options → Move plant) → pick a different location/space → "Move here" → plant moves (verify in Garden grouping).
7. A **seeded** plant's About still renders curated content; identify-flow "Check in encyclopedia" compare still works unchanged.
