# Evergreen — Implementation Roadmap

> Executable breakdown of [`prd.md`](../../prd.md) into **Epics → Stories → Tasks**.
> Entity names are canonical per [`CONTEXT.md`](../../CONTEXT.md): **Species · Plant · CarePlan ·
> CareTask**. Architecture decisions in [`docs/adr/`](../adr/).

## How this roadmap works

- **Sequencing:** a thin runnable **walking skeleton** (M0) first, then each milestone is a
  **vertical slice** — schema + backend function + UI, working end-to-end — built in dependency
  order. The app always runs.
- **Rolling-wave planning:** the full Epic→Story map for *all* of v1 lives here. Only **M0** and
  **M1** are decomposed into commit-sized tasks today (see [`m0-skeleton.md`](./m0-skeleton.md),
  [`m1-garden-plant.md`](./m1-garden-plant.md)). Milestones **M2–M7** stay at Story level below
  until you near them — then each gets its own `mN-*.md` task file, just-in-time. This keeps
  distant tasks from rotting.
- **Tasks** are commit-sized (~one atomic PR), written imperatively, each with a **"Done when"**
  line. **Logic** (Convex functions, care/watering algorithm, entitlement caps, moderation
  gating) is **test-first** (Jest + `convex-test`, set up in M0). **UI** is verified manually +
  light smoke tests. No time estimates — order implies priority.
- **All milestones ship in v1.0** (per [ADR-0001](../adr/0001-full-scope-v1-care-community-ai.md));
  this is build *order*, not release scope. Deferred-to-later items (light meter, marketplace,
  local-notif mirror) are tagged where they appear.

## Milestone dependency graph

```
M0 Skeleton
  └─ M1 Garden & Plant (data backbone)
        ├─ M2 AI Identification ─┐
        │                        ├─ M3 Care plans & reminders
        │                        └─ M4 Dr. Plant
        ├─ M5 Encyclopedia  (needs species from M2)
        └─ M6 Community & moderation
              └─ M7 Monetization gating (gates features from M1–M6)
```

M1 unblocks everything. M2 establishes `species`, which M3/M4/M5 build on. M7 is last because it
*gates* features that must exist first.

## Progress

- [ ] **M0 — Walking Skeleton** → [tasks](./m0-skeleton.md)
- [ ] **M1 — Garden & Plant core** → [tasks](./m1-garden-plant.md)
- [ ] **M2 — AI Identification** *(story-level below; task it out when starting)*
- [ ] **M3 — Care plans & reminders**
- [ ] **M4 — Dr. Plant**
- [ ] **M5 — Encyclopedia**
- [ ] **M6 — Community & moderation**
- [ ] **M7 — Monetization gating**

---

## M0 — Walking Skeleton
*Goal: a signed-in user sees the 5-tab shell, one screen reads+writes Convex, `pnpm test` is
green. Surfaces the Clerk↔Convex↔Expo integration risk on day one.* **Fully tasked →
[`m0-skeleton.md`](./m0-skeleton.md).**

**Epic: Project foundation**
- Story: Convex wiring
- Story: Clerk auth wiring
- Story: Design-system tokens + base components
- Story: 5-tab + camera-FAB navigation shell
- Story: Test / lint / typecheck tooling
- Story: Vendor-account + env-keys checklist (Convex, Clerk, Plant.id, RevenueCat, image-
  moderation, EAS dev build) — *start early; some have lead time (Apple Small Business Program,
  Plant.id pricing).*

---

## M1 — Location & Plant core (data backbone)
*Goal: set up the first Location (city/climate/level/goals), create Places/Spaces, add a Plant
manually, upload timestamped photos, see a growth timeline — all syncing via Convex, offline
captures queued.* **Fully tasked → [`m1-garden-plant.md`](./m1-garden-plant.md).**

**Epic: Collection management (Location → Place → Space → Plant)**
- Story: Schema — `locations`, `spaces` (with `place` enum), `plants` (→ `spaceId`), `plantPhotos`
- Story: Location setup flow (name · climate · level · goals) — per-Location
- Story: Place/Space CRUD (predefined + custom "Other"; Indoor = rooms only)
- Story: Plant CRUD (manual add, pre-AI) + move Plant between Spaces/Places/Locations
- Story: Garden tab — Location switcher + Place chips + grouped by Space
- Story: Photos + growth timeline/journal
- Story: Dead/lost plant offboarding (archive)
- Story: Offline write-queue foundation (MMKV)

> **Free-tier note:** the single-Location cap (free) is *enforced* in M7, but the `locations`
> schema + "Add location" entry are built here (gating stub points at M7).

---

## M2 — AI Identification *(story-level — task out when starting)*
*Goal: photograph a plant → get Species + confidence + care preview → one tap "Add to Garden"
creates a Plant. The magic moment. Uses Plant.id for vision + Claude for gap-fill
([ADR-0002](../adr/0002-specialist-id-plus-llm-reasoning.md)).*

**Epic: Identify**
- Story: `species` schema + `identifications` schema + indexes
- Story: Convex action → Plant.id (isolated behind one action; key in env)
- Story: Low-confidence handling — top-N candidates + manual-override path
- Story: Claude species-gap generation → cache row (`source:"ai", verified:false`)
- Story: Image-hash dedup (reuse cached identification, save cost)
- Story: Free-tier ID-cap counter check (stub; enforced fully in M7)
- Story: Capture UI (camera + gallery) → result screen → "Add to Garden" (creates Plant)
- Story: Identification history list

**Key edges:** non-plant photo → "no plant detected"; cap reached → paywall hook; cover the
`identifyPlant` action with tests around cap + dedup + candidate mapping.

