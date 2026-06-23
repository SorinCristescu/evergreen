# Encyclopedia Confirm Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After Plant.id identification, let the user open a side-by-side compare view (their photo vs. an iNaturalist reference photo + GBIF taxonomy/range) to confirm which candidate is their plant before Add to Garden.

**Architecture:** A keyless Convex `action` (`lookupSpecies`) fetches iNaturalist (photo, common name, wiki summary/link) and GBIF (family/genus via `match`, best-effort native range via `distributions`), each part failing gracefully. Pure parsers live in a Convex-free module (vitest-tested). A new compare component renders captured-vs-reference with a candidate switcher; the capture screen opens it from the identify result block. Purely additive — no schema change, no native module.

**Tech Stack:** Expo SDK 56 / RN 0.85, Convex (default runtime, `fetch`), iNaturalist v1 + GBIF v1 APIs (free, no key), vitest, TypeScript.

## Global Constraints

- Convex **default runtime** — no `"use node";` (only `fetch`). Copied from spec.
- Every Convex function has argument validators.
- **No API keys** — iNaturalist and GBIF are public/keyless. **No new dependency, no native module → no EAS rebuild.** Copied from spec.
- Screens import from `@/data` only; Convex `Id`/types never reach the UI.
- The action must **never throw as a whole** — each external call is wrapped so a failure/empty yields `undefined` for that field (partial `EncyclopediaEntry`). Copied from spec.
- `EncyclopediaEntry` shape (identical in `convex/lib/encyclopedia.ts` and `src/data/types.ts`): `{ imageUrl?: string; commonName?: string; summary?: string; nativeRange?: string; family?: string; genus?: string; sourceUrl?: string; photoAttribution?: string }`.
- "This is my plant" **selects** the candidate only; Add to Garden stays a separate tap. Copied from spec.
- Real API shapes (verified live): iNaturalist `GET /v1/taxa?q=<name>&rank=species&per_page=1` → `results[0].{preferred_common_name, wikipedia_summary (may be null, may contain HTML), wikipedia_url, default_photo.{medium_url, attribution}}`. GBIF `GET /v1/species/match?name=<name>` → `{usageKey, family, genus}`; `GET /v1/species/{usageKey}/distributions?limit=50` → `results[].{country (often null / a code), locality, establishmentMeans ('NATIVE'|'INTRODUCED'|null)}`. Native range is best-effort: only `establishmentMeans==='NATIVE'` records, else omitted.

---

### Task 1: Pure encyclopedia parsers (TDD)

**Files:**
- Create: `convex/lib/encyclopedia.ts`
- Create: `convex/lib/encyclopedia.test.ts`

**Interfaces:**
- Produces:
  - `type EncyclopediaEntry = { imageUrl?: string; commonName?: string; summary?: string; nativeRange?: string; family?: string; genus?: string; sourceUrl?: string; photoAttribution?: string }`
  - `parseINatTaxon(json: unknown): Partial<EncyclopediaEntry>`
  - `parseGbifDistributions(json: unknown): string | undefined`

- [ ] **Step 1: Write the failing tests**

