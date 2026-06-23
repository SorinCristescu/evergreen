# Evergreen — Screen Flow & Navigation Design

**Status:** Draft v4 (design-handoff reconciled) · **Date:** 2026-06-09 · Derived from the
**design handoff** in [`evergreen-mobile-app-design/`](./evergreen-mobile-app-design/) (29 screens
+ `DESIGN-MANIFEST.json`), [`evergreen-diagram.pdf`](../../evergreen-diagram.pdf),
[`prd.md`](../prd.md), and the domain language in [`CONTEXT.md`](../../CONTEXT.md).

> **v4 supersedes v3.** v4 reconciles the doc with the delivered design handoff: it adds every
> shipped screen (splash, the 6 explicit onboarding step screens, capture/identify, messages, and
> the full Profile→settings→legal sub-stack: account · permissions · about · terms · privacy ·
> acknowledgements · rate · blocked · report · identification-history · wishlist · memorial) and
> maps each to its HTML source file. The **`Location → Place → Space → Plant`** model from v3 is
> unchanged.

> **v3 (retained).** v2 modeled place as a flat *Garden (room) + Space (Indoor/Outdoor/
> Greenhouse)* pair. v3 introduced the **3-level location hierarchy** —
> **`Location → Place → Space → Plant`** — and makes **Location** a plan-gated entity
> (**free: 1 · Evergreen+: many**). The words **Space** and **Garden** changed meaning (see
> `CONTEXT.md`): **Place** = Indoor/Outdoor/Greenhouse, **Space** = the room/area, **Garden** =
> the *tab name* for the active Location's contents (no longer an entity). Entity names are
> canonical per `CONTEXT.md`: **User · Gardener · Species · Plant · Location · Place · Space ·
> CarePlan · CareTask · Identification · Treatment**.

---

## 0. Design decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | **Entry model** | **Sign-in-first** — everyone authenticates before anything; no anonymous path |
| 2 | **Welcome + post-login landing** | **Welcome** one-time (first run only). Then route by care state: **plants>0 → Today if an Overdue/Due-today task exists, else Garden**; plants=0 → onboarding-first-plant. Applies on every launch (silent splash router) **and** first run |
| 3 | **Location model** | **`Location → Place → Space → Plant`**; Location is an entity (city + climate + Level + Goals); Place = fixed Indoor/Outdoor/Greenhouse; Space = user-built room/area |
| 4 | **Location gating** | **Free = 1 Location · Evergreen+ = many**; each Location independently configured |
| 5 | **Onboarding** | Per-**Location** sequence: name → climate → Level → Goals → first Place+Space → first plant |
| 6 | **Add a Location** | From Profile; **re-runs the full per-Location onboarding** (Level & Goals are per-Location); gated on free |
| 7 | **Multi-location nav** | **Header Location switcher** on Garden ("Home ▾"); one Location shown at a time |
| 8 | **Tab bar** | `Today · Garden · 📷 · Community · Profile`; **Encyclopedia contextual** (search + Species pages), not a tab |
| 9 | **Center FAB** | **Smart per surface** — capture (Today/Garden) · plant-actions (Plant detail) · compose (Community) · hidden (Profile) |
| 10 | **Add to Garden** | Quick **setup sheet** (nickname · **Place** · **Space** [predefined + custom "Other"]) → land on new Plant detail |
| 11 | **Low-confidence ID** | **Confidence-gated** — high = 1 match; low = candidate list + retake / search / add-without-identifying |
| 12 | **Garden tab** | Location switcher + **Place** filter chips (All/Indoor/Outdoor/Greenhouse) + plants grouped by **Space** |
| 13 | **Plant detail** | Photo-carousel hero + sticky tab bar **Care / About / Timeline / Journal** (4, per handoff); Treatment banner + **inline care-task rows** in Care (no sticky bar); "Move to another Space" in overflow |
| 14 | **Today tab** | **Urgency-grouped** checklist (Overdue / Due today / Coming up); state-aware empty |
| 15 | **Notifications** | **Global bell** (top-right, every tab) → unified Care/Community/System; **DMs separate** in Community |
| 16 | **Community** | **Top-tab** (Feed[Discover⇄Following] / Swap / Challenges) + DM icon; moderation on everything |
| 17 | **Paywall** | **Contextual gates only** at caps (incl. **2nd Location**) + Profile "Update subscription" |
| 18 | **Offboarding** | **Empathetic post-mortem** → **archive** (data kept in Profile › Memorial; free-tier plant slot freed) |