---

## M3 — Care plans & reminders *(story-level)*
*Goal: each Plant gets a CarePlan emitting CareTasks; server-driven reminders arrive via push;
done/snooze/skip; streaks. Seasonal + Open-Meteo advisory (never auto-skip).*

**Epic: Smart care**
- Story: `carePlans` + `careTasks` schema + indexes (incl. `by_status_due` for cron)
- Story: Claude care-plan generation (Species facts + Location climate/level + Place/Space + pot/soil → cadences) *(test the schema-validation + fallback defaults)*
- Story: Care/watering algorithm — seasonal multiplier + due-date computation *(test-first; this is the logic that must not silently misfire)*
- Story: Open-Meteo integration — advisory "rain expected — skip?" hint, dismissible, **never auto-skips** *(test the advisory decision logic)*
- Story: Convex cron — scan due CareTasks, respect prefs/quiet-hours/timezone *(test-first)*
- Story: Expo push — token storage (`pushTokens`), send via Expo Push API, handle receipts + prune `DeviceNotRegistered`
- Story: Today screen — due tasks, mark done/snooze/skip
- Story: Streaks — increment on completion, gentle break, timezone-safe *(test-first)*

**Note:** local-notification mirror = **v1.1**, not here.

---

## M4 — Dr. Plant *(story-level)*
*Goal: photograph a sick leaf → diagnosis + severity + step-by-step Treatment; track progress +
improvement photos.*

**Epic: Diagnostics**
- Story: `treatments` schema + indexes
- Story: Convex action → Plant.id health-assessment endpoint (isolated)
- Story: Claude — turn raw detection into diagnosis + ordered Treatment steps; low-confidence →
  explanatory + "consult a human" *(test the prompt-output validation)*
- Story: Treatment UI — start, check off steps, log improvement photos, resolve/abandon
- Story: Preventive-measures suggestions

---

## M5 — Encyclopedia *(story-level)*
*Goal: browse/search Species with filters; species detail page; wishlist. Backed by seeded +
AI-cached Species.*

**Epic: Knowledge**
- Story: Seed script — ~200 common houseplants into `species` (`source:"seed", verified:true`)
- Story: Search + filters (indoor/outdoor, light, difficulty, pet-safe, air-purifying) over `species`
- Story: Species detail page — care guide + community photos/tips
- Story: Wishlist (`wishlist` table) + bookmark UI

---

## M6 — Community & moderation *(story-level)*
*Goal: feed, follows, DMs, swap board, challenges — and the moderation that makes them
shippable. Moderation is the **App-Store gate** (Guideline 1.2): it ships **with** community,
not after.*

**Epic: Community**
- Story: `posts`/`comments`/`saves`/`follows` schema
- Story: Feed (FlashList, paginated) + post detail + create-post (photos + caption + Species/Plant tag)
- Story: Like / comment / save
- Story: Follows + following-feed (exclude blocked users)
- Story: DMs — `messages` schema, real-time conversation, conversation list
- Story: Swap board — `swapListings` (non-commercial, v2-ready), browse/filter, contact via DM
- Story: Challenges (P1) — `challenges` schema + minimal admin

**Epic: Trust & Safety** *(required to ship community)*
- Story: Report (`reports`) + Block (`blocks`) + Mute on every post/comment/DM/user/listing
- Story: Published abuse contact (settings + store listing)
- Story: Text profanity/abuse prefilter *(test-first)*
- Story: Image-moderation API on uploads/DMs (Hive or AWS Rekognition) in a Convex action *(test the gate decision: ok/flag/remove)*
- Story: Admin/moderator queue (role-gated Convex query) to triage `reports`

---

## M7 — Monetization gating *(story-level)*
*Goal: Evergreen+ subscription via RevenueCat; entitlement synced to Convex; free-tier caps
enforced server-side. **Clerk Billing rejected** — Stripe-based, not App-Store-IAP-compliant,
PricingTable web-only.*

**Epic: Subscriptions**
- Story: RevenueCat SDK + EAS dev-build config; `Purchases.logIn(clerkUserId)` so webhook
  `app_user_id` maps to `users.by_clerkId`
- Story: Native paywall (offerings → purchase → optimistic unlock from `CustomerInfo`)
- Story: RevenueCat webhook → Convex `httpAction` → set `users.entitlement` *(test the event→entitlement mapping)*
- Story: Server-side free-tier caps — **Locations (1)** + plants (~5) + AI IDs (~3/mo) enforced in mutations/actions *(test-first; this is revenue-critical logic)*
- Story: Gate premium features (multiple Locations, Dr. Plant, unlimited ID, full community posting) on authoritative Convex entitlement
- Story: Downgrade handling — Locations beyond the free cap flip to `status:"locked"` (read-only, never deleted); re-subscribe restores
- Story: Restore purchases; account-deletion clears entitlement state
- Story: Sandbox testing (App Store sandbox + Google license testers)

**Unit economics reference (PRD §11):** plan for ~15% store cut (Apple Small Business Program /
Google subscriptions) + ~0–1% RevenueCat above the $2.5k/mo free tier.

---

## Open questions that gate specific milestones

(From PRD §13 — resolve before the milestone that needs them.)

- **M2/M5:** Species dataset vendor (seed source) · Plant.id vs Pl@ntNet (pricing/coverage).
- **M6:** image-moderation vendor (Hive vs AWS Rekognition) · community cold-start seeding plan.
- **M7:** Apple Small Business Program enrollment (lead time) · trademark on "Evergreen".
- **Cross-cutting:** location granularity (GPS vs manual city) · i18n timing (English-only v1).