Create `convex/lib/encyclopedia.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseINatTaxon, parseGbifDistributions } from './encyclopedia';

describe('parseINatTaxon', () => {
  const inat = {
    results: [
      {
        name: 'Monstera deliciosa',
        preferred_common_name: 'Swiss Cheese Plant',
        wikipedia_url: 'http://en.wikipedia.org/wiki/Monstera_deliciosa',
        wikipedia_summary: 'A species <a href="x">native</a> to southern Mexico.',
        default_photo: { medium_url: 'https://static.inaturalist.org/photos/1/medium.jpeg', attribution: '(c) Someone' },
      },
    ],
  };
  it('extracts common name, photo, attribution, wiki link', () => {
    const e = parseINatTaxon(inat);
    expect(e.commonName).toBe('Swiss Cheese Plant');
    expect(e.imageUrl).toBe('https://static.inaturalist.org/photos/1/medium.jpeg');
    expect(e.photoAttribution).toBe('(c) Someone');
    expect(e.sourceUrl).toBe('http://en.wikipedia.org/wiki/Monstera_deliciosa');
  });
  it('strips HTML from the summary', () => {
    expect(parseINatTaxon(inat).summary).toBe('A species native to southern Mexico.');
  });
  it('handles null summary and empty results without throwing', () => {
    expect(parseINatTaxon({ results: [{ name: 'X', wikipedia_summary: null }] }).summary).toBeUndefined();
    expect(parseINatTaxon({ results: [] })).toEqual({});
    expect(parseINatTaxon({})).toEqual({});
    expect(parseINatTaxon(null)).toEqual({});
  });
});

describe('parseGbifDistributions', () => {
  it('returns only NATIVE places, deduped and capped, locality preferred', () => {
    const json = {
      results: [
        { country: null, locality: 'Southern Mexico', establishmentMeans: 'NATIVE' },
        { country: 'GT', locality: null, establishmentMeans: 'NATIVE' },
        { country: null, locality: 'Southern Mexico', establishmentMeans: 'NATIVE' }, // dup
        { country: null, locality: 'East Africa', establishmentMeans: 'INTRODUCED' }, // excluded
      ],
    };
    expect(parseGbifDistributions(json)).toBe('Southern Mexico, GT');
  });
  it('returns undefined when no NATIVE records', () => {
    expect(parseGbifDistributions({ results: [{ locality: 'Caribbean', establishmentMeans: 'INTRODUCED' }] })).toBeUndefined();
    expect(parseGbifDistributions({ results: [] })).toBeUndefined();
    expect(parseGbifDistributions(null)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './encyclopedia'`.

- [ ] **Step 3: Implement the module**

Create `convex/lib/encyclopedia.ts`:

```ts
/** Pure, Convex-free parsers for the encyclopedia-confirm lookups (iNaturalist + GBIF). Unit-tested. */

export type EncyclopediaEntry = {
  imageUrl?: string;
  commonName?: string;
  summary?: string;
  nativeRange?: string;
  family?: string;
  genus?: string;
  sourceUrl?: string;
  photoAttribution?: string;
};

/** iNaturalist wiki summaries can contain anchor tags; strip to plain text. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

type INatPhoto = { medium_url?: string; attribution?: string };
type INatTaxon = { preferred_common_name?: string; wikipedia_summary?: string | null; wikipedia_url?: string; default_photo?: INatPhoto };

export function parseINatTaxon(json: unknown): Partial<EncyclopediaEntry> {
  const r = (json as { results?: INatTaxon[] } | null)?.results?.[0];
  if (!r) return {};
  const out: Partial<EncyclopediaEntry> = {};
  if (typeof r.preferred_common_name === 'string') out.commonName = r.preferred_common_name;
  if (typeof r.wikipedia_summary === 'string' && r.wikipedia_summary.trim()) out.summary = stripHtml(r.wikipedia_summary);
  if (typeof r.wikipedia_url === 'string') out.sourceUrl = r.wikipedia_url;
  const photo = r.default_photo;
  if (photo && typeof photo.medium_url === 'string') out.imageUrl = photo.medium_url;
  if (photo && typeof photo.attribution === 'string') out.photoAttribution = photo.attribution;
  return out;
}

type GbifDist = { country?: string | null; locality?: string | null; establishmentMeans?: string | null };

export function parseGbifDistributions(json: unknown): string | undefined {
  const results = (json as { results?: GbifDist[] } | null)?.results ?? [];
  const places: string[] = [];
  for (const r of results) {
    if (r?.establishmentMeans !== 'NATIVE') continue;
    const place = (typeof r.locality === 'string' && r.locality) || (typeof r.country === 'string' && r.country) || undefined;
    if (place && !places.includes(place)) places.push(place);
  }
  return places.length ? places.slice(0, 4).join(', ') : undefined;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all `encyclopedia.test.ts` tests green (plus the existing `plantId.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add convex/lib/encyclopedia.ts convex/lib/encyclopedia.test.ts
