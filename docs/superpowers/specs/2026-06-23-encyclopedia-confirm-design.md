# Design: "Check in encyclopedia" — confirm the identification

**Date:** 2026-06-23
**Status:** Approved (brainstorming) — pending implementation plan
**Scope:** Add a verification step to the Identify flow. After Plant.id returns candidates, the user can open a **side-by-side compare view** — their captured photo vs. an encyclopedia reference photo + facts — to confirm which candidate is actually their plant before adding it to the garden.

## Context

The merged Identify feature (`convex/identify.ts` + capture screen) shows Plant.id's ranked candidates with confidence, but the user has no way to *verify* a guess — Plant.id's top match isn't always right, and the user can't tell "Monstera deliciosa" from a look-alike by name alone. This feature lets them **confront** their photo against authoritative reference imagery and pick the correct match.

Builds directly on the existing identify result sheet (`src/app/(app)/capture.tsx`), which already holds `capturedUri` and the candidate list (`candidates`, `chosen`). Purely additive — no change to the Plant.id call or persistence.

## Goals

- From the identify result sheet, open a compare view showing the user's shot beside an encyclopedia reference (photo, scientific + common name, native range, short summary, source link).
- Step through Plant.id's candidates and pick the right one ("This is my plant"), then Add to Garden.
- Free, no API keys, no new native module (so no EAS rebuild).

## Non-goals

- Persisting encyclopedia data on the species (that's the separate richer-About follow-up, which can reuse this lookup).
- Caching lookups (v1 fetches on demand; caching by `scientificName` is a noted follow-up).
- One-tap select-and-add — "This is my plant" only **selects**; Add to Garden stays a separate, deliberate tap.
- Changing Plant.id request/persistence or the Diagnose flow.

## Decisions

| Decision | Choice |
|---|---|
| Reference photo + summary | **iNaturalist** taxa API (free, keyless) |
| Native range | **GBIF** species match → distributions (free, keyless) |
| Presentation | Side-by-side compare view (captured vs. reference), candidate switcher |
| "This is my plant" | Selects the candidate only; user then taps Add to Garden |
| Caching / schema | None in v1 (on-demand lookup; no schema change) |
| Rebuild | Not needed — JS + Convex only |

## External APIs (both free, no key, default Convex runtime via `fetch`)

- **iNaturalist:** `GET https://api.inaturalist.org/v1/taxa?q=<scientificName>&rank=species&per_page=1`
  → `results[0]`: `preferred_common_name`, `default_photo.medium_url`, `default_photo.attribution`, `wikipedia_summary`, `wikipedia_url`.
- **GBIF:** `GET https://api.gbif.org/v1/species/match?name=<scientificName>` → `usageKey`; then
  `GET https://api.gbif.org/v1/species/{usageKey}/distributions` → records with `country`/`locality` + `establishmentMeans` (`NATIVE`/`INTRODUCED`). Native range = the `NATIVE` localities/countries, deduped, first few joined.

## Architecture / data flow

1. **Pure parsers** — `convex/lib/encyclopedia.ts` (no Convex imports, unit-tested):
   - `parseINatTaxon(json) → { imageUrl?, commonName?, summary?, sourceUrl?, photoAttribution? }`
   - `parseGbifDistributions(json) → nativeRange?: string` (NATIVE records → deduped place names, capped, joined with ", "; `undefined` if none).
2. **Action** — `convex/encyclopedia.ts` `lookupSpecies` `({ scientificName: string }) → EncyclopediaEntry`. Default runtime. Runs the iNaturalist call and the GBIF match→distributions calls; each is wrapped so any failure/empty result yields `undefined` for that part — the lookup **never throws as a whole** (returns a partial entry). Returns `EncyclopediaEntry`.
3. **Type** — `src/data/types.ts`: `EncyclopediaEntry { imageUrl?: string; commonName?: string; summary?: string; nativeRange?: string; sourceUrl?: string; photoAttribution?: string }`.
4. **Hook** — `src/data/hooks.ts`: `useEncyclopediaLookup(): (scientificName: string) => Promise<EncyclopediaEntry>` wrapping `useAction(api.encyclopedia.lookupSpecies)`.
5. **UI**:
   - `src/components/domain/encyclopedia-compare.tsx` (new) — a modal/sheet: captured photo (`capturedUri`) vs. reference (photo, names, native range, summary, source link), a candidate switcher (prev/next across the passed candidates), loading/empty/error states, and a "This is my plant" action that calls back with the chosen candidate.
   - `src/app/(app)/capture.tsx` — a "Check in encyclopedia" button in the identify result block opens the compare component with the current `candidates` and the active index; on confirm, sets `chosen` and closes. Add to Garden unchanged.

## Edge cases

- iNaturalist returns no match / no `default_photo` → show the reference column with name + range and a "No encyclopedia photo" placeholder.
- GBIF no match or empty distributions → omit the native-range line.
- Network/timeout on a lookup → error state with Retry; the user can still pick by name.
- Switching candidates re-runs the lookup for the newly shown candidate (loading state per switch).
- Photo attribution: render `photoAttribution` under the reference image (iNaturalist photos are CC-licensed → attribution shown).

## Testing

- **Unit (vitest)** — `convex/lib/encyclopedia.test.ts`: iNat fixture → entry fields; GBIF distributions fixture (mixed NATIVE/INTRODUCED) → native-range string with only NATIVE places, deduped/capped; empty/garbage inputs → `undefined` (no throw).
- **Device** — identify a plant → "Check in encyclopedia" → compare your shot vs. reference, switch candidates, "This is my plant" → Add to Garden. Verify graceful states when iNat/GBIF return nothing and on a forced network error.

## Verification checklist

1. `npx tsc --noEmit` clean; `pnpm test` green (encyclopedia parser tests).
2. On device: full compare flow works; candidate switching loads fresh data; missing-data and error states render without crashing; selecting a non-top candidate carries through to the created plant's species.