---

## 1. Navigation architecture

```
RootLayout  (ClerkProvider + ConvexProviderWithClerk + ThemeProvider + fonts)
│                                                          ← source HTML: evergreen-<name>.html
├── splash (index)                    Logo bloom; routes by session + care state    ← splash
│        ├─ logged in  ──────────────► (app) Today  if Overdue/Due-today task exists
│        │                             else (app) Garden          (silent, no Welcome)
│        └─ no session ──────────────► (auth)/login
│
├── (auth)/                           ← unauthenticated
│     login.tsx                       Clerk: Google / Apple / email magic-link        ← login
│     onboarding/                     FIRST Location setup (Location #1) — see §3
│        name.tsx                     step 1 · name the Location                      ← onboarding-name
│        climate.tsx                  step 2 · city search → live climate preview     ← onboarding-climate
│        level.tsx                    step 3 · beginner / some / expert               ← onboarding-level
│        goals.tsx                    step 4 · keep-alive / grow / learn / share      ← onboarding-goals
│        place-space.tsx              step 5 · pick Place → Space within it           ← onboarding-place-space
│        first-plant.tsx              step 6 · Identify or add manually               ← onboarding-first-plant
│           └─ identify.tsx              identify-during-onboarding camera path       ← onboarding-identify
│        welcome.tsx                  shown once → product loop → (app) Garden        ← welcome
│
└── (app)/                            ← authenticated; redirect to (auth) if no session
      _layout.tsx                     4-tab bar + center camera FAB + global 🔔 bell (top-right)
      ┌────────────────────────────────────────────────────────────┐
      │   [ Today ]    [ Garden ]    ( 📷 )    [ Community ]    [ Profile ] │
      └────────────────────────────────────────────────────────────┘
      │
      ├── today/                      Tab 1 — daily care home (across ALL Locations)  ← today
      │     index.tsx                 urgency-grouped CareTasks (Overdue/Today/Coming up)
      │     task/[taskId].tsx         (modal) task detail (weather advisory, done/snooze/skip)
      │
      ├── garden/                     Tab 2 — active Location (landing when caught up) ← garden
      │     index.tsx                 header Location switcher · Place chips · grouped by Space
      │     plant/[plantId].tsx       Plant detail — tabs Care/About/Timeline/Journal  ← plant-detail
      │     plant/[plantId]/offboard.tsx  (modal) empathetic post-mortem → archive
      │     onboarding-first-plant.tsx   (0 plants) chooser: Identify / Add manually
      │     manage-spaces.tsx         (modal) create/rename Spaces, reassign Place, move plants
      │
      ├── location-setup/             ADD a Location (2nd+) — same flow as (auth)/onboarding (gated)
      │     index.tsx                 name → climate → level → goals → first Place+Space → first plant
      │
      ├── capture/                    center-FAB modal stack                           ← capture-identify
      │     camera.tsx                live camera (Identify | Diagnose | Add-photo) + inline gallery
      │     identify-result.tsx       confidence-gated result + escape hatches (§5)
      │     setup-plant.tsx           setup sheet: nickname · Place · Space → Plant detail
      │     manual-add.tsx            Add-manually form (search Species optional)
      │     dr-plant.tsx              diagnosis → "Save diagnose" → creates Treatment
      │
      ├── community/                  Tab 3 — social (top tabs Feed/Swap/Challenges)   ← community
      │     index.tsx · swap.tsx · challenges.tsx
      │     post/[postId].tsx · create-post.tsx (← FAB) · listing/[id].tsx · challenge/[id].tsx
      │     u/[handle].tsx            public Gardener profile (Follow / Message)
      │     claim-handle.tsx          (modal) first-write @handle claim
      │
      ├── messages/                   DMs — separate from the 🔔 bell                  ← messages
      │     index.tsx                 conversation list (✉ icon → here)
      │     [conversationId].tsx      real-time chat (swap context, composer, moderation)
      │
      ├── notifications.tsx           (pushed, global) Care / Community / System tabs   ← notifications
      ├── report.tsx                  (modal, global) report abuse — names subject + reason  ← report
      │
      ├── profile/                    Tab 4 — private "Me" hub                          ← profile
      │     index.tsx                 stats · streak · Evergreen+ card · Locations switcher · dark toggle
      │     locations.tsx             manage Locations (rename · climate · Level/Goals · delete · + Add[gated])
      │     memorial.tsx              archived plants (kept with care, never deleted)   ← memorial
      │     wishlist.tsx              species you're hoping to grow next                ← wishlist
      │     identification-history.tsx  every scan + the confidence we showed          ← identification-history
      │     paywall.tsx               (modal) — shared; raised by every contextual gate
      │     moderation-queue.tsx      role-gated (moderator/admin only)
      │     settings/                 settings & legal sub-stack:
      │        account.tsx            identity · data export · careful delete           ← account
      │        permissions.tsx        camera/location/notifications/photos + why        ← permissions
      │        blocked.tsx            manage & unblock blocked accounts                 ← blocked
      │        rate.tsx               star rating → App Store / feedback routing        ← rate
      │        about.tsx              version · legal links · contact                   ← about
      │        terms.tsx             Terms of Service (scroll-progress reader)          ← terms
      │        privacy.tsx           Privacy Policy (+ data-at-a-glance card)           ← privacy
      │        acknowledgements.tsx  credits to the plant community                     ← acknowledgements
      │
      ├── search.tsx                  Encyclopedia search (entry from Today/Garden header)
      └── species/[speciesId].tsx     Encyclopedia Species page (from search, tags, ID result)
```