git commit -m "feat(encyclopedia): pure iNaturalist + GBIF parsers"
```

---

### Task 2: Convex `lookupSpecies` action

**Files:**
- Create: `convex/encyclopedia.ts`

**Interfaces:**
- Consumes: `parseINatTaxon`, `parseGbifDistributions`, `EncyclopediaEntry` from `convex/lib/encyclopedia.ts`.
- Produces: `lookupSpecies` action `({ scientificName: string }) => EncyclopediaEntry`.

- [ ] **Step 1: Create the action**

Create `convex/encyclopedia.ts`:

```ts
import { action } from './_generated/server';
import { v } from 'convex/values';
import { parseINatTaxon, parseGbifDistributions, type EncyclopediaEntry } from './lib/encyclopedia';

/** Look up reference data for a species from iNaturalist (photo/summary) + GBIF (taxonomy/native range).
 *  Free, keyless. Each source is best-effort: a failure or empty result simply omits those fields. */
export const lookupSpecies = action({
  args: { scientificName: v.string() },
  handler: async (_ctx, { scientificName }): Promise<EncyclopediaEntry> => {
    const entry: EncyclopediaEntry = {};
    const name = encodeURIComponent(scientificName);

    // iNaturalist: representative photo + common name + wiki summary/link.
    try {
      const r = await fetch(`https://api.inaturalist.org/v1/taxa?q=${name}&rank=species&per_page=1`);
      if (r.ok) Object.assign(entry, parseINatTaxon(await r.json()));
    } catch {
      /* best-effort */
    }

    // GBIF: family/genus (reliable) + native range (best-effort).
    try {
      const m = await fetch(`https://api.gbif.org/v1/species/match?name=${name}`);
      if (m.ok) {
        const match = (await m.json()) as { usageKey?: number; family?: string; genus?: string };
        if (typeof match.family === 'string') entry.family = match.family;
        if (typeof match.genus === 'string') entry.genus = match.genus;
        if (typeof match.usageKey === 'number') {
          try {
            const d = await fetch(`https://api.gbif.org/v1/species/${match.usageKey}/distributions?limit=50`);
            if (d.ok) entry.nativeRange = parseGbifDistributions(await d.json());
          } catch {
            /* best-effort */
          }
        }
      }
    } catch {
      /* best-effort */
    }

    return entry;
  },
});
```

- [ ] **Step 2: Regenerate types + typecheck**

Run: `npx convex codegen && npx tsc --noEmit`
Expected: clean (exit 0); `api.encyclopedia.lookupSpecies` now exists in `convex/_generated`. If `npx convex codegen` fails on missing credentials/network, report BLOCKED with the error.

- [ ] **Step 3: Commit**

```bash
git add convex/encyclopedia.ts convex/_generated/
git commit -m "feat(encyclopedia): keyless lookupSpecies action (iNaturalist + GBIF)"
```

---

### Task 3: Data layer — type + hook

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/hooks.ts`

**Interfaces:**
- Consumes: `api.encyclopedia.lookupSpecies` (Task 2).
- Produces: `EncyclopediaEntry` (view-model type) and `useEncyclopediaLookup(): (scientificName: string) => Promise<EncyclopediaEntry>`.

- [ ] **Step 1: Add the type**

In `src/data/types.ts`, add near the identification types:

```ts
export type EncyclopediaEntry = {
  imageUrl?: string;
  commonName?: string;
  summary?: string;
  nativeRange?: string;
  family?: string;
  genus?: string;
  sourceUrl?: string;
  photoAttribution?: string;
};
```

- [ ] **Step 2: Add the hook**

