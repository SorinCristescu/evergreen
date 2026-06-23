# Design: Richer plant "About" section (from Plant.id details)

**Date:** 2026-06-23
**Status:** Approved (brainstorming) — pending implementation plan
**Scope:** Surface the plant-data Plant.id already returns (everything in `details` except `similar_images`) on the plant-detail **About** tab, so AI-identified plants show a real description, taxonomy, soil/light/toxicity info — not the bare About they show today.

## Context

The plant-detail About tab (`src/app/(app)/plant/[plantId].tsx`) renders a generic structure from `plantDetail`'s `about` object: a **lead** paragraph, a **Quick facts** grid (`about.facts: {label,value}[]`), and **Good to know** bullets (`about.notes: string[]`). Seeded species have curated About data (via `convex/seed.ts` `enrichPlants` + `SPECIES_ABOUT`). But **AI-identified species** (created by `convex/identify.ts` `saveIdentification`) only store `scientificName`, `commonNames`, `careProfile` — so their About is nearly empty.

Crucially, the identify call already requests rich `details` (`taxonomy`, `description`, `toxicity`, `best_soil_type`, `best_light_condition`, `common_names`) but `parsePlantIdResult` discards everything except name/probability/common-name/watering/light. This feature **persists the fields we already fetch** and renders them — no new API calls, no new credits.

## Goals

- AI-identified plants get a real About: a description paragraph, Family + Genus, light/soil/toxicity info, and a source attribution.
- Reuse the existing generic About UI (facts grid + notes) — most work is backend (parse → store → expose).
- No new Plant.id credits; no Claude call.

## Non-goals

- Diagnose, care-task generation (unchanged / out of scope).
- A separate structured "Origin" field — native region lives in the description prose (per decision).
- Surfacing the full taxonomy lineage in the UI (kingdom/phylum/class/order are **stored** but only **Family + Genus** are shown).
- Backfilling species identified before this ships (they enrich on next identification).
- The "See full Species page" button stays a placeholder (unchanged).

## Decisions

| Decision | Choice |
|---|---|
| What to persist | All Plant.id `details` except `similar_images` |
| Origin / geographic area | From `description.value` prose; no separate field, no Claude call |
| Pet-safety | Derive a "Pet-safe: Yes/No/Caution" fact from the `toxicity` text |
| Taxonomy display | Show **Family + Genus** as facts; store the full lineage |
| Attribution | Show a source link from `description.citation`/`licenseUrl` (Wikipedia CC BY-SA — required) |
| Schema migration | New `species` fields are **optional** → additive, no migration/backfill |

## Field mapping (Plant.id `details` → species → About)

| Plant.id `details` field | Stored on `species` | Shown in About |
|---|---|---|
| `common_names` | `commonNames` (existing) | (title elsewhere) |
| `taxonomy` `{kingdom,phylum,class,order,family,genus}` | `taxonomy` (new, optional object) + `family` (existing, from `taxonomy.family`) | Family + Genus facts |
| `description` `{value,citation,license_name,license_url}` | `description` (new, optional object) | **lead** paragraph + **source** link |
| `best_light_condition` (text) | `lightText` (new) + `careProfile.light` enum (existing) | Light fact + a "Good to know" note |
| `best_soil_type` (text) | `soilText` (new) | Soil fact/note |
| `toxicity` (text) | `toxicity` (new) | Pet-safe fact + note |
| `watering` `{min,max}` | `careProfile.waterDays` (existing) | Water (care guide) |
| `similar_images` | — (excluded) | — |

## Architecture / data flow

1. **Parser** — `convex/lib/plantId.ts` (pure, unit-tested): extend `RawCandidate` with optional `family`, `taxonomy`, `description`, `lightText`, `soilText`, `toxicity`, parsed defensively from `details`. Existing fields unchanged.
2. **Schema** — `convex/schema.ts` `species`: add optional `taxonomy` (object of optional strings), `description` (`{ value: string; citation?; licenseName?; licenseUrl? }`), `lightText`, `soilText`, `toxicity`. Keep `family`/`origin`/`funFacts`.
3. **Persist** — `convex/identify.ts` `saveIdentification`: extend the `candidates` arg validator and the species insert to store the new fields; set `family` from `taxonomy.family`.
4. **Query** — `convex/plants.ts` `plantDetail` → `about`:
   - `lead` = `species.description?.value` ?? owner `description` ?? existing fallback.
   - `facts` = Family, Genus, Light, Difficulty, Pet-safe (from `toxicity`), Soil (short) — only push facts whose data exists.
   - `notes` = curated `funFacts` when present (seeded); else built from `lightText` / `soilText` / watering / `toxicity` (AI plants).
   - `source` = `{ label: description.licenseName ?? 'Source', url: description.licenseUrl ?? description.citation }` when a description exists.
5. **Type** — `src/data/types.ts`: `about` gains `source?: { label: string; url?: string }`.
6. **UI** — `plant/[plantId].tsx` About tab: existing lead/facts/notes rendering stays; add a small **Source: <label>** link (opens `url` via `Linking.openURL`) under the notes when `about.source` exists.

## Edge cases

- Missing `details` fields → each is optional; facts/notes only render what exists (no empty rows).
- Pet-safety derivation: `toxicity` text containing "toxic" / "poisonous" → "Caution" (or "No"); explicit "non-toxic" / "not toxic" → "Yes"; otherwise omit the fact (don't guess).
- Seeded species (curated About) are unaffected — they have no `description`/`taxonomy` from Plant.id, so the query falls back to their existing `family`/`origin`/`funFacts`.

## Testing

- **Unit (vitest)** — extend `convex/lib/plantId.test.ts` with a full-`details` fixture asserting `family`, `taxonomy.genus`, `description.value`, `lightText`, `soilText`, `toxicity` are parsed, and that missing details degrade to `undefined` (no throw).
- **Device verification** — identify a real plant → About shows the description paragraph (incl. native region), Family + Genus, soil/light/toxicity notes, a Pet-safe fact, and a working Source link. Seeded plants' About still renders their curated content.

## Verification checklist

1. `npx tsc --noEmit` clean; `pnpm test` green (parser fixture).
2. On device (Plant.id key set): identify a houseplant → open it → About tab shows the rich content + source link.
3. A seeded plant's About is unchanged.