> **Coverage:** all 29 handoff screens map to a route above (the `← evergreen-*.html` column).
> `evergreen-index.html` is the prototype launcher (not an app screen). Notifications and
> permissions appear both as routes here and in §9.

**Stack/modal conventions.** Tabs hold persistent stacks. `capture/*`, `offboard`, `manage-spaces`,
`location-setup`, `create-post`, `paywall`, `task` detail, `claim-handle`, `report`, and
`notifications` are pushed/modal so they overlay the current context and dismiss back to it.
`messages/` is a pushed stack reached from the **✉** header icon (not a bottom tab). The
**center FAB** opens the right modal for the current surface (§4 → §9). The **🔔 bell** and **✉**
entries live top-right on the main tabs. The settings & legal screens are a pushed sub-stack under
Profile; the legal readers (`terms`, `privacy`, `acknowledgements`) share one scroll-progress
reader pattern (`LegalReader`, see `components.md`).

---

## 2. First-run spine (sign-in-first, per-Location onboarding)

```
Launch
  └─ Splash (Logo)
       ├─ already logged in ──────────────► CARE-STATE ROUTER (silent, no Welcome):
       │                                       Overdue/Due-today task ? Today : Garden
       └─ no session
            └─ Login (Google / Apple / email magic-link)
                 └─ after login → provision `users` row from Clerk identity
                      └─ ONBOARDING — set up Location #1 (§3):
                           name ("Home"…) → city/climate → Level → Goals
                              → first Place + Space → first plant
                           └─ WELCOME (shown once) → CARE-STATE ROUTER
                                (plants>0: Overdue/Due-today task ? Today : Garden)
```