In `src/data/hooks.ts`, import `EncyclopediaEntry` from `./types` (add to the existing type import block) and add the hook near `useIdentifyPlant`:

```ts
/** Look up reference photo + facts for a species (iNaturalist + GBIF), to confirm an identification. */
export function useEncyclopediaLookup(): (scientificName: string) => Promise<EncyclopediaEntry> {
  const run = useAction(api.encyclopedia.lookupSpecies);
  return useCallback(
    async (scientificName: string) => (await run({ scientificName })) as EncyclopediaEntry,
    [run],
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/data/types.ts src/data/hooks.ts
git commit -m "feat(encyclopedia): data hook useEncyclopediaLookup"
```

---

### Task 4: Compare component

**Files:**
- Create: `src/components/domain/encyclopedia-compare.tsx`

**Interfaces:**
- Consumes: `useEncyclopediaLookup` (Task 3), `IdentifiedCandidate` + `EncyclopediaEntry` from `@/data`.
- Produces:
  ```ts
  type EncyclopediaCompareProps = {
    visible: boolean;
    capturedUri: string | null;
    candidates: IdentifiedCandidate[];
    initialIndex: number;
    onClose: () => void;
    onChoose: (candidate: IdentifiedCandidate) => void;
  };
  export function EncyclopediaCompare(props: EncyclopediaCompareProps): JSX.Element | null;
  ```

- [ ] **Step 1: Create the component**

Create `src/components/domain/encyclopedia-compare.tsx`:

