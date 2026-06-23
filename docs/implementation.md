# Evergreen — Implementation Status

**Updated:** 2026-06-09 · Companion to [`prd.md`](./prd.md), [`design/screen-flow.md`](./design/screen-flow.md)
(v4), [`design/components.md`](./design/components.md) (v2), and the design handoff in
[`design/evergreen-mobile-app-design/`](./design/evergreen-mobile-app-design/).

> Tracks **what's built, how, and what remains**, phase by phase. The build follows the approved
> plan: **docs → foundations → UI on mock data → backend (Convex+Clerk) → conditional nav/gating.**

## Status at a glance

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Docs reconciliation (Evergreen rename, screen-flow v4, components v2) | ✅ Done |
| 1 | App foundations (tokens, neumorphic substrate, icons, nav shell, data seam) | ✅ Done |
| 2 | UI for all 29 screens on mock data | ✅ Done (minor polish deferred) |
| 3 | Convex + Clerk integration (swap the data seam) | ✅ Done — verified end-to-end on web (sign-in → provision → seed → real reactive data). Native needs a dev build (Expo Go can't run `@clerk/expo` v3). |
| 4 | Conditional navigation, permissions, entitlement gating | 🟡 Started — minimal splash auth gate landed (login when no session; care-state route when signed in) |

**Validated:** `tsc --noEmit` clean (only pre-existing CSS-module type warnings); `expo export
--platform ios` produces a Hermes bundle. App runs on **mock data** end-to-end: `pnpm start` → `i`.

---

## Stack & conventions

- **Expo SDK 56** · React 19 · RN 0.85 · Expo Router (New Architecture). Build against the
  [v56 docs](https://docs.expo.dev/versions/v56.0.0/) per `AGENTS.md`.
- **Styling:** plain `StyleSheet` + a tokens module (no NativeWind). Pixel-faithful **neumorphic**
  look via `react-native-shadow-2`.
- **Icons:** `react-native-svg` registry (handoff SVGs ported). **Images:** `expo-image` +
  `expo-linear-gradient` placeholder covers. **Animation:** `react-native-reanimated`.
- **Component contract** (per `components.md`): `type XProps = {…}`, no `React.FC`, named exports,
  variants/sizes as enums, no style props in the public API.
- **Added deps:** `react-native-svg`, `react-native-shadow-2`, `@shopify/flash-list`,
  `@gorhom/bottom-sheet`, `expo-linear-gradient`, `@expo-google-fonts/inter`,
  `@expo-google-fonts/jetbrains-mono`.

### Environment notes (gotchas)
- **pnpm build-scripts gate:** this environment hard-blocks build scripts. Worked around with a
  project `.npmrc` (`ignore-scripts=true`) + `pnpm-workspace.yaml`/`package.json` acknowledging
  `msgpackr-extract`. In a normal environment, drop `ignore-scripts=true` and run `pnpm approve-builds`.
- **General Sans** (display font) isn't on npm (Fontshare). It currently **falls back to Inter**;
  drop `GeneralSans-*.ttf` into `assets/fonts/` and flip `GENERAL_SANS_BUNDLED` in
  `src/constants/fonts.ts` to activate.

---

## Phase 0 — Docs reconciliation ✅

- **Brand rename** `LeafLog → Evergreen` (+ `Evergreen+`) across `prd.md`, `CONTEXT.md`,
  `screen-flow.md`, `components.md`, `ROADMAP.md`, `m0/m1`; rewrote PRD §2 to the real neumorphic
  palette/fonts. (`--ever-*` token names kept.)
- **`screen-flow.md` → v4:** every one of the 29 handoff screens mapped to a route (with
  `← evergreen-*.html` source column); added onboarding 6 steps, messages, report, settings/legal
  sub-stack. Reconciled Plant detail to the handoff: **4 tabs** (Care/About/Timeline/Journal),
  inline care rows, **no sticky bar**.
- **`components.md` → v2:** added Tier 0 (`NeuSurface`/`NeuPressable`), re-specced `Icon` over
  `react-native-svg`, added Tier 4 handoff-revealed components; ~78 component contracts.

---

## Phase 1 — Foundations ✅

| Area | Files | Notes |
|------|-------|-------|
| Design tokens | `src/constants/tokens.ts` | palette, neumorphic shadow presets, radii, spacing, type scale, motion, confidence bands, cover gradients |
| Fonts | `src/constants/fonts.ts` | Inter + JetBrains Mono via expo-font; `fontFamily()` resolver; General Sans fallback |
| Neumorphic substrate | `src/components/neu-surface.tsx` | `NeuSurface` (stacked dual-shadow), `NeuPressable` (animated raised→pressed); accepts numeric radii |
| Icons | `src/components/icon.tsx`, `src/components/icons/registry.tsx` | `Icon` + ~32 ported stroke icons; `IconName` = registry keys |
| Data seam | `src/data/{types,fixtures,hooks,index}.ts` | source-agnostic hooks over mock fixtures; **`useHasActionableToday`** encodes the care-state landing rule; models the locked 2nd location |
| Nav shell | `src/app/_layout.tsx`, `src/app/(auth)/_layout.tsx`, `src/app/(app)/_layout.tsx`, `src/components/tab-bar.tsx` | root providers (GestureHandler + SafeArea + BottomSheet + fonts), `(auth)`/`(app)` groups, **custom neumorphic tab bar + center camera FAB** |
| Entry | `src/app/index.tsx` | splash bloom → care-state redirect (Today vs Garden) |

**How the data seam works (the key architectural decision):** every screen imports hooks from
`@/data` only — never a data source. Phase 1–2 hook bodies return fixtures; **Phase 3 rewrites the
bodies to Convex** `useQuery`/`useMutation` with zero screen changes. Return shapes already match
Convex (`data | undefined`).

---

## Phase 2 — UI on mock data ✅

All **29 screens** built, navigable end-to-end, pixel-faithful where it counts (reference slice
matched to the HTML CSS; secondary screens pattern-faithful).

### Screens (`src/app/`)
- **Auth/onboarding:** `index` (splash), `(auth)/login`, `(auth)/onboarding/index` (6-step wizard:
  name·climate·level·goals·place+space·first-plant), `(auth)/welcome`.
- **Tabs:** `(app)/today`, `(app)/garden`, `(app)/community`, `(app)/profile` + custom tab bar & FAB.
- **Capture:** `(app)/capture` — viewfinder + mode segment + shutter → confidence-gated result
  sheet (high match + Add to Garden; low → candidates + escape hatches).
- **Plant:** `(app)/plant/[plantId]` — carousel hero, 4 tabs, treatment banner, inline care rows.
- **Social/alerts:** `(app)/messages`, `(app)/notifications`, `(app)/report`.
- **Profile sub-screens:** `(app)/profile/{locations,memorial,wishlist,identification-history}`.
- **Settings/legal:** `(app)/profile/settings/{index,account,permissions,about,terms,privacy,
  acknowledgements,rate,blocked}`.

### Components built (~31, `src/components/`)
- **Tier 0:** NeuSurface, NeuPressable.
- **Tier 1 (`ui/`):** AppText, Button, IconButton, Badge, Chip, Card, Avatar, Pill,
  SegmentedControl, TopTabs, AppHeader, ScreenHeader, ProgressRing, PhotoCarousel, TextField,
  NavRow, ScrollProgressBar, Icon.
- **Tier 2/4 (`domain/`):** CareTaskRow, TaskGroupSection, StreakBadge, WeatherAdvisoryBanner,
  PlantCard, LocationSwitcher, TreatmentBanner, ConfidencePill, ConfidenceMeter, CandidateRow,
  StepScaffold, LoopRow, BrandMark, NotificationRow, SwapListingCard, ChallengeCard, LegalReader,
  DataGlanceCard, PermissionRow, StarRating, BlockedRow, ReportForm, OAuthButton, CityClimateSearch.

### How key flows behave on mock data
- **Care-state landing:** `index.tsx` reads `useHasActionableToday()` → Today (overdue/due-today
  exists) else Garden.
- **Garden:** `LocationSwitcher` (locked 2nd location shows the gate), Place chips filter, plants
  grouped by Space via `usePlantsBySpace`.
- **Capture:** local `phase` state simulates camera → result; "Not this?" toggles low-confidence.
- **Task completion:** optimistic local `Set` via `useCareTaskActions` (no persistence yet).

### Deferred polish (non-blocking, fast-follow)
- `@gorhom/bottom-sheet` provider is mounted but sheets render as plain views — **`PlantSetupSheet`**
  (nickname·Place·Space) and the FAB chooser should become real sheets.
- A few cataloged components remain inlined rather than standalone where extraction added little.
- General Sans TTF not bundled; pixel pass on Community/Notifications still light.

---

## Phase 3 — Convex + Clerk integration 🟡 (scaffolded)

**Goal:** replace mock fixtures with a live backend, behind the unchanged `src/data` hook API.
**Approach:** scaffold-only (all code written here) + **focused slice** (functions only for the
hooks screens consume) + **email-code (OTP)** auth + **seed from fixtures**. Cloud provisioning and
end-to-end verification are the user's steps — see [`PHASE3-SETUP.md`](./PHASE3-SETUP.md).

**Written:**
1. `convex/schema.ts` — full schema per `prd.md` §7 (all ~20 tables; `users` gains optional
   `bestStreak`/`tasksDoneTotal` to back the profile stats).
2. `convex/` functions (focused slice): `users` (getCurrentUser, ensureUser), `locations`,
   `spaces`, `plants` (list/plantsBySpace/plantDetail), `careTasks` (todayTasks/hasActionableToday
   + complete/snooze/skip), `community` (feed). Each returns **view-model shapes** (`src/data/types`)
   via `convex/lib/mappers.ts`; `convex/lib/auth.ts` does identity + lazy `users` provisioning;
   `convex/lib/care.ts` derives water-task status. `convex/seed.ts` ports the fixtures.
3. Root providers (`src/app/_layout.tsx`): `ClerkProvider` (token cache) + `ConvexProviderWithClerk`
   + an `EnsureUser` component that calls `users.ensureUser` once on auth. Client in `src/lib/convex.ts`.
4. **Hook bodies swapped** in `src/data/hooks.ts` → `useQuery`/`useMutation` (signatures unchanged;
   `usePlantsBySpace`/`activeLocation`/`hasActionableToday` now server-side; `useCareTaskActions`
   derives `completed` from task status).
5. Email-OTP sign-in in `src/app/(auth)/login.tsx` using `@clerk/expo` v3's Future API
   (`signIn.emailCode.sendCode/verifyCode` + `finalize`).
6. Config: `package.json` (+`convex`,`@clerk/expo`, pnpm peer override for expo 56), `app.json`
   (+`expo-secure-store`,`@clerk/expo` plugins), `.env.example`, `.gitignore` (`.env`), `tsconfig`
   (`@/convex/*` alias; excludes `convex/` from app typecheck), `convex/tsconfig.json`.

**Deferred to later phases (still mock):** AI, push, RevenueCat sync, weather, image uploads,
DMs/swaps/encyclopedia/moderation, like/follow writes, onboarding writes, route gating (Phase 4).

**Done when:** a signed-in user's seeded plants/tasks render through the same screens (verify via
`PHASE3-SETUP.md`); the fixtures→Convex swap touched only `src/data/*` + `convex/*`.

---

## Phase 4 — Conditional navigation & gating ⬜

1. **Auth gate** in `index.tsx`: no Clerk session → `(auth)/login`; session → care-state router.
2. **Onboarding gate:** new users (no location) → onboarding; returning → app.
3. **Permissions:** real OS prompts via `PermissionPrimer` (camera/location/push) with graceful
   fallbacks.
4. **Entitlement gating:** `PaywallSheet` at the caps (2nd Location, 6th plant, 3 IDs/mo, Dr.
   Plant, posting); enforced server-side in Convex.

---

## How to run
```bash
pnpm install            # (ignore-scripts is set; see Environment notes)
pnpm start              # then press i (iOS) / a (Android) — Expo Go works
pnpm exec tsc --noEmit  # typecheck
```

## File map (high-signal)
```
src/
  app/            # Expo Router routes (index splash, (auth)/*, (app)/*)
  components/
    neu-surface.tsx · icon.tsx · tab-bar.tsx · icons/registry.tsx
    ui/           # Tier 1 primitives
    domain/       # Tier 2/4 feature components
  constants/      # tokens.ts · fonts.ts · theme.ts (legacy)
  data/           # types · fixtures · hooks (the swap seam) · index
docs/
  prd.md · implementation.md · CONTEXT.md (root)
  design/         # screen-flow.md · components.md · evergreen-mobile-app-design/ (handoff)
  planning/       # ROADMAP.md · m0/m1
```