- **Care-state router** (shared by the splash and the post-Welcome step): for a logged-in user
  with plants>0, land on **Today** when at least one **Overdue** or **Due-today** CareTask exists
  (evaluated **across all Locations**); otherwise land on **Garden** (active Location). Caught-up,
  upcoming-only, or no tasks → Garden.
- **Returning users** never see Login, Onboarding, or Welcome — the splash runs the care-state
  router straight into Today or Garden.
- *Implementation note:* the router must read due-task state before navigating, so the splash
  resolves a lightweight "has actionable task today" query (cross-Location) rather than routing
  instantly; show the splash/skeleton until it resolves.
- The **first CarePlan** is generated when the first plant is added — climate, **Level**, and
  **Goals** all come from the plant's **Location**; light/water assumptions from its **Place**/**Space**.

---

## 3. Onboarding = per-Location setup (§ shared by first-run and "Add a Location")

The same sequence runs for **Location #1** (first-run, in `(auth)`) and for every **additional
Location** (from Profile, in `(app)`, behind the paywall on free):

| Step | Screen | Captures | Notes |
|------|--------|----------|-------|
| 1 | **Name** | Location label — *Home* / *Holiday house* / custom | suggestions + free text |
| 2 | **Climate** | city via device location (pre-permission explainer) **or** manual city | drives this Location's CarePlans |
| 3 | **Level** | beginner / some / expert — **per Location** | "expert at home, beginner at the cabin" |
| 4 | **Goals** | keep alive / grow / learn / share — **per Location** | personalization tone |
| 5 | **First Place + Space** | pick a Place (Indoor/Outdoor/Greenhouse) → a Space (predefined or "Other") | seeds the Location's structure |
| 6 | **First plant** | chooser: **Identify / Add manually** (skippable) | lands in the Space from step 5 |

- Steps 3–4 are **per-Location** (stored on the Location, not the User) — this is why "Add a
  Location" re-runs the whole flow.
