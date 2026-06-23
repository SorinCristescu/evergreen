# Design: Real plant identification (Plant.id)

**Date:** 2026-06-23
**Status:** Approved (brainstorming) — pending implementation plan
**Scope:** Replace the mocked "Identify" flow on the capture screen with real plant identification powered by the Plant.id (Kindwise) v3 API. "Diagnose" remains mocked this round.

## Context

The capture screen (`src/app/(app)/capture.tsx`) has two AI flows — **Identify** ("what plant is this?") and **Diagnose** ("what's wrong with it?") — both currently returning hardcoded mock data (`IDENTIFIED`, `MOCK_DIAGNOSES`). The camera now captures real frames on device (see the camera work in this codebase) and uploads to Convex `_storage`. The backend is already shaped for this feature: the schema has `species` (rich care catalog), `identifications` (per-image candidate cache), and `plants.speciesId`; `convex/access.ts` demonstrates the Convex `action` + `process.env` + `fetch` pattern; and `species.externalIds.plantId` anticipates Plant.id.

This is a vertical slice: prove the full camera → AI → species → garden pipeline with Identify; Diagnose reuses the same infrastructure next round.

## Goals

- A captured/picked photo is identified by Plant.id, returning a ranked species result with real confidence.
- A successful identification **persists fully**: upsert a `species` record (care profile mapped from Plant.id details, sensible defaults for gaps), and "Add to Garden" creates a plant **linked to that species** with the captured photo as its cover.
- Results are cached by image hash to avoid spending Plant.id credits on repeats.
- The result sheet shows **real** data (species, common name, confidence, care cards from the care profile) — no UI redesign, just real data replacing mocks.

## Non-goals (this round)

- Diagnose (stays mocked).
- Botanical verification / human review of AI species (`species.verified` stays `false`).
- Client-side image downscaling (see Open Risks).
- A polished multi-candidate browser beyond a simple "other matches" list.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Feature scope | Identify only | Vertical slice; Diagnose reuses the pipeline later |
| Provider | Plant.id (Kindwise) v3, single vendor | Most precise consumer ID + built-in health for later; schema already has `externalIds.plantId` |
| Persistence | Full: upsert species + careProfile + link plant→species | Uses the schema as designed; unlocks care cards + care tasks |
| Image >2MP | Accept Plant.id tolerance for now (no `expo-image-manipulator`) | Avoids another native rebuild; revisit only if accuracy/errors demand |
| Caching | Dedupe by image hash via `identifications` table | Saves API credits |

## Plant.id v3 integration

- `POST https://plant.id/api/v3/identification?details=common_names,taxonomy,watering,best_light_condition,best_soil_type,toxicity,description&language=en`
- Header: `Api-Key: <PLANTID_API_KEY>`
- Body: `{ images: ["<base64>"], similar_images: true }`
- Response: `result.is_plant.{binary,probability}` and `result.classification.suggestions[]` with `{ id, name, probability, details }`.
- Key stored in Convex env: `npx convex env set PLANTID_API_KEY <key>`.

## Architecture

All AI work lives in Convex; the UI stays data-driven.

### `convex/identify.ts`
- **`identifyPlant`** (public `action`, default runtime — `fetch` available, no `"use node"`):
  - Args: `{ storageId: Id<'_storage'> }`.
  - Read the image via `ctx.storage.get(storageId)`; compute an image hash.
  - `ctx.runQuery` cache lookup in `identifications` by hash → if hit, return cached candidates (no API call).
  - On miss: base64-encode, POST to Plant.id with the env key, map `suggestions[]` → candidates `{ scientificName, commonName, confidence, plantIdSuggestionId, details }`.
  - Handle `is_plant.binary === false` / low top probability → return `{ candidates: [], notAPlant: true }`.
  - `ctx.runMutation(internal.identify.saveIdentification, …)` to persist.
  - Return `{ identificationId, candidates }`.
