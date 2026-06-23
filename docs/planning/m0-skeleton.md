# M0 — Walking Skeleton

> **Milestone goal:** a signed-in user opens the app, sees the 5-tab shell with the camera
> center-FAB, and one screen reads + writes Convex in real time. `pnpm test` is green. This
> proves the Clerk ↔ Convex ↔ Expo wiring end-to-end before any feature is built.
>
> Parent: [`ROADMAP.md`](./ROADMAP.md). Conventions: tasks are commit-sized, each has a
> **Done when** line; *(test-first)* tasks write the failing test before the implementation.
> Build against the [Expo v56.0.0 docs](https://docs.expo.dev/versions/v56.0.0/) per `AGENTS.md`.

**Milestone Done when:** sign in → land on the tab shell (Garden by default; the care-state
router that may land on Today is added in M3) → a value written from one screen appears
reactively on another (proving Convex) → `pnpm test`, `lint`, `typecheck` all pass.

---

## Story: Vendor accounts & keys (start first — some have lead time)

> Checklist, not code. Apple Small Business Program enrollment and Plant.id pricing tier can
> take days; kick these off now so they don't block M2/M7.

- [ ] Create **Convex** project; capture deployment URL + admin key.
  - **Done when:** `npx convex dev` connects to the project.
- [ ] Create **Clerk** application; enable Google, Apple, and email magic-link; create a JWT
      template named for Convex.
  - **Done when:** Clerk publishable key + JWT issuer URL recorded.
- [ ] Register **Plant.id** account (identification + health) and note pricing tier.
  - **Done when:** API key obtained, stored for M2.
- [ ] Create **RevenueCat** account + project; create the `plus` entitlement placeholder.
  - **Done when:** RevenueCat API keys recorded for M7.
- [ ] Pick + register an **image-moderation** vendor (Hive or AWS Rekognition).
  - **Done when:** credentials recorded for M6.
- [ ] Configure **EAS** + produce a first **dev build** (native modules need it; Expo Go won't do).
  - **Done when:** dev build installs on a device/simulator and boots the app.
- [ ] Store all server-side keys in **Convex env vars** (never on device).
  - **Done when:** `npx convex env list` shows the keys; nothing secret is in the client bundle.

## Story: Convex wiring

- [ ] Initialize Convex in the repo (`npx convex dev`) and commit the `convex/` directory.
  - **Done when:** `convex/` exists with a working `schema.ts` stub and `convex dev` runs clean.
- [ ] Define a minimal `users` table (clerkId, name, handle, entitlement default `"free"`,
      timestamps) in `convex/schema.ts`. *(test-first)*
  - **Done when:** `convex-test` asserts the schema validates a sample user row.
- [ ] Write `getOrCreateUser` mutation that resolves the Clerk identity
      (`ctx.auth.getUserIdentity()`) to a `users` row, provisioning lazily. *(test-first)*
  - **Done when:** `convex-test` proves: no identity → throws; new identity → inserts; existing
    identity → returns same row (idempotent).
- [ ] Add a trivial `ping` query returning server time / a stored value.
  - **Done when:** the app renders the value via `useQuery`, confirming live Convex reads.

## Story: Clerk auth wiring

- [ ] Install Clerk Expo SDK; wrap the root in `ClerkProvider` + `ConvexProviderWithClerk` in
      `src/app/_layout.tsx`; load publishable key + Convex URL from env.
  - **Done when:** app boots with both providers, no auth errors in console.
- [ ] Create the `(auth)` route group with a sign-in screen offering Google, Apple, and email
      magic-link.
  - **Done when:** each method completes a sign-in against the Clerk dev instance on a device.
- [ ] Split routing into `(auth)` vs `(app)` groups; redirect unauthenticated users to sign-in
      and authenticated users into `(app)`.
  - **Done when:** signed-out users can't reach tabs; signed-in users skip sign-in on relaunch.
- [ ] Call `getOrCreateUser` on first authenticated load.
  - **Done when:** signing in with a fresh Clerk user creates exactly one `users` row.

## Story: Design-system foundation

- [ ] Define theme tokens in `src/constants/theme.ts` — forest-green/cream palette (per PRD §2),
      radii (16–20), spacing, type scale — with light + dark variants.
  - **Done when:** tokens consumed via the existing `use-theme` hook; dark mode flips correctly.
- [ ] Build base components: `Screen` (safe-area wrapper), `Button`, `Card`, `Text` (themed).
  - **Done when:** a sample screen composes them; they respect light/dark; basic a11y labels present.

## Story: Navigation shell

- [ ] Replace boilerplate tabs with the 5-tab navigator: **Today · Garden · [FAB] · Community ·
      Profile** in `src/app/(app)/_layout.tsx`.
  - **Done when:** five tabs render with icons + labels and switch correctly.
- [ ] Add the camera **center-FAB** that opens a modal route (placeholder Identify/Dr.Plant screen).
  - **Done when:** tapping the FAB presents the modal; dismiss returns to the prior tab.
- [ ] Add empty placeholder screens for each tab (title + "coming soon").
  - **Done when:** every tab navigates to its placeholder without error.

## Story: Test / lint / typecheck tooling

- [ ] Add **Jest** + **`convex-test`** + **React Native Testing Library**; configure for SDK 56 /
      React 19.
  - **Done when:** `pnpm test` runs the suite.
- [ ] Write one `convex-test` (covers `getOrCreateUser`) and one RNTL smoke test (a base
      component renders).
  - **Done when:** both pass.
- [ ] Wire `pnpm test`, `pnpm lint` (expo lint), `pnpm typecheck` (tsc --noEmit) scripts.
  - **Done when:** all three pass on a clean tree; ready to gate future PRs.
