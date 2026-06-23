# Phase 3 — Convex + Clerk setup runbook

All Phase-3 **code** is scaffolded (Convex backend in `convex/`, providers + hook swap + email-OTP
login in `src/`). What's left needs your cloud accounts + secret keys. Follow these steps in order.

> Note: the app won't typecheck or run until step 3 finishes — `@clerk/expo` / `convex` aren't
> installed yet and `convex/_generated/*` (the `api` object) is created by `npx convex dev`.

## 1. Install the new dependencies

```bash
npx expo install expo-secure-store      # Clerk token cache (picks the SDK-56 version)
pnpm add convex @clerk/expo             # already listed in package.json; this fetches them
pnpm install
```

- pnpm 11 reads these settings from **`pnpm-workspace.yaml`** (not `package.json`):
  - **Peer range:** `peerDependencyRules.allowedVersions.expo: '56'` lets Clerk accept SDK 56.
  - **Build-scripts gate (`ERR_PNPM_IGNORED_BUILDS`):** the new packages (`esbuild`, `bufferutil`,
    `utf-8-validate`, `core-js`, `browser-tabs-lock`) are listed under `ignoredBuiltDependencies`,
    so install no longer errors. (esbuild still works for the Convex CLI — it loads its platform
    binary from its optional dependency, no build step needed.)

## 2. Create the Clerk app

The app uses a **passwordless email-code** custom flow. Configure the instance to match (all
verified working):

1. Clerk dashboard → create an application.
2. **Configure → Email, Phone, Username**: identifier = **Email address**.
3. **Authentication strategies**: turn **Email verification code** ON, and turn **Password** **OFF**
   (required — with Password on, sign-up can't complete via code alone).
4. **Configure → Attack Protection**: turn **Bot sign-up protection (Smart CAPTCHA)** **OFF**
   (a headless custom flow has no CAPTCHA widget, so it blocks sign-up otherwise).
5. **JWT Templates → New template → pick the built-in "Convex" preset** (do NOT create a blank
   template — the preset sets the `aud: "convex"` claim that Convex validates). It auto-names it
   `convex`. Save. Copy its **Issuer** (your Clerk Frontend API URL, like `https://xxx.clerk.accounts.dev`).
6. **API Keys** → copy the **Publishable key**.

> Verify the template later with: on web, `await window.Clerk.session.getToken({template:'convex'})`
> decoded should have `aud: "convex"`. If `aud` is missing, you created a blank template — recreate
> it from the Convex preset.

## 3. Create the Convex deployment

```bash

```

This logs you in, creates a dev deployment, writes `CONVEX_URL`/`CONVEX_DEPLOYMENT` into
`.env.local`, generates `convex/_generated/*`, and keeps a watcher running (leave it open).

Then set the Clerk issuer on the deployment. **Easiest — via CLI** (run in another terminal):

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://YOUR-SUBDOMAIN.clerk.accounts.dev
npx convex env list      # verify
```

The value is your Clerk **Frontend API URL / Issuer** — Clerk dashboard → **Configure → API Keys**
("Frontend API URL"), or the **JWT Templates → convex** template's **Issuer** field. No trailing slash.

_(Dashboard alternative: [dashboard.convex.dev](https://dashboard.convex.dev) → your project → open
the `dev:…` **deployment** → ⚙️ **Settings** → **Environment Variables**. The Settings link only
shows once you're inside a deployment, not at the project-list level.)_

## 4. Fill `.env`

```bash
cp .env.example .env
```

Set:

- `EXPO_PUBLIC_CONVEX_URL` = the `CONVEX_URL` value from `.env.local`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` = the Clerk publishable key from step 2.4

## 5. Run the app (on a simulator/device — not web, for auth)

```bash
npx expo start    # press i (iOS) or a (Android)
```

Sign in: type your email → **Continue with email** → enter the 6-digit code → you land on Garden.
(For a no-inbox test, use a Clerk test email like `you+clerk_test@example.com` with code `424242`.)
Confirm: a user appears in the Clerk dashboard, and a `users` row appears in Convex (created by
`users.ensureUser` right after sign-in).

## 6. Seed the demo data

```bash
npx convex run seed:seedDevUser
# or, if you have multiple users: npx convex run seed:seedDevUser '{"clerkId":"user_..."}'
```

Re-running is safe (it wipes and re-inserts your owned rows).

## 7. Verify

- **Garden**: 7 plants grouped by Living Room / Balcony / Office; Mara & Basil show "Needs water".
- **Today**: overdue (Mara, Basil) + today (Fiddle mist, Rosemary fertilize) + upcoming; tapping a
  task's circle marks it done and the count updates with no reload (reactivity).
- **Plant detail (Mara)**: care rows + the "Spider mites" treatment (step 2 of 5).
- **Community**: 3 posts (fernfiend / leaf.lydia / potted.pete).
- **Profile**: Sorin C. · free · streak 12 · 7 plants.

## What's intentionally still mock / later phases

AI (identify, Dr. Plant, care-plan generation), push notifications, RevenueCat entitlement sync,
weather (`tempLabel`), image uploads (covers/journal/timeline render placeholders — empty after
seed), DMs/swaps/encyclopedia/moderation, like/follow writes, onboarding writes, and route gating
(Phase 4). The login OAuth buttons are disabled until a dev build (Phase 4+).

## Troubleshooting

- **Blank data after sign-in, before seed:** expected — a fresh user has no plants. Run step 6.
- **"Missing EXPO*PUBLIC*…":** `.env` not picked up — restart `expo start` after editing `.env`.
- **No data after sign-out → sign-in in one session:** known Convex+Clerk remount quirk; reload the
  app. (Phase 4 keys the provider by Clerk session to fix this.)
- **Clerk API:** `login.tsx` already targets `@clerk/expo` v3's Future API
  (`signIn.emailCode.sendCode()/verifyCode()` + `signIn.finalize()`, returning `{ error }`). No
  change needed for the installed `@clerk/expo@3.3.x`.