- **`saveIdentification`** (`internalMutation`):
  - Upsert top candidate(s) into `species` (find by `scientificName` via `by_scientificName`; else insert with `source:'ai'`, `verified:false`, `externalIds.plantId`, and a `careProfile` mapped from Plant.id `watering`/`best_light_condition`/`best_soil_type`/`toxicity` with documented defaults for missing fields).
  - Insert the `identifications` row (`userId`, `storageId`, `imageHash`, `candidates` with resolved `speciesId`, `createdAt`).
  - Return `{ identificationId, candidates }` (candidates now carry `speciesId`).
- **`identificationByHash`** (`internalQuery`): cache lookup used by the action.

### `convex/plants.ts`
- Extend **`createPlant`** to accept optional `speciesId: v.id('species')` and `coverStorageId: v.id('_storage')` — link the plant to the upserted species and reuse the already-uploaded photo as cover (no re-upload). Existing string `scientificName` path stays for "Add manually".

## Components & data flow (capture screen)

1. **Identify shutter** → upload the captured frame to storage: reuse `generatePlantUploadUrl` + the `uploadFileToStorage` XHR helper in `src/data/hooks.ts` → `storageId`.
2. Call `identifyPlant({ storageId })`; show a **loading state** in the result sheet (reuse the existing `ActivityIndicator`).
3. Render the **real** result: top match scientific + common name, real confidence pill, and the light/water care cards populated from the matched `species.careProfile` (replacing the hardcoded "Bright indirect / Every 7 days").
4. **Add to Garden** → `createPlant({ speciesId, nickname, coverStorageId, spaceId })`. Linking a species with a `careProfile` is what drives the care guide and care tasks (the exact watering-task generation path is to be confirmed during planning).
5. **"Not quite right? See other matches"** → list stored candidates; selecting one sets it as the chosen species for Add to Garden.

## New code seams (small, isolated)

- `src/data/hooks.ts`:
  - `useUploadImage(): (fileUri) => Promise<ID>` — generic storage upload (URL + `uploadFileToStorage`).
  - `useIdentifyPlant()` — wraps `useAction(api.identify.identifyPlant)`.
  - Extend `NewPlant` + `useCreatePlant` with optional `speciesId` and `coverStorageId`.
- `src/data/types.ts`: `IdentifiedCandidate { scientificName; commonName?; confidence; speciesId? }`, `IdentificationResult { identificationId; candidates; notAPlant? }`.
- `src/app/(app)/capture.tsx`: identify-mode shutter handler (upload → identify → loading → result), real result rendering, Add-to-Garden wiring, "other matches" list.

## Error & edge handling

- **Not a plant / low confidence** → "Couldn't identify — try a clearer, closer photo" state with Retake (no garden write).
- **API error / missing key / network** → graceful error state in the sheet; never crash; allow Retake.
- **Cache hit** → no Plant.id call, instant result.
- **Image >2MP** → sent as-is for now; if Plant.id rejects/accuracy suffers, add downscaling later (Open Risks).

## Prerequisites

- Plant.id API key (free trial credits) set via `npx convex env set PLANTID_API_KEY <key>`. Without it the action returns the graceful error state.

## Open risks

- **Image size:** captured frames may exceed Plant.id's recommended 2MP. Mitigation if needed: `expo-image-manipulator` to downscale before upload — but that is a **new native module requiring another EAS dev build**, so deferred unless real-world results require it.
- **Care-profile mapping fidelity:** Plant.id's `watering`/light fields don't map 1:1 to `careProfile` (`waterDays`, `light` enum, `difficulty`). We map what's available and default the rest; `verified:false` flags these for later refinement.
- **Care-task generation:** the design assumes linking `speciesId` produces Today watering tasks; the exact derivation path must be confirmed during planning.

## Verification

1. `npx convex env set PLANTID_API_KEY <key>`.
2. On the device dev build, open Identify, capture a real houseplant → real species + common name + confidence + care cards from the care profile.
3. Add to Garden → confirm a `species` row exists, `plant.speciesId` is set, the cover photo is the captured frame, and care tasks/guide appear on plant detail / Today.
4. Capture a non-plant (e.g., a mug) → "couldn't identify" state, no garden write.
5. Re-identify the same image → served from the `identifications` cache (no new credit spent).