```tsx
/** Side-by-side compare: the user's captured photo vs. an encyclopedia reference (iNaturalist + GBIF),
 *  with a candidate switcher, so the user confirms which Plant.id match is actually their plant. */
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';
import { useEncyclopediaLookup, type EncyclopediaEntry, type IdentifiedCandidate } from '@/data';

type EncyclopediaCompareProps = {
  visible: boolean;
  capturedUri: string | null;
  candidates: IdentifiedCandidate[];
  initialIndex: number;
  onClose: () => void;
  onChoose: (candidate: IdentifiedCandidate) => void;
};

export function EncyclopediaCompare({ visible, capturedUri, candidates, initialIndex, onClose, onChoose }: EncyclopediaCompareProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const lookup = useEncyclopediaLookup();
  const [index, setIndex] = useState(initialIndex);
  const [entry, setEntry] = useState<EncyclopediaEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset to the requested candidate whenever the sheet is (re)opened.
  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const candidate = candidates[index];

  // Fetch reference data whenever the shown candidate changes while open.
  useEffect(() => {
    if (!visible || !candidate) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    setEntry(null);
    lookup(candidate.scientificName)
      .then((e) => active && setEntry(e))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [visible, candidate, lookup]);

  if (!visible || !candidate) return null;

  const half = { flex: 1, borderRadius: 16, overflow: 'hidden' as const, backgroundColor: t.ever100 };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '92%', backgroundColor: t.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: Spacing.md, paddingHorizontal: 18, paddingBottom: insets.bottom + Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <AppText variant="title" style={{ fontSize: 16 }}>Check in encyclopedia</AppText>
            <Pressable onPress={onClose} accessibilityLabel="Close"><Icon name="close" size={22} tone="subtle" /></Pressable>
          </View>

          {/* candidate switcher */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Pressable disabled={index === 0} onPress={() => setIndex((i) => Math.max(0, i - 1))} accessibilityLabel="Previous match" style={{ opacity: index === 0 ? 0.3 : 1, padding: 6 }}>
              <Icon name="chevronLeft" size={22} tone="accent" />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <AppText variant="bodyBold" numberOfLines={1} style={{ fontSize: 14 }}>{candidate.scientificName}</AppText>
              <AppText variant="meta" tone="subtle">{index + 1} of {candidates.length} · {Math.round(candidate.confidence * 100)}%</AppText>
            </View>
            <Pressable disabled={index >= candidates.length - 1} onPress={() => setIndex((i) => Math.min(candidates.length - 1, i + 1))} accessibilityLabel="Next match" style={{ opacity: index >= candidates.length - 1 ? 0.3 : 1, padding: 6 }}>
              <Icon name="chevronRight" size={22} tone="accent" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* side-by-side photos */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={half}>
                <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9, padding: 7 }}>Your photo</AppText>
                {capturedUri ? <Image source={{ uri: capturedUri }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" /> : null}
              </View>
              <View style={half}>
                <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9, padding: 7 }}>Encyclopedia</AppText>
                {loading ? (
                  <View style={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={Palette.ever400} /></View>
                ) : entry?.imageUrl ? (
                  <Image source={{ uri: entry.imageUrl }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />
                ) : (
                  <View style={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Icon name="image" size={26} tone="subtle" />
                    <AppText variant="metaSm" tone="subtle">{failed ? 'Lookup failed' : 'No photo found'}</AppText>
                  </View>
                )}
              </View>
            </View>

            {/* reference facts */}
            {entry?.commonName ? <AppText variant="bodyBold" style={{ fontSize: 14, marginBottom: 4 }}>{entry.commonName}</AppText> : null}
            {entry?.family || entry?.genus ? (
              <AppText variant="small" tone="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>
                {[entry.genus && `Genus ${entry.genus}`, entry.family && `Family ${entry.family}`].filter(Boolean).join(' · ')}
              </AppText>
            ) : null}
            {entry?.nativeRange ? <AppText variant="small" tone="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>Native to: {entry.nativeRange}</AppText> : null}
            {entry?.summary ? <AppText variant="small" style={{ fontSize: 12.5, lineHeight: 19, marginTop: 4 }}>{entry.summary}</AppText> : null}
            {entry?.photoAttribution ? <AppText variant="metaSm" tone="subtle" style={{ fontSize: 9, marginTop: 6 }}>{entry.photoAttribution}</AppText> : null}
            {entry?.sourceUrl ? (
              <Pressable onPress={() => entry.sourceUrl && Linking.openURL(entry.sourceUrl)} style={{ marginTop: 6 }}>
                <AppText variant="small" color={Palette.ever400} style={{ fontSize: 12.5 }}>View on Wikipedia ↗</AppText>
              </Pressable>
            ) : null}
          </ScrollView>

          <NeuPressable onPress={() => onChoose(candidate)} radius={Radius.md} elevation="raised" stretch backgroundColor={t.ever100} accessibilityLabel="This is my plant" style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <Icon name="check" size={18} color={Palette.ever400} />
            <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>This is my plant</AppText>
          </NeuPressable>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS. (If `chevronLeft`/`chevronRight` aren't valid `Icon` names, check `src/components/icon.tsx` for the actual back/forward names and use those — e.g. `back` and `chevronRight`.)

- [ ] **Step 3: Commit**

```bash
git add "src/components/domain/encyclopedia-compare.tsx"
git commit -m "feat(encyclopedia): side-by-side compare component"
```

---

### Task 5: Wire into the capture screen

**Files:**
- Modify: `src/app/(app)/capture.tsx`

**Interfaces:**
- Consumes: `EncyclopediaCompare` (Task 4); existing `candidates`, `chosen`, `setChosen`, `capturedUri` state.

- [ ] **Step 1: Import + state**

In `src/app/(app)/capture.tsx`, add the import:

```tsx
import { EncyclopediaCompare } from '@/components/domain/encyclopedia-compare';
```

Add state near the other identify state (`const [chosen, setChosen] = …`):

```tsx
const [compareOpen, setCompareOpen] = useState(false);
```

- [ ] **Step 2: Add the "Check in encyclopedia" button**

In the identify result block (the `chosen` branch, near the "Add to Garden" button / "other matches" list), add a button that opens the compare view at the chosen candidate's index:

```tsx
{candidates && candidates.length > 0 ? (
  <Pressable
    onPress={() => setCompareOpen(true)}
    accessibilityRole="button"
    accessibilityLabel="Check in encyclopedia"
    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, marginTop: 8 }}
  >
    <Icon name="search" size={16} color={Palette.ever400} />
    <AppText variant="small" color={Palette.ever400} style={{ fontSize: 13 }}>Check in encyclopedia</AppText>
  </Pressable>
) : null}
```

(If `search` is not a valid `Icon` name, use an existing one such as `image`; check `src/components/icon.tsx`.)

- [ ] **Step 3: Render the compare modal**

Just before the screen's closing root `</View>` (alongside the result sheet), render:

```tsx
<EncyclopediaCompare
  visible={compareOpen}
  capturedUri={capturedUri}
  candidates={candidates ?? []}
  initialIndex={chosen && candidates ? Math.max(0, candidates.findIndex((c) => c.speciesId === chosen.speciesId)) : 0}
  onClose={() => setCompareOpen(false)}
  onChoose={(c) => { setChosen(c); setCompareOpen(false); }}
