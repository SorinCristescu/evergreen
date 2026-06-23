# Evergreen — Product Requirements Document

**Status:** Draft v0.1 · **Date:** 2026-06-06 · **Owner:** Sorin Cristescu
**Product name:** Evergreen (see §2)

> Companion docs: domain glossary in [`CONTEXT.md`](./CONTEXT.md); architecture decisions in
> [`docs/adr/`](./docs/adr/). Where this PRD says **Species / Plant / CarePlan**, it means
> exactly what `CONTEXT.md` defines — do not let prose and schema drift.

### Reading notes for engineers

- **Target Expo SDK 56.** The repo is already on SDK 56 / React 19 / RN 0.85 / Expo Router with
  the New Architecture on by default. (Per `AGENTS.md`, build against the
  [v56.0.0 docs](https://docs.expo.dev/versions/v56.0.0/).)
- **Stack additions beyond the original brief** (Convex + Clerk + a vision model): **RevenueCat**
  (subscriptions), **Plant.id / Pl@ntNet** (identification + health), **Claude** (reasoning),
  an **image-moderation API** (Hive or AWS Rekognition), and **Open-Meteo** (weather). Each is
  justified in-line.
- This PRD is **opinionated**. Recommended option is stated, with the trade-off, not a menu.

---

## 1. Executive Summary

**Vision.** Evergreen is the daily home for plant people: point your camera at any plant to know
exactly what it is and how to keep it alive, follow an AI-personalized care routine that nudges
you at the right moment, diagnose a sick leaf in seconds, and share the wins (and losses) with a
community of gardeners. *Planta's care utility + Instagram's social loop + a virtual botanist,
in one app.*

**Problem.** Plant ownership has a brutal failure rate — people buy plants, misjudge light and
water, watch them die, and feel they have a "black thumb." Existing tools split the job:
identification apps don't help you keep the plant alive; care apps don't identify or diagnose;
neither gives you a community to learn from. No single app closes the loop from *"what is this?"*
→ *"how do I care for it?"* → *"why is it dying?"* → *"who can help me?"*.

**Target users.** Indoor and outdoor hobby gardeners across three levels — anxious beginners,
collection-building enthusiasts, and accuracy-demanding experts (see §3).

**Value proposition.** Close the full loop: **Identify → Care → Diagnose → Connect.** The care
utility delivers value to a single user on day one; the community deepens retention; the AI is
the connective magic. The differentiator vs. Planta is the integrated community + diagnostics;
vs. PictureThis/Plant.id it's the ongoing care relationship and social layer.

**Strategic risk (stated honestly).** Per [ADR-0001](./docs/adr/0001-full-scope-v1-care-community-ai.md),
v1.0 ships all three pillars at once. This means a **cold-start period** where the community
feels empty until enough concurrent users exist, and it makes **content moderation a launch
gate** (App Store Guideline 1.2), not a later nicety. Both are accepted and planned for, not
wished away.

---

## 2. App Name & Branding

**Name: Evergreen** (subscription tier **Evergreen+**). Adopted as the product name — the design
handoff in [`docs/design/evergreen-mobile-app-design/`](./design/evergreen-mobile-app-design/)
commits to it fully. A trademark + app-store-name availability check is still outstanding
(Open Question §13).

**Branding direction.** Nature-forward **neumorphic** (soft UI), per the design manifest
([`DESIGN-MANIFEST.json`](./design/evergreen-mobile-app-design/DESIGN-MANIFEST.json) — the token
source of truth):

- **Surface:** light green-tinted `--ever-100 #d8e9df`, with soft **dual shadows**
  (`--neu-raised` / `--neu-pressed`) for tactile, rounded components (15–20px radii).
- **Greens:** `--ever-500 #2c694e`, `--ever-700 #1b4332`, `--leaf #3e7c4f` for emphasis/brand.
- **Sparks:** a single **terracotta** `--terra #c76b4f` for streaks/celebration; warm
  `--sun #f5c451` accents. Dark canvas `--ever-900 #0c1f17` for splash-like surfaces.
- **Text:** `--fg #16271e` / `--fg-muted` / `--fg-subtle`.
- **Type:** **General Sans** (display), **Inter** (body), **JetBrains Mono** (metadata/counts).

Dark mode is a v1 requirement (§10). Reference: Planta's restraint, Instagram's feed legibility.

---

## 3. User Personas

### Persona A — "Anxious Beginner" (Maya, 27)
- Owns 2–4 supermarket plants; has killed several. Believes she has a "black thumb."
- **Needs:** know what she has, when to water, and *not* be overwhelmed. Wants reassurance.
- **Jobs:** identify a gift plant; get reminders; understand why leaves are yellowing.
- **Success:** keeps a plant alive for 3 months and feels capable. Most price-sensitive; the
  free tier must be genuinely useful to convert her later.

### Persona B — "Collector Enthusiast" (Devon, 34)
- 25+ plants across rooms + a balcony; active on plant Instagram/Reddit.
- **Needs:** organize a growing collection, track growth over time, show off, swap cuttings,
  learn rare-plant care.
- **Jobs:** organize plants across Places/Spaces; post first-bloom milestones; find cuttings; compare notes.
- **Success:** Evergreen replaces their spreadsheet + their social feed. **Primary monetization
  target** (will pay for unlimited plants + advanced care). Drives community supply.

### Persona C — "Expert / Botanist" (Dr. Priya, 48)
- Deep knowledge; outdoor garden + greenhouse; skeptical of AI accuracy.
- **Needs:** correct identifications, scientific rigor, ability to *contribute* and correct
  facts, trustworthy diagnostics.
- **Jobs:** verify/curate Species data, answer community questions, manage seasonal outdoor care.
- **Success:** trusts the encyclopedia enough to recommend the app; becomes a community authority.
  Low volume, high influence — a credibility and content-quality anchor.

---

## 4. User Stories (epics + acceptance criteria)

> Format: *As a [user], I want [action], so that [goal].* Acceptance criteria are testable.

### Epic: Onboarding & Auth
- *As a new user, I want to sign in with Google/Apple/email magic link, so that I can start
  fast without a password.*
  - **AC:** Clerk hosts all three methods; on first sign-in a `users` row is provisioned in
    Convex via the Clerk identity; a logged-in user with plants>0 is routed by care state —
    **Today** when an Overdue/Due-today CareTask exists (across all Locations), otherwise
    **Garden** (plants=0 → onboarding-first-plant).
- *As a new user, I want a short setup about where I keep plants and my goals, so that my care
  plans fit me.*
  - **AC:** Onboarding sets up the user's **first Location** — name (Home / Holiday house /
    custom), city for climate, gardening **Level** and **Goals** (both stored *per Location*),
    then a first **Place** (Indoor/Outdoor/Greenhouse) + **Space** (room/area) and an optional
    first plant. Steps are skippable; each skip degrades personalization gracefully. Climate
    permission denied → manual-city fallback, never blocks onboarding.
- *As a user with plants in more than one place, I want multiple Locations, so that each home gets
  its own climate-correct care.*
  - **AC:** **free tier = exactly one Location; Evergreen+ = multiple.** Adding a Location (from
    Profile) re-runs the per-Location setup; on free it raises the paywall. Each Location carries
    its own climate, Level, and Goals.

### Epic: Collection (Location → Place → Space → Plant)
- *As a gardener, I want to organize plants by Location → Place → Space, so that my collection
  mirrors the real world.*
  - **AC:** a **Location** (city) contains the fixed **Places** Indoor/Outdoor/Greenhouse; each
    Place contains user-built **Spaces** (rooms/areas, predefined + custom "Other"); a Plant
    belongs to exactly one Space and can be **moved** between Spaces (and across Places/Locations)
    any time; create/rename/delete Spaces; changes sync across devices in real time. ("Garden" is
    the tab showing the active Location's contents, not a stored entity.)
- *As a gardener, I want a photo timeline per Plant, so that I can see growth over time.*
  - **AC:** add multiple timestamped photos; view as a chronological journal; add text journal
    entries; first photo becomes the Plant cover unless overridden.

### Epic: AI Identification
- *As a user, I want to photograph a plant and get its species, so that I know what I own.*
  - **AC:** capture or pick a photo → identification returns common + scientific name, a
    confidence score, a care-profile preview, and fun facts; one tap to "Add to my Garden"
    (creates a Plant + CarePlan); result is saved to identification history.
- *As a user, when the AI isn't sure, I want alternatives, so that I can pick the right one.*
  - **AC:** below a confidence threshold, show top-N ranked matches with photos + a "none of
    these / identify manually" path; never present a low-confidence guess as certain.

### Epic: Dr. Plant (Diagnostics)
- *As a worried owner, I want to photograph a sick leaf and get a diagnosis + treatment, so that
  I can save my plant.*
  - **AC:** returns diagnosis (disease/pest/deficiency), severity, and a step-by-step Treatment;
    user can start the Treatment, check off steps, log improvement photos, and see progress; app
    suggests preventive measures.

### Epic: Smart Care & Reminders
- *As a busy owner, I want timely reminders for each task, so that I don't forget or overwater.*
  - **AC:** CarePlan emits CareTasks (water/fertilize/mist/prune/repot/clean/rotate); reminders
    arrive via push at the user's preferred time; each task can be Done/Snoozed/Skipped;
    seasonal adjustment changes cadence; an advisory "rain expected — skip?" hint can appear for
    outdoor plants but never auto-skips.
- *As a consistent carer, I want a streak, so that I stay motivated.*
  - **AC:** completing due tasks maintains a streak; missing a day breaks it with a gentle,
    non-punitive message; streak visible on Today + Profile.

### Epic: Community
- *As a gardener, I want to post updates and milestones, so that I can share and get feedback.*
  - **AC:** create a Post (photos + caption, optional Species/Plant tag); others can like,
    comment, save; report/block available on every Post and user.
- *As a gardener, I want to follow people and DM, so that I can build relationships and trade tips.*
  - **AC:** follow/unfollow; a following-feed; 1:1 real-time DMs; messages and images pass
    moderation prefilter; block prevents all contact.
- *As a gardener, I want a swap board, so that I can give/receive cuttings.*
  - **AC:** create a non-commercial Swap Listing (no payment in v1); browse/filter; contact via
    DM; report listing.

### Epic: Encyclopedia
- *As a curious user, I want to browse/search species with filters, so that I can learn and plan
  purchases.*
  - **AC:** search + filter by indoor/outdoor, light, difficulty, pet-safe, air-purifying; each
    Species page shows the care guide, community photos/tips, and a wishlist bookmark.

### Epic: Profile, Settings, Monetization
- *As a user, I want granular notification + privacy controls, so that the app respects me.*
  - **AC:** toggle per category (care types, community, chat); manage camera/location/push
    permissions; dark mode; delete account + data.
- *As a power user, I want to upgrade to Evergreen+, so that I unlock unlimited plants and AI.*
  - **AC:** paywall via RevenueCat; entitlement reflected app-wide within seconds of purchase/
    restore; clear display of what's gated.

---

## 5. Feature Breakdown (priority · description · AC · edge cases)

Priority: **P0** = required for v1.0 launch · **P1** = v1.0 if time, else fast-follow ·
**P2** = deferred (v1.1+). Per ADR-0001, all three pillars are P0; only *non-core sub-features*
are P1/P2.

| Feature | Pri | Notes / key edge cases |
|---|---|---|
| Clerk auth (Google/Apple/email link) | P0 | Apple Sign-In **required** by App Store when other social logins exist. Edge: orphaned Clerk identity with no Convex user → provision lazily on first authed request. |
| Onboarding (per-Location: name/climate/level/goals/place/space/first-plant) | P0 | Edge: location permission denied → manual city entry; never block onboarding on it. Level/Goals stored per Location. |
| Locations (free 1 / Evergreen+ many) | P0 | Add from Profile re-runs per-Location onboarding; 2nd Location on free → paywall. Downgrade → extra Locations `locked` (read-only), never deleted. |
| Place/Space CRUD + Plant CRUD | P0 | Place = fixed Indoor/Outdoor/Greenhouse; Spaces user-built (predefined + custom "Other"), Indoor = rooms only. Move a Plant between Spaces/Places/Locations any time (re-evaluates CarePlan). Deleting a Space with Plants → prompt to move; deleting a Plant → soft-delete + "dead plant" offboarding (keep journal, mark as lost). |
| Plant photo timeline + journal | P0 | Edge: large/HEIC images → client-side resize before upload; offline capture → queue (see §10). |
| AI identification + history | P0 | Edge: low confidence → top-N fallback; non-plant photo → "no plant detected"; free-tier cap reached → paywall; identical re-upload → reuse cached result (cost). |
| Dr. Plant diagnosis + Treatment tracking | P0 | Edge: ambiguous/novel issue → LLM explanatory low-confidence response + "consult a human"; multiple issues in one photo → list, let user pick. |
| CarePlan generation + CareTasks | P0 | Edge: missing Species facts → AI-generate-and-cache before plan; sparse user data → conservative defaults. |
| Reminders (Convex cron + Expo push) | P0 | Edge: push permission denied → in-app Today list still authoritative + a one-time nudge to enable push; token rotation/expiry handling. |
| Seasonal adjustment + advisory weather | P0 | Open-Meteo; advisory only, **never auto-skip** (microclimate risk). Edge: no location → seasonal-only. |
| Streaks | P1 | Edge: timezone changes/travel must not falsely break streaks. |
| Community feed, like, comment, save | P0 | Cold-start: seed content / featured posts so the feed isn't empty (see §13). |
| Follows + following feed | P0 | Edge: blocked users excluded from all feeds. |
| Direct messages (real-time) | P0 | Moderation prefilter on text + images; block enforcement. |
| Swap/gift board (non-commercial) | P0 | Schema v2-ready for paid listings; report path required. |
| Community challenges | P1 | e.g. "grow a succulent from cutting this month"; needs minimal admin tooling. |
| Ratings (tips/posts/varieties) | P1 | Defer if it complicates moderation; not load-bearing for v1. |
| Encyclopedia browse/search/filter + wishlist | P0 | Backed by seeded + AI-cached Species; filters require structured Species attributes. |
| Moderation: report/block/mute + contact + AI prefilter + admin queue | P0 | **App Store gate** — see §6 pipeline. Non-negotiable because community ships v1. |
| RevenueCat subscription + entitlement sync | P0 | Edge: purchase succeeds but webhook lags → optimistic unlock + reconcile; restore purchases. |
| Profile, settings, notification prefs, dark mode | P0 | Account + data deletion required (privacy/store compliance). |
| **Light meter (camera-luminance estimate)** | **P2 (v1.1)** | iOS exposes no ambient-light API; lux is Android-only. v1.1 ships one cross-platform camera-luminance estimate labeled "approximate." |
| Local-notification mirror (offline reminders) | P2 (v1.1) | Hardening on top of server push; needs dedup. |
| i18n beyond English | P2 | Architect strings for it now; ship English only. |
| Paid marketplace | P2 (v2) | Swap Listing schema designed to extend; out of v1 scope entirely. |

---

## 6. Technical Architecture

### 6.1 Expo project structure (SDK 56, Expo Router)

```
src/app/
  _layout.tsx                 # Root: Clerk + Convex providers, theme, fonts
  (auth)/                     # Unauthenticated stack
    sign-in.tsx
    onboarding/               # multi-step onboarding stack
  (app)/                      # Authenticated; redirect to (auth) if no session
    _layout.tsx               # Tab navigator (5 tabs, camera center-FAB)
    today/                    # Tab 1: care tasks, streak, advisories
    garden/                   # Tab 2: active Location (switcher) → Place chips → Spaces → Plant detail
      plant/[plantId].tsx
      manage-spaces.tsx
    location-setup/           # Add a Location (2nd+): per-Location onboarding (gated)
    identify/                 # Camera FAB target (modal stack): Identify + Dr. Plant
    community/                # Tab 4: feed, post, profile, DMs, swap board, challenges
    profile/                  # Tab 5: stats, settings, paywall, notification prefs
  species/[speciesId].tsx     # Encyclopedia detail (reached via search + tags)
src/
  components/  hooks/  constants/  lib/        # lib/: convex client, ai clients, queue
convex/                       # Backend (functions + schema) — NEW
```

State: Convex's reactive hooks are the data layer (no Redux). Local-only UI state via React.
Local **write queue** (offline) in MMKV (see §10).

### 6.2 Clerk ↔ Convex auth flow

1. App wraps the tree in `ClerkProvider` + `ConvexProviderWithClerk`; Clerk issues a JWT with a
   Convex template.
2. Convex validates the JWT (`ctx.auth.getUserIdentity()`); every protected function asserts an
   identity and resolves it to a `users` row (provisioned lazily on first authed call).
3. Access control: ownership checks in functions (a user may only mutate their own Plants/
   Locations/Spaces/Plants/Posts); admin/moderator role on `users` gates the moderation queue.

### 6.3 AI integration pattern (per [ADR-0002](./docs/adr/0002-specialist-id-plus-llm-reasoning.md))

```
Client (camera) → upload photo → Convex file storage (storageId)
   → Convex action `identifyPlant(storageId)`
        ├─ check free-tier cap (reject → paywall)
        ├─ check identical-image cache (hash) → reuse if hit
        ├─ call Plant.id/Pl@ntNet  → species candidates + confidence
        ├─ ensure Species row (seeded? else Claude generate+cache, verified=ai)
        └─ persist `identifications` row → reactive UI update
   → on "Add to Garden": create Plant + Convex action `generateCarePlan(plantId)`
        └─ Claude(care reasoning: species facts + Location climate/level + Place/Space + pot) → CarePlan + CareTasks
Dr. Plant → action `diagnose(storageId, plantId)` → Plant.id health → Claude explanation → Treatment
```

AI calls live in **Convex actions** (Node runtime, can call external APIs); each external
vendor is isolated behind one action for swappability and independent failure handling. API keys
in Convex env vars, never on device.

### 6.4 Push notification flow

```
Device registers → expo-notifications getExpoPushToken → mutation storePushToken(userId, token, platform)
Convex cron (e.g. every 15 min) → query CareTasks due in window
   → respect user notification prefs + quiet hours + timezone
   → POST to Expo Push API (batched, ≤100/req) → handle receipts/errors (DeviceNotRegistered → prune token)
```

Server is the single source of truth so reminders can adapt to season/weather and survive
device changes. (Local-notification mirror deferred to v1.1, §5.)

### 6.5 RevenueCat entitlement sync

Purchase/restore happens in the app via RevenueCat SDK → RevenueCat webhook → Convex HTTP action
updates `users.entitlement`. App also reads RevenueCat `customerInfo` on launch for an
optimistic unlock; Convex entitlement is the authoritative gate for server-side limits
(e.g. ID cap). Reconcile on mismatch.

### 6.6 Moderation pipeline (App Store 1.2 compliance)

```
User uploads text/image (post, comment, DM, listing)
  → text profanity/abuse filter (lib) + image-moderation API (Hive or AWS Rekognition) in a Convex action
  → block/flag clearly violating content pre-publish; borderline → publish + flag to queue
Every Post/comment/DM/user/listing exposes Report + Block + Mute
  → reports create `reports` rows → admin/mod queue (Convex query, role-gated)
Published abuse contact in-app (settings) + store listing.
```

---

## 7. Convex Schema Draft

> Illustrative `convex/schema.ts`. `v` = Convex values; `Id<'table'>` are references.
> Indexes named for their lookup. Mirrors `CONTEXT.md` exactly.

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── People ───────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),                 // Clerk subject
    name: v.string(),
    handle: v.string(),                  // unique community handle
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    // NOTE: climate, gardeningLevel, and goals moved to `locations` (now per-Location).
    role: v.union(v.literal("user"), v.literal("moderator"), v.literal("admin")),
    entitlement: v.union(v.literal("free"), v.literal("plus")),  // synced from RevenueCat
    aiIdsThisPeriod: v.number(),         // free-tier cap counter
    aiIdsPeriodStart: v.number(),
    streakCount: v.number(),
    streakUpdatedAt: v.optional(v.number()),
    notificationPrefs: v.object({
      care: v.boolean(), community: v.boolean(), chat: v.boolean(),
      quietHours: v.optional(v.object({ start: v.number(), end: v.number() })),
    }),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_handle", ["handle"]),

  pushTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android")),
    lastSeenAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"]),

  // ── Collection: Location → Place → Space → Plant ─────────
  // A geographical place (city) with its own climate + per-Location personalization.
  // Free tier: exactly one row per user; Evergreen+: many (enforced server-side).
  locations: defineTable({
    userId: v.id("users"),
    name: v.string(),                    // "Home", "Holiday house", custom
    climate: v.object({                  // coarse by default (privacy); manual-city fallback
      label: v.string(), lat: v.number(), lon: v.number(),
    }),
    gardeningLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("expert")),
    goals: v.array(v.string()),          // keep-alive / grow / learn / share
    status: v.union(v.literal("active"), v.literal("locked")), // locked = over free cap after downgrade
    order: v.number(),
  }).index("by_user", ["userId"]),

  // A room/area within a Place. Place is a fixed enum carried on the Space (no separate table).
  spaces: defineTable({
    userId: v.id("users"),
    locationId: v.id("locations"),
    place: v.union(v.literal("indoor"), v.literal("outdoor"), v.literal("greenhouse")),
    name: v.string(),                    // "Living Room", "Balcony", "Terrace"… (predefined or custom)
    order: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_location", ["locationId"]),

  // Canonical archetype — encyclopedia source of truth (seeded OR ai-generated+cached)
  species: defineTable({
    scientificName: v.string(),
    commonNames: v.array(v.string()),
    family: v.optional(v.string()),
    origin: v.optional(v.string()),
    funFacts: v.optional(v.array(v.string())),
    careProfile: v.object({
      light: v.union(v.literal("direct"), v.literal("indirect"), v.literal("shade")),
      waterDays: v.number(),             // baseline cadence
      humidityRange: v.optional(v.object({ min: v.number(), max: v.number() })),
      tempRange: v.optional(v.object({ min: v.number(), max: v.number() })),
      petSafe: v.optional(v.boolean()),
      airPurifying: v.optional(v.boolean()),
      difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    }),
    source: v.union(v.literal("seed"), v.literal("ai")),  // provenance
    verified: v.boolean(),               // human/expert confirmed
    externalIds: v.optional(v.object({ plantId: v.optional(v.string()) })),
  })
    .index("by_scientificName", ["scientificName"])
    .searchIndex("search_names", { searchField: "scientificName" }),

  // User-owned instance — references a Species, adds per-instance reality
  plants: defineTable({
    userId: v.id("users"),
    spaceId: v.id("spaces"),                 // the room/area it sits in (movable any time)
    speciesId: v.optional(v.id("species")),  // optional: unidentified plants allowed
    nickname: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    potSizeCm: v.optional(v.number()),
    soilType: v.optional(v.string()),
    lastRepottedAt: v.optional(v.number()),
    tags: v.array(v.string()),               // indoor/outdoor/rare/gifted...
    status: v.union(v.literal("alive"), v.literal("archived"), v.literal("lost")),
  })
    .index("by_user", ["userId"])
    .index("by_space", ["spaceId"]),

  plantPhotos: defineTable({               // growth timeline + journal
    plantId: v.id("plants"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    note: v.optional(v.string()),
    takenAt: v.number(),
  }).index("by_plant", ["plantId"]),

  // ── Care ─────────────────────────────────────────────────
  carePlans: defineTable({                 // owned by one Plant; personalized schedule
    plantId: v.id("plants"),
    userId: v.id("users"),
    generatedFrom: v.object({ speciesId: v.optional(v.id("species")), locationId: v.id("locations"), climate: v.string(), place: v.string(), level: v.string() }),
    baseWaterDays: v.number(),
    fertilizeDays: v.optional(v.number()),
    mistDays: v.optional(v.number()),
    rotateDays: v.optional(v.number()),
    seasonalMultiplier: v.number(),        // adjusts cadence by season
    updatedAt: v.number(),
  }).index("by_plant", ["plantId"]).index("by_user", ["userId"]),

  careTasks: defineTable({                 // dated actionable unit emitted by a CarePlan
    carePlanId: v.id("carePlans"),
    plantId: v.id("plants"),
    userId: v.id("users"),
    type: v.union(
      v.literal("water"), v.literal("fertilize"), v.literal("mist"),
      v.literal("prune"), v.literal("repot"), v.literal("clean"), v.literal("rotate"),
    ),
    dueAt: v.number(),
    status: v.union(v.literal("due"), v.literal("done"), v.literal("snoozed"), v.literal("skipped")),
    completedAt: v.optional(v.number()),
    weatherAdvisoryDismissed: v.optional(v.boolean()),
  })
    .index("by_user_due", ["userId", "dueAt"])
    .index("by_plant", ["plantId"])
    .index("by_status_due", ["status", "dueAt"]),  // cron scan for due tasks

  // ── AI activities ────────────────────────────────────────
  identifications: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    imageHash: v.string(),                // dedup/cost cache
    candidates: v.array(v.object({
      speciesId: v.optional(v.id("species")),
      scientificName: v.string(), confidence: v.number(),
    })),
    chosenSpeciesId: v.optional(v.id("species")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_hash", ["imageHash"]),

  treatments: defineTable({               // ongoing remediation from Dr. Plant
    plantId: v.id("plants"),
    userId: v.id("users"),
    diagnosis: v.string(),
    issueType: v.union(v.literal("disease"), v.literal("pest"), v.literal("deficiency")),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    steps: v.array(v.object({ text: v.string(), done: v.boolean() })),
    status: v.union(v.literal("active"), v.literal("resolved"), v.literal("abandoned")),
    createdAt: v.number(),
  }).index("by_plant", ["plantId"]).index("by_user", ["userId"]),

  // ── Community ────────────────────────────────────────────
  posts: defineTable({
    userId: v.id("users"),
    caption: v.string(),
    photoStorageIds: v.array(v.id("_storage")),
    taggedSpeciesId: v.optional(v.id("species")),
    taggedPlantId: v.optional(v.id("plants")),
    likeCount: v.number(),
    moderation: v.union(v.literal("ok"), v.literal("flagged"), v.literal("removed")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  comments: defineTable({
    postId: v.id("posts"), userId: v.id("users"), text: v.string(),
    moderation: v.union(v.literal("ok"), v.literal("flagged"), v.literal("removed")),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),

  follows: defineTable({ followerId: v.id("users"), followeeId: v.id("users") })
    .index("by_follower", ["followerId"]).index("by_followee", ["followeeId"]),

  saves: defineTable({ userId: v.id("users"), postId: v.id("posts") })
    .index("by_user", ["userId"]),

  messages: defineTable({                 // real-time DMs
    conversationId: v.string(),           // deterministic from sorted user pair
    senderId: v.id("users"), recipientId: v.id("users"),
    text: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    moderation: v.union(v.literal("ok"), v.literal("flagged"), v.literal("removed")),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_recipient", ["recipientId"]),

  blocks: defineTable({ blockerId: v.id("users"), blockedId: v.id("users") })
    .index("by_blocker", ["blockerId"]),

  // Non-commercial in v1; price/payment fields intentionally absent → added in v2 (designed-for)
  swapListings: defineTable({
    userId: v.id("users"),
    title: v.string(), description: v.string(),
    photoStorageIds: v.array(v.id("_storage")),
    speciesId: v.optional(v.id("species")),
    status: v.union(v.literal("open"), v.literal("claimed"), v.literal("closed")),
    moderation: v.union(v.literal("ok"), v.literal("flagged"), v.literal("removed")),
    createdAt: v.number(),
    // v2: priceCents?, currency?, fulfillment? — extend without restructuring
  }).index("by_status", ["status"]).index("by_user", ["userId"]),

  challenges: defineTable({               // community challenges (P1)
    title: v.string(), description: v.string(),
    startsAt: v.number(), endsAt: v.number(),
  }).index("by_endsAt", ["endsAt"]),

  // ── Cross-cutting ────────────────────────────────────────
  notifications: defineTable({            // in-app notification center
    userId: v.id("users"),
    kind: v.union(v.literal("care"), v.literal("community"), v.literal("chat"), v.literal("system")),
    title: v.string(), body: v.string(),
    entityRef: v.optional(v.string()),    // deep-link target
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  reports: defineTable({                  // moderation queue
    reporterId: v.id("users"),
    targetType: v.union(v.literal("post"), v.literal("comment"), v.literal("message"), v.literal("user"), v.literal("listing")),
    targetId: v.string(),
    reason: v.string(),
    status: v.union(v.literal("open"), v.literal("actioned"), v.literal("dismissed")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  wishlist: defineTable({ userId: v.id("users"), speciesId: v.id("species") })
    .index("by_user", ["userId"]),
});
```

**Relationship notes.** Collection hierarchy: `locations` → `spaces` (N:1, `place` enum on the
Space) → `plants` (N:1 via `spaceId`). Climate, `gardeningLevel`, and `goals` live on
`locations` (per-Location), *not* on `users`. **Free tier = 1 active `locations` row per user**,
enforced server-side; on downgrade, rows beyond the cap flip to `status:"locked"` (read-only,
never deleted). `plants.speciesId` → shared `species` (hybrid model: facts shared, care
personalized via `carePlans`); `carePlans` 1:1 a `plants` and pulls climate/level from the
plant's Location; `careTasks` N:1 `carePlans`. `identifications.imageHash` dedups paid vision
calls. `swapListings` omits money fields *by design* so v2 can extend it. The `by_status_due`
index on `careTasks` powers the reminder cron.

---

## 8. AI Integration Strategy

**Vendor split (ADR-0002).** Specialist plant-ID API (Plant.id or Pl@ntNet) for identification
*and* disease/pest health assessment; **Claude** for all reasoning/generation. Two cost lines,
each isolated behind a Convex action.

**Prompt/orchestration approach:**

- **Identification** — send the image to the ID API; map candidates to `species` rows by
  scientific name. If the top species isn't in `species`, call Claude with a *structured* prompt
  (JSON schema for `careProfile` + facts), store it `source:"ai", verified:false`. Always show
  confidence; below threshold (e.g. < 0.6) surface top-N + manual path.
- **Care-plan generation** — Claude prompt = Species `careProfile` + the plant's **Location**
  climate (Open-Meteo zone) and gardening Level + **Place/Space** + pot/soil → returns cadences
  (water/fertilize/mist/rotate) + a seasonal multiplier, constrained to a strict JSON schema;
  validate before persisting.
- **Diagnosis** — ID-API health endpoint for detection; Claude turns the raw detection into a
  human-readable diagnosis, severity, and ordered Treatment steps. Unknown/low-confidence →
  explanatory response + "consult a human/local extension service" nudge; never fabricate
  certainty.
- **Species-gap generation & fun facts** — Claude, cached into `species`. Expert users can flag
  errors → `verified` workflow.

**Low-confidence handling (cross-cutting rule):** confidence is always shown; below threshold the
UI shifts from "this is X" to "best guesses" with alternatives and a manual override. Wrong-but-
confident is the cardinal sin (kills trust + the wedge).

**Cost control:**
- The **freemium ID cap** is the primary cost governor (free users get N IDs/period; counter in
  `users`).
- **Image-hash dedup** (`identifications.by_hash`) avoids re-paying for identical re-uploads.
- **Cache Species** so a given species is generated once globally, not per user.
- Client-side image **resize/compress** before upload (smaller payloads, faster, cheaper).
- Track `cost per active user` as a guardrail metric (§14); alert if it approaches ARPU.

---

## 9. Navigation & Screen Map

**Tab bar (5 tabs, camera center-FAB):**

```
[ Today ]  [ Garden ]  ( 📷 )  [ Community ]  [ Profile ]
```

- **Today (tab 1):** due CareTasks list, streak, weather advisories, quick "mark done/snooze".
  → Task detail modal.
- **Garden (tab 2):** shows the **active Location** (header **Location switcher** "Home ▾" — free
  users have one; Evergreen+ many). **Place** filter chips (All/Indoor/Outdoor/Greenhouse); plants
  **grouped by Space** → **Plant detail** (timeline, journal, care profile, CarePlan, Treatments)
  → add-photo modal. "Manage Spaces" + "+ Add location" (gated). Search entry → Encyclopedia.
- **Camera FAB (center):** modal stack → **Identify** flow and **Dr. Plant** flow (segmented at
  capture), → result screen → "Add to Garden" / "Start Treatment".
- **Community (tab 4):** feed → post detail (comments) → create-post modal; user profile →
  follow/DM; **DMs** list → conversation; **Swap board**; **Challenges**. Report/block sheets
  everywhere.
- **Profile (tab 5):** My Garden stats (plants, streak, tasks done), activity/AI-usage history,
  settings (notification prefs, permissions, dark mode, language, account/data deletion),
  **Evergreen+ paywall**.
- **Encyclopedia:** `species/[id]` detail (care guide, community photos/tips, wishlist) reached
  from Garden search, post/plant tags, and identification results — not its own tab.
- **Auth/Onboarding:** pre-tab stack (sign-in → onboarding steps).

---

## 10. Non-Functional Requirements

- **Performance:** cold start < 3s on mid-tier devices; feed + Plant grid use virtualized lists
  (FlashList) with paginated Convex queries; images served as resized thumbnails, full-res lazy.
  60fps interactions (Reanimated). TTI for camera < 1s after FAB tap.
- **Offline (graceful degradation — chosen scope):** Convex's reactive cache renders
  recently-viewed Locations/Plants briefly offline. A **local write queue (MMKV)** captures photo
  uploads, journal entries, and "mark task done" while offline, flushed on reconnect, with a
  visible **"pending sync"** state. No promise of full offline editing (Convex has no built-in
  offline-write engine; a local-first DB is explicitly out of scope for v1).
- **Accessibility:** WCAG AA contrast (verify the green palette), full screen-reader labels,
  dynamic type support, min 44pt touch targets, no color-only status (pair with icon/text),
  reduced-motion honoring.
- **Privacy & permissions:** camera (identification/diagnosis), photo library (uploads),
  location (climate — coarse by default, with a clear rationale prompt and a manual-city
  fallback), push (reminders). Each requested *in context* with a pre-permission explainer.
  Plant photos and user content stored in Convex file storage; clear retention + account/data
  deletion. Moderation processing of images disclosed in the privacy policy.
- **Reliability:** AI vendor outage → degrade gracefully (queue/retry, never hard-crash the
  capture flow). Push send failures pruned via Expo receipts.

---

## 11. Monetization Strategy

**Model: freemium subscription with an AI-ID cap** (RevenueCat). Recurring revenue matches the
recurring AI cost; the cap bounds free-user vision spend.

| | **Free** | **Evergreen+** (~$7.99/mo · $39.99/yr · 7-day trial) |
|---|---|---|
| Locations (homes) | 1 | unlimited |
| Plants | up to 5 | unlimited |
| AI identifications | ~3 / month | unlimited |
| Dr. Plant diagnostics | preview / 1 trial | unlimited |
| Care plans | basic | advanced (weather-aware, multi-task) |
| Light meter (v1.1) | — | included |
| Community | read + react | full posting, DMs, swap, challenges |
| Reminders | yes | yes |

**Why subscription over alternatives:** care + community create *recurring* engagement and
*recurring* cost, so recurring revenue aligns; it mirrors Planta's proven model. **One-time
purchase** under-monetizes ongoing AI cost. **Credits/pay-per-AI** put friction at the exact
magic moment (scanning), suppressing the activation habit — kept only as a possible secondary
top-up, not the primary model.

**Implementation:** RevenueCat SDK in-app + webhook → Convex `users.entitlement`; server-side
limits enforced against the authoritative entitlement; "restore purchases" + cross-platform
entitlement supported.

---

## 12. MVP Scope (v1.0 vs later)

Per ADR-0001 all three pillars are in v1.0. The cut lines are *within* features:

| Area | **v1.0** | **v1.1** | **v2.0** |
|---|---|---|---|
| Auth/onboarding | full | — | — |
| Garden/Plant/timeline | full | — | — |
| AI identification | full (cap'd free) | — | — |
| Dr. Plant | full | refinements | — |
| Care + reminders | server push, seasonal + advisory weather | local-notif mirror | — |
| Streaks | basic | richer gamification | — |
| Community feed/follow/DM/swap | full | ratings polish | — |
| Challenges / ratings | P1 (basic or fast-follow) | full | — |
| Encyclopedia | seeded + AI-fill, search/filter | expert verification tooling | — |
| Moderation | baseline + AI prefilter + queue | better tooling | — |
| Monetization | RevenueCat freemium | — | — |
| **Light meter** | — | camera-luminance estimate | true split sensors (maybe) |
| Smart watering | seasonal + advisory | — | per-plant rain-exposure model |
| **Marketplace** | — | — | paid swap listings |
| i18n | English; strings externalized | — | additional languages |

---

## 13. Open Questions (need a decision before/early in build)

1. **Species dataset vendor** for seeding — Perenual vs GBIF vs Pl@ntNet dataset (cost, license/
   ToS, houseplant-cultivar coverage). *Recommendation:* start with a small curated seed of the
   ~200 most common houseplants + AI-fill, evaluate a paid dataset once usage shows demand.
2. **Identification API** — Plant.id vs Pl@ntNet (accuracy on cultivars, health-assessment
   coverage, pricing per call, ToS for caching results). *Lean:* Plant.id (health endpoint +
   strong houseplant accuracy), pending pricing.
3. **Image-moderation vendor** — Hive vs AWS Rekognition (NSFW/violence coverage, cost, latency).
4. **Trademark / store name** availability for "Evergreen" (and fallback name).
5. **Location granularity** — GPS coordinates vs manual city/postal. *Recommendation:* default to
   coarse (city-level) for privacy; only use precise if the user opts in for outdoor weather.
6. **Community cold-start plan** — seed accounts/featured content, a launch ambassador program,
   or invite waves? Needed because the feed is empty at launch (ADR-0001).
7. **Challenges/ratings** — confirm P1 vs fast-follow given moderation load.
8. **i18n timing** — confirm English-only v1 with externalized strings.

---

## 14. Success Metrics (KPIs by area)

- **Activation (onboarding/AI):** % of new users who complete onboarding; % who do a first
  identification within 24h; % who add a first Plant. *North-star activation:* first Plant added
  + first CareTask completed.
- **Retention (care):** D1/D7/D30 retention; **CareTask completion rate**; median streak length;
  % of plants still "alive" at 30/90 days (the core promise).
- **AI quality & cost:** identification confidence distribution; **user correction rate** (chose
  a different candidate / re-identified) as a proxy for accuracy; Dr. Plant Treatment
  start→resolved rate; **AI cost per active user** (guardrail vs ARPU).
- **Community:** % of MAU who post (creator ratio); posts + comments per active user; DM
  conversations started; **reports per 1k posts** + median moderation response time (safety
  health); follow graph density.
- **Monetization:** free→trial start rate; **trial→paid conversion**; MRR; churn; ARPU; % of AI
  cost covered by subscription revenue.
- **Cold-start health (launch-specific):** concurrent active users vs the threshold where the
  feed feels alive; time-to-first-comment-received for a new poster.
```