- **Adding a Location** is reached from **Profile › Locations › + Add location** (or the Garden
  switcher's "+ Add location"). On **free** it raises the **paywall** (§9); on **Evergreen+** it
  runs the sequence above and switches the Garden tab to the new Location.

---

## 4. The center FAB (smart, per-surface)

| Surface | FAB opens | Then |
|---------|-----------|------|
| **Today / Garden** | chooser: **Identify / Add manually** | Identify → camera → result (§5) → **setup sheet** → Plant detail · Add manually → form → Plant detail |
| **Plant detail** | chooser: **Add photo / Diagnose** | Add photo → camera → appended to this Plant's photos/Timeline · Diagnose → camera → **Dr. Plant** → Save diagnose → **Treatment** |
| **Community** | **Create post** | photos + caption + optional Species/Plant tag → moderation prefilter → publish |
| **Profile** | *(FAB hidden)* | — |

- Camera has an **inline gallery picker** (no separate "pick from gallery" chooser row).
- The **setup sheet** (Identify or Add-manually) captures: **nickname** (optional), **Place**
  (Indoor/Outdoor/Greenhouse), **Space** (predefined chips for that Place, or **"Other"** →
  custom text input). The plant lands in the **current Garden-tab Location** (a Location picker
  appears only if the FAB was triggered outside a Location context). Save → CarePlan generated →
  new **Plant detail** (Care tab) + toast.
- **Diagnose → Dr. Plant** → **Save diagnose** creates a **Treatment** on the Plant and returns
  to its **Care** tab (active-Treatment banner, §6). Low-confidence diagnosis → "consult a human."

---

## 5. Low-confidence / no-match identification (the cardinal-sin guardrail)

The result screen is **confidence-gated** — it never asserts a shaky guess (ADR-0002):

```
HIGH confidence
  ┌─ hero photo · Species · common name · confidence %
  ├─ care preview (light / water cadence)
  └─ [ Add to Garden ]   [ See Species page ]

LOW confidence ("Not sure yet")
  ┌─ top-N candidate Species (thumb · name · confidence %) → tap → Species page
  └─ [ Retake / add photo ]   [ Search by name ]   [ Add without identifying ]
```

- **Search by name** → Encyclopedia search → Species → setup sheet.
- **Add without identifying** → an **unidentified Plant** (nickname + Place + Space,
  conservative-default CarePlan, "Identify later" chip). Confidence % is **always shown**.

---

## 6. Plant detail (the care cockpit)

```
┌─ Hero: photo carousel ( ‹ swipe › ) + overlay ‹back  ⋯overflow› (Move to Space · Offboard · Edit · Identify later)
├─ Title block: nickname · Species · Place + Space pills
├─ Sticky tabs:  [ Care ]   About   Timeline   Journal      (4 tabs, per handoff)
│  CARE      ⚠ Under treatment — <diagnosis> (step 2/5) ›   (only when a Treatment is active)
│            Care plan — inline CareTask rows (tap ✓ to complete; no sticky bar)
│  ABOUT     Species care guide · Location · Place · Space (tap → move)
│  TIMELINE  growth photos over time         JOURNAL  free-form notes
```

- **Move to another Space** (overflow): pick a Place → Space (or create one); the plant relocates
  instantly. Moving across **Places/Locations** re-evaluates the CarePlan (climate/light change).
- **Active-Treatment banner** atop Care → full Dr. Plant/Treatment screen. Resolved Treatments
  drop into history.
- **Offboarding** (overflow → "Mark as gone"): cause picker (*died / gave away / other*, optional
  detail → better tips, never blame) → **Archive** (photos + journal preserved; plant leaves the
  active Location and **frees a free-tier plant slot**) → visible in **Profile › Memorial**.

---

## 7. Garden tab (active Location's collection — landing when caught up)

> **Landing:** Garden is where a logged-in `plants>0` user lands **unless** an Overdue/Due-today
> CareTask exists, in which case the care-state router (§2) sends them to **Today** instead.


```
┌─ Header:  🔍 search   "Garden"   Home ▾   🔔 bell        ← Location switcher
├─ Place filter chips:  [ All ]  Indoor  Outdoor  Greenhouse
├─ ── Living Room  (Indoor) ──             (plants grouped by Space, Place shown)
│      [card][card][card]                  card: cover · nickname · "needs water" dot
├─ ── Balcony  (Outdoor) ──
│      [card][card]
└─ Manage Spaces  (create / rename Spaces · reassign Place · move plants)

Home ▾  →  ● Home · Lisbon
           ○ Holiday house · Sintra
           + Add location          (free → paywall · Evergreen+ → location-setup §3)
```

- Shows **one Location at a time**. Free users (1 Location) see the name as a static title —
  no switcher chrome until a 2nd Location exists.
- **Place** chips filter; plants group under their **Space** (with the Space's Place labeled).
- Any plant is **one tap** away (→ Plant detail).
- New **Spaces** are created here (Manage Spaces) or inline during add-plant ("Other"). Predefined
  Spaces are pre-mapped to a Place (e.g. *Balcony* → Outdoor); custom Spaces ask the user to pick
  the Place. An Indoor Space must be a room (the picker disallows balcony/terrace under Indoor).

---

## 8. Community tab (top-tab / Instagram-grammar)

```
┌─ Header:  "Community"   ✉ DMs   🔔 bell
├─ Top tabs:  [ Feed ]   Swap   Challenges
│   Feed: ( Discover ⇄ Following )  ← defaults to Discover until enough follows (cold start)
│        post card → post detail (like / comment / save) · ⋮ Report / Block / Mute
│   Swap: listing grid → detail → "Message to arrange" (DM)
│   Challenges: list → detail → entries
├─ center FAB → Create post (photos + caption + optional Species/Plant tag) → moderation → publish
└─ tap any avatar → public Gardener profile (u/[handle]): post grid · followers · Follow / Message
```

- **Moderation is the App-Store gate (PRD M6).** Clearly-violating content **blocked
  pre-publish**; borderline **publishes + flags** to the role-gated queue. **Report / Block /
  Mute** on every post, comment, DM, profile, listing. Block is bidirectional.
- **@handle** claimed via modal on the first community write.

---

## 9. Profile (private "Me" hub) + Locations + Notifications + monetization

```
profile/index
  ┌─ "View public profile" → u/[myHandle]
  ├─ My stats: plants · 🔥 streak · tasks done
  ├─ 📍 Locations → list (name · climate · Level/Goals · plant count) · rename · delete · + Add[gated]
  ├─ ⭐ Evergreen+ card → "Update subscription" → Paywall
  ├─ Memorial · Wishlist · Identification history
  └─ Settings → Notifications · Permissions · Appearance · Account (export, DELETE) · Legal/abuse-contact
```

**Notifications (global bell).** Top-right every tab → one screen, three sections: **Care**
(reminders/overdue), **Community** (likes/comments/follows), **System** (subscription, moderation).
**DMs are separate** (✉ in Community).

**Paywall (contextual gates only).** Appears exactly at a cap:

| Trigger | Gate |
|---------|------|
| **Add 2nd Location** | "1 location on free — Evergreen+ unlocks multiple homes" |
| Add 6th Plant | "5-plant limit" |
| 4th Identification this month | "3 IDs/mo on free" |
| Tap **Dr. Plant** | "Diagnostics is Evergreen+" |
| Post to Community | "Posting is Evergreen+" |

Each names the limit + what unlocks (**7-day trial**, Restore). Optimistic unlock from RevenueCat
`CustomerInfo`; Convex `entitlement` is the authoritative server-side gate; caps enforced
server-side (PRD M7).

**Downgrade (Evergreen+ → free) with multiple Locations.** Extra Locations are **locked
read-only**, never deleted: the user keeps Location #1 active (their choice of which) and the rest
become view-only with an "Upgrade to reactivate" banner. Plants/data are preserved; re-subscribing
restores full access. (Same "never silent loss" principle as offboarding.)

---

## 10. Cross-cutting states

- **Offline / pending-sync:** photo uploads, journal entries, "mark done", and Space moves queue
  in MMKV with a visible **"pending sync"** chip; flush on reconnect; no false streak breaks.
- **AI vendor outage (ADR-0002):** capture never hard-fails — photo preserved, retry; ID and
  care-plan failures independent.
- **Permissions in context:** camera at first capture; location during each Location's climate
  step (pre-permission explainer, manual-city fallback); push at the Today nudge.
- **Push deep-linking:** a tapped push routes to its `entityRef` (task / post / conversation).
- **Image moderation:** every community/DM upload via a Convex action (ok / flag / remove).
- **Accessibility (PRD §10):** 44pt targets, no color-only status, dynamic type, reduced-motion,
  WCAG-AA on the green palette.

---

## 11. Deviations & notes

**From the diagram:**
1. **Encyclopedia** isn't in the diagram; kept **contextual** (search + Species pages), not a tab.
2. The **bell** is treated as **global** (top-right, every tab).
3. The **FAB** is documented **smart-per-surface** (the diagram defined only Garden + Plant detail).
4. The diagram drew a single flat Garden with Indoor/Outdoor/Greenhouse chips; v3 layers the
   **Location switcher** above it and reinterprets the chips as **Place** filters with plants
   grouped by **Space**.

**From PRD §9:**
5. **Garden tab = flat grid** (one tap to any plant) within the active Location, not a literal
   list→detail hierarchy. Pure UI; reversible.
6. **Encyclopedia demoted** from a primary-nav pillar to a contextual surface. Reversible.

**ADR candidate (offered, not yet written).** The **`Location → Place → Space` model with
per-Location Level/Goals and a free=1 / paid=many gate** is hard-to-reverse (schema + auth/
entitlement), surprising (per-Location gardening level is unusual; a future engineer will ask
why), and a real trade-off (per-user vs per-location personalization; entity vs attribute). It
warrants `docs/adr/0003-location-place-space-model.md`.
```