/>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/capture.tsx"
git commit -m "feat(encyclopedia): wire Check-in-encyclopedia compare into capture screen"
```

---

### Task 6: Device verification

No code — verify end-to-end on the device dev build (JS + Convex only; no rebuild, but `npx convex dev` must be running to serve the new action).

- [ ] **Step 1:** `npx convex dev` (deploys the new action) + `npx expo start --dev-client`.
- [ ] **Step 2:** Identify a real plant → in the result sheet tap **Check in encyclopedia** → the compare sheet opens showing your photo vs. the iNaturalist reference; family/genus and (when available) "Native to:" show; Wikipedia link opens.
- [ ] **Step 3:** Use the **‹ ›** switcher to step through candidates — each loads fresh reference data (spinner between).
- [ ] **Step 4:** Tap **This is my plant** on a non-top candidate → sheet closes, that candidate is now selected → Add to Garden → the created plant's species matches the chosen one.
- [ ] **Step 5:** Edge cases: a candidate with no iNaturalist photo → "No photo found" placeholder, rest still renders; airplane-mode a lookup → "Lookup failed", no crash.
- [ ] **Step 6:** Commit any verification fixes: `git add -A && git commit -m "fix(encyclopedia): address device verification findings"`.

---

## Self-Review

- **Spec coverage:** iNaturalist photo/common-name/summary/link (Task 1 `parseINatTaxon` + Task 2) ✓; GBIF family/genus + best-effort native range (Task 1 `parseGbifDistributions` + Task 2 match) ✓; keyless graceful-partial action (Task 2) ✓; type + hook (Task 3) ✓; side-by-side compare + candidate switcher + loading/empty/error + photo attribution + "This is my plant" select-only (Task 4) ✓; button + wiring, Add to Garden unchanged (Task 5) ✓; no schema change / no caching / no rebuild ✓; device verification incl. graceful states (Task 6) ✓.
- **Placeholder scan:** none — full code in every code step; the two `Icon`-name caveats point at a concrete file to confirm against, not vague "handle it".
- **Type consistency:** `EncyclopediaEntry` is identical in `convex/lib/encyclopedia.ts` (Task 1) and `src/data/types.ts` (Task 3); `lookupSpecies({scientificName}) => EncyclopediaEntry` matches across Task 2 (action), Task 3 (hook), Task 4 (consumer). `EncyclopediaCompareProps` matches between Task 4 (definition) and Task 5 (usage). Candidate fields (`scientificName`, `confidence`, `speciesId`) match the `IdentifiedCandidate` type shipped with the identify feature.
- **Known limitation (documented in spec + constraints):** GBIF native range is frequently empty (NATIVE-flagged records are sparse); the UI omits the line when absent, and family/genus + the iNaturalist photo carry the feature.
```
