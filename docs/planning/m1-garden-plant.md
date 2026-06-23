# M1 — Location & Plant core (data backbone)

> **Milestone goal:** a user sets up their **first Location** (city/climate/level/goals), creates
> **Places** (Indoor/Outdoor/Greenhouse) and **Spaces** (rooms/areas), adds a **Plant** manually
> (no AI yet), uploads timestamped photos, and sees a growth timeline/journal — all syncing
> through Convex, with offline captures queued and flushed on reconnect. This is the data backbone
> everything else (M2 Identify, M3 Care, M5 Encyclopedia) hangs off.
>
> Parent: [`ROADMAP.md`](./ROADMAP.md). Entity names per [`CONTEXT.md`](../../CONTEXT.md):
> **Location → Place → Space → Plant** ("Garden" is the tab name, not an entity). Tasks are
> commit-sized; *(test-first)* writes the failing `convex-test` before the implementation.

**Milestone Done when:** set up a Location → add a Space → add a Plant to it → upload 2 photos on
different days → Plant detail shows a chronological timeline → move the Plant to another Space →
archive the Plant (offboarding) → all of it syncs across two devices, and a photo captured offline
shows "pending sync" then lands on reconnect.

> **Multi-Location note:** the `locations` schema and "Add location" entry are built here, but the
> **free = 1 Location** cap is *enforced* in M7. In M1, leave a gating stub (always allow) so the
> flow is testable; M7 swaps in the entitlement check + downgrade `locked` handling.

---

## Story: Schema — locations, spaces, plants, plantPhotos

- [ ] Add `locations` (userId, name, climate{label,lat,lon}, gardeningLevel, goals[],
      `status: active|locked`, order) + `by_user` index. *(test-first)*
  - **Done when:** `convex-test` validates a location row + rejects a missing `userId`.
- [ ] Add `spaces` (userId, locationId, `place: indoor|outdoor|greenhouse`, name, order) +
      `by_user`, `by_location` indexes. *(test-first)*
  - **Done when:** schema validates; an Indoor space cannot be named from the outdoor preset set
    (validation rule: Indoor = rooms only).
- [ ] Add `plants` (userId, spaceId, optional speciesId, nickname, pot/soil/repotted, tags,
      `status: alive|archived|lost`) + `by_user`, `by_space` indexes. *(test-first)*
  - **Done when:** schema validates; `speciesId` is optional (unidentified plants allowed).
- [ ] Add `plantPhotos` (plantId, userId, storageId, note, takenAt) + `by_plant` index.
      *(test-first)*
  - **Done when:** schema validates a photo row referencing a plant.

## Story: Location setup flow (per-Location onboarding)

- [ ] `createLocation` / `renameLocation` / `deleteLocation` mutations with **ownership checks**
      and the (stubbed in M1) free-tier cap hook. *(test-first)*
  - **Done when:** non-owner rejected; delete of a Location with spaces/plants prompts the
    move/archive path rather than orphaning rows.
- [ ] Location setup screens — name (Home/Holiday house/custom) · climate (device location +
      manual-city fallback) · gardening Level · Goals. *(per Location)*
  - **Done when:** completing setup persists a Location; permission-denied falls back to manual
    city and never blocks.
- [ ] `listLocations` query (ordered) + **Location switcher** on the Garden tab header.
  - **Done when:** returns only the caller's locations; switcher changes the active Location.

## Story: Place/Space CRUD

- [ ] `createSpace` / `renameSpace` / `deleteSpace` mutations (place enum required) with ownership
      checks. *(test-first)*
  - **Done when:** create requires a valid owned `locationId` + a valid `place`; Indoor rejects
    outdoor-only preset names; delete of a Space with plants prompts move.
- [ ] "Manage Spaces" UI + inline "Other" custom-Space creation during add-plant.
  - **Done when:** predefined Spaces map to their Place automatically; custom Spaces ask for Place.
- [ ] `movePlantToSpace` mutation + UI affordance. *(test-first)*
  - **Done when:** moving a plant updates `spaceId`; ownership of both spaces enforced; moving
    across Place/Location flags the CarePlan for re-evaluation (hook; logic in M3).

## Story: Plant CRUD (manual add, pre-AI)

- [ ] `createPlant` / `updatePlant` mutations with ownership checks. *(test-first)*
  - **Done when:** create requires a valid owned `spaceId`; update rejects non-owners.
- [ ] Add-plant setup sheet — nickname · Place · Space (predefined or "Other") · manual species
      name · pot size · soil · tags.
  - **Done when:** submitting creates a Plant visible in its Space immediately.
- [ ] Plant detail screen — header (cover + nickname), Care/Timeline/Journal tabs, care-profile
      **placeholder** (filled by M3), "Move to another Space" in overflow.
  - **Done when:** opening a plant shows its data; placeholders are clearly labeled.
- [ ] `listPlantsBySpace` / `listPlantsByLocation` queries.
  - **Done when:** Garden tab shows the active Location's plants grouped by Space (FlashList),
    excluding archived/lost by default, filterable by Place.

## Story: Photos + growth timeline/journal

- [ ] Client-side image resize/compress before upload (HEIC-safe). *(util — test the transform)*
  - **Done when:** large/HEIC images are downscaled to a sane max before upload.
- [ ] Upload flow → Convex file storage → insert `plantPhotos` row with `takenAt`.
  - **Done when:** a captured/picked photo uploads and appears on the plant.
- [ ] Photo gallery + **chronological timeline/journal** per plant (photo + optional note).
  - **Done when:** photos render in date order; adding a note persists it.
- [ ] Set/replace **cover photo** (`plants.coverStorageId`); default to first photo.
  - **Done when:** changing cover updates the Garden grid + detail header.

## Story: Dead/lost plant offboarding

- [ ] `archivePlant` mutation — soft-delete via `status` (`archived` | `lost`), retain journal.
      *(test-first)*
  - **Done when:** archived plants leave the active grid but their photos/journal remain
    retrievable (Profile › Memorial).
- [ ] Offboarding UI — empathetic "mark as gone" flow (cause picker, non-punitive).
  - **Done when:** a user can archive a plant and optionally view archived plants.

## Story: Offline write-queue foundation (MMKV)

> Implements the graceful-degradation contract (PRD §10): reads use Convex's cache; writes for
> photo/journal/mark-done/space-move are queued locally and flushed on reconnect. No full offline
> editing.

- [ ] MMKV-backed **write queue** — enqueue photo upload / journal entry / space-move / (future)
      mark-done intents with a stable client id. *(test-first — pure queue logic)*
  - **Done when:** tests cover enqueue, ordering, idempotent dedup by client id, and dequeue.
- [ ] Connectivity listener → **flush on reconnect**, replaying queued intents to Convex.
  - **Done when:** an action taken offline is applied exactly once after reconnect.
- [ ] **"Pending sync"** indicator on affected items.
  - **Done when:** queued items show pending state and clear once synced.
