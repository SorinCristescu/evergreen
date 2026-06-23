# Evergreen — Reusable Component Catalog

**Status:** Draft v2 (design-handoff reconciled) · **Date:** 2026-06-09 · Derived from
[`prd.md`](../prd.md), the **design handoff** in
[`evergreen-mobile-app-design/`](./evergreen-mobile-app-design/) (29 screens), and
[`screen-flow.md`](./screen-flow.md) (v4, the `Location → Place → Space → Plant` model).

> The single source-of-truth inventory of **reusable components** for Evergreen. Each entry has a
> name, **When to use**, what it **Composes**, and a **TypeScript props** signature. Tiers:
> **Tier 0 Neumorphic foundation** → **Tier 1 Primitives** → **Tier 2 Domain** → **Tier 3 Chrome
> & states**.
>
> **v2 reconciles with the design handoff** (pixel-faithful target): adds the **Tier 0
> neumorphic foundation** (`NeuSurface`/`NeuPressable`), re-specs **`Icon`** over
> `react-native-svg` (every inline SVG ported 1:1, not `expo-symbols`), and adds the components the
> 29 shipped screens revealed — see **§ Tier 4 · Handoff-revealed components** near the end.
>
> **No styles here, by design.** Props are *behavior · data · variants* only — no `style`,
> `StyleProp`, colors, spacing, or radii. Variant/size enums are API, not styling, so they stay.
> Visual design lives in the theme + each component's implementation, not in this contract.

---

## How to read this

- Signatures follow the repo convention (`src/components/*`): a `type XProps = { … }` alias,
  **no `React.FC`**, named exports, optional props marked `?`, discriminated unions for variants.
- `Composes` names the lower-level building blocks an implementation should reuse — read it as a
  dependency hint, not a hard rule.
- Callbacks are named `onX`; data props carry domain shapes from the **Shared types** section.

### Conventions & reuse

Build on what already exists rather than duplicating:

| Existing | Path | Use for |
|----------|------|---------|
| `ThemedText` | `src/components/themed-text.tsx` | all text; primitives render copy through it |
| `ThemedView` | `src/components/themed-view.tsx` | theme-aware surfaces/containers |
| `Collapsible` | `src/components/ui/collapsible.tsx` | accordion sections (settings, care guide) |
| `ExternalLink` | `src/components/external-link.tsx` | outbound links (legal, abuse contact) |
| theme tokens | `src/constants/theme.ts` | `Colors`, `Fonts`, `Spacing` (consumed in impl, not here) |

Stack notes (Expo SDK 56 / RN 0.85 / React 19):

- **Neumorphism (pixel-faithful):** all elevated/inset surfaces go through **`NeuSurface`**
  (Tier 0), backed by `react-native-shadow-2` *(needs adding)*. Never hand-roll shadows.
- **Icons:** **`react-native-svg`** *(needs adding)* — the handoff's inline SVGs are ported 1:1
  into an icon registry; `IconName` is the union of registry keys (not `expo-symbols`).
- **Images:** `expo-image` (`Image`) for every remote/cover/thumbnail (caching + placeholders);
  the handoff's gradient placeholders become a shared `GradientCover` (Tier 4).
- **Animation/gesture:** `react-native-reanimated` + `react-native-gesture-handler` are installed;
  GSAP entrance timelines are reinterpreted as a shared `useStaggerIn` Reanimated hook.
- **Needs adding when first used** (flagged inline): `react-native-svg`, `react-native-shadow-2`,
  `@gorhom/bottom-sheet` (every `BottomSheet`/sheet), `@shopify/flash-list` (long lists — feed,
  plant grid, messages, identification history), `expo-font` (General Sans / Inter / JetBrains Mono).

---

## Shared types

Defined once; referenced by signatures throughout.

```ts
// Icons & ids
type IconName = string;                 // expo-symbols symbol name (SF / Material)
type ID = string;                       // Convex document id (opaque)

// Domain enums — mirror CONTEXT.md / prd.md §7 schema
type Place = 'indoor' | 'outdoor' | 'greenhouse';
type CareTaskType =
  | 'water' | 'fertilize' | 'mist' | 'prune' | 'repot' | 'clean' | 'rotate';
type CareTaskStatus = 'due' | 'done' | 'snoozed' | 'skipped';
type Urgency = 'overdue' | 'today' | 'upcoming';
type PlantStatus = 'alive' | 'archived' | 'lost';
type Entitlement = 'free' | 'plus';
type GardeningLevel = 'beginner' | 'intermediate' | 'expert';
type IssueType = 'disease' | 'pest' | 'deficiency';
type Severity = 'low' | 'medium' | 'high';
type ModerationState = 'ok' | 'flagged' | 'removed';
type ReportTargetType = 'post' | 'comment' | 'message' | 'user' | 'listing';

// Lightweight view models (data props carry these; not the full DB rows)
type SpaceRef = { id: ID; name: string; place: Place };
type LocationRef = { id: ID; name: string; climateLabel: string; plantCount: number; locked?: boolean };
type SpeciesRef = { id: ID; scientificName: string; commonName?: string };
type GardenerRef = { id: ID; handle: string; name: string; avatarUrl?: string };

type PlantSummary = {
  id: ID;
  nickname?: string;
  coverUrl?: string;
  species?: SpeciesRef;        // absent → unidentified
  needsWater?: boolean;
  space: SpaceRef;
};

type CareTaskItem = {
  id: ID;
  type: CareTaskType;
  status: CareTaskStatus;
  urgency: Urgency;
  dueLabel: string;            // "in 2 days", "today", "overdue"
  plant: PlantSummary;
};

type IdentificationCandidate = {
  species: SpeciesRef;
  confidence: number;          // 0..1
};

type PaywallTrigger =
  | 'second-location' | 'plant-cap' | 'id-cap' | 'dr-plant' | 'community-post';
```

---

## Index (component → tier → where it appears)

| Component | Tier | Used on (screen-flow §) |
|-----------|------|--------------------------|
| Button, IconButton, Icon | 1 | everywhere |
| Chip / FilterChip | 1 | Garden Place chips §7, Onboarding Level/Goals §3, SpacePicker |
| SegmentedControl, TopTabs | 1 | Community top tabs §8, Plant detail tabs §6, Discover⇄Following |
| Avatar, Card, Pill, Badge | 1 | Community §8, Garden §7, headers |
| TextField, SearchField | 1 | Onboarding §3, create-post §8, search §1 |
| BottomSheet, ActionSheet | 1 | FAB choosers §4, setup/offboard/paywall sheets |
| ListSection, StepProgress, Stepper, Toggle, ProgressRing, Toast, ConfirmDialog | 1 | Today §6/§14, Onboarding §3, Settings §9 |
| PhotoCarousel, Thumbnail | 1 | Plant detail hero §6, cards |
| PlantCard, CareTaskRow, TaskGroupSection, StreakBadge | 2 | Garden §7, Today §14 |
| IdentificationResultCard, CandidateRow/List, ConfidencePill, CarePreview | 2 | Identify result §5 |
| PlantSetupSheet, PlacePicker, SpacePicker | 2 | Add-to-Garden §4, manage-spaces §7 |
| LocationSwitcher | 2 | Garden header §7, Profile §9 |
| CareActionBar, TreatmentBanner, TreatmentStepList, WeatherAdvisoryBanner | 2 | Plant detail §6, task detail §6 |
| SpeciesListItem/Card | 2 | Encyclopedia §1/§5 |
| PostCard, CommentRow, GardenerProfileHeader, ConversationRow, MessageBubble, SwapListingCard, ChallengeCard | 2 | Community §8 |
| NotificationRow | 2 | Notifications §9 |
| PaywallSheet | 2 | contextual gates §9 |
| MemorialPlantCard, OffboardSheet | 2 | offboarding §6, Profile › Memorial §9 |
| AppHeader, ScreenHeader, CenterFAB | 3 | all tabs, pushed screens, tab bar §1 |
| EmptyState, Skeleton, PendingSyncBadge, ErrorRetry | 3 | cross-cutting §10 |
| ModerationActionSheet, PermissionPrimer | 3 | Community §8, permissions §10 |
| **NeuSurface, NeuPressable** | 0 | every surface/control (neumorphic substrate) |
| NavRow | 4 | settings · account · about · permissions · locations |
| OAuthButton | 4 | login |
| StepScaffold, LoopRow | 4 | onboarding steps §3, welcome |
| CityClimateSearch | 4 | onboarding climate step |
| StatGrid | 4 | profile |
| GradientCover | 4 | plant/photo covers across cards (no image) |
| ConfidenceMeter | 4 | capture/identify result |
| LegalReader, ScrollProgressBar, DataGlanceCard | 4 | terms · privacy · acknowledgements |
| PermissionRow | 4 | permissions screen |
| StarRating | 4 | rate |
| BlockedRow | 4 | blocked accounts |
| ReportForm | 4 | report abuse |
| BrandMark | 4 | splash · about · onboarding accents |

> **Screen coverage:** all 29 handoff screens map to ≥1 component here. New screens introduced in
> v2 and their lead components: *splash* → `BrandMark`; *login* → `OAuthButton`; *onboarding
> name/climate/level/goals/place-space/first-plant* → `StepScaffold` + (`CityClimateSearch` /
> `Chip` / `PlacePicker`+`SpacePicker` / identify flow); *messages* → `ConversationRow` +
> `MessageBubble`; *identification-history* → `IdentificationResultCard`/`ConfidencePill`;
> *account / permissions / about / blocked / report / rate* → `NavRow` / `PermissionRow` /
> `BlockedRow` / `ReportForm` / `StarRating`; *terms / privacy / acknowledgements* → `LegalReader`.

---

# Tier 0 · Neumorphic foundation

> The handoff's entire look is neumorphic — every surface is either *raised* (outer dual shadow)
> or *pressed* (inset dual shadow). These two components are the substrate **everything else
> composes**; no other component hand-rolls shadows.

### NeuSurface
**When to use:** any non-interactive elevated/inset surface — cards, headers, sheets, chips
backgrounds, stat tiles. The single home for the `--neu-raised` / `--neu-raised-sm` /
`--neu-pressed` token presets.
**Composes:** `View` + `react-native-shadow-2` (dual-layer shadow).
```ts
type NeuSurfaceProps = {
  children: React.ReactNode;
  elevation?: 'raised' | 'raised-sm' | 'pressed' | 'flat';
  radius?: 'sm' | 'md' | 'lg' | 'pill' | 'full';
  // perf: list rows pass `flatten` to swap the dual-shadow for a single cached shadow
  flatten?: boolean;
  accessibilityLabel?: string;
};
```

### NeuPressable
**When to use:** any interactive neumorphic control — buttons, chips, icon buttons, list rows,
FAB. Animates raised → pressed on touch (the tactile soft-UI press).
**Composes:** `Pressable` + `NeuSurface` + Reanimated (shadow/scale transition).
```ts
type NeuPressableProps = {
  children: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  elevation?: 'raised' | 'raised-sm';   // resting elevation; presses to 'pressed'
  radius?: 'sm' | 'md' | 'lg' | 'pill' | 'full';
  disabled?: boolean;
  accessibilityRole?: 'button' | 'link' | 'tab';
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
};
```

---

# Tier 1 · Primitives

### Button
**When to use:** any primary/secondary call-to-action (Add to Garden, Continue, Save diagnose, Upgrade).
**Composes:** `Pressable` + `ThemedText` + `Icon`.
```ts
type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;          // shows spinner, blocks press
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
};
```

### IconButton
**When to use:** icon-only tap targets in headers/rows (bell, back, overflow ⋯, search, DM ✉, like).
**Composes:** `Pressable` + `Icon` (+ optional `Badge`).
```ts
type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string; // required — no visible text
  size?: 'sm' | 'md' | 'lg';
  badgeCount?: number;        // overlays a Badge when > 0
  disabled?: boolean;
};
```

### Icon
**When to use:** any glyph; the single wrapper over the **`react-native-svg` icon registry** (the
handoff's inline stroke SVGs, ported 1:1). `IconName` is the union of registry keys.
**Composes:** `react-native-svg` (`Svg`/`Path`) + the icon registry (`src/components/icons/`).
```ts
type IconProps = {
  name: IconName;             // registry key (search, bell, heart, leaf, droplet, …)
  size?: number;
  strokeWidth?: number;       // handoff icons are stroke-based (1.5–2.4)
  tone?: 'default' | 'muted' | 'accent' | 'danger' | 'inverse';
  filled?: boolean;           // outline ↔ filled variant (e.g. heart, bookmark)
  accessibilityLabel?: string; // omit when decorative
};
```

### Chip / FilterChip
**When to use:** selectable pills — Garden **Place** filters (All/Indoor/Outdoor/Greenhouse),
onboarding Level (single) and Goals (multi), Space options.
**Composes:** `Pressable` + `ThemedText` + optional `Icon`.
```ts
type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  leadingIcon?: IconName;
  removable?: boolean;        // shows an "x"
  onRemove?: () => void;
  disabled?: boolean;
};
```

### SegmentedControl
**When to use:** 2–3 mutually-exclusive options inline — the Feed **Discover ⇄ Following** toggle.
**Composes:** `Pressable` row + `ThemedText`.
```ts
type SegmentedControlProps<T extends string = string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};
```

### TopTabs
**When to use:** labeled top-tab bar within a screen — Community **Feed/Swap/Challenges**, Plant
detail **Care/Timeline/Journal**.
**Composes:** `SegmentedControl` semantics + a swipeable pager (Reanimated).
```ts
type TopTabsProps = {
  tabs: { key: string; label: string; badgeCount?: number }[];
  activeKey: string;
  onChange: (key: string) => void;
  swipeable?: boolean;        // sync with horizontal pager
};
```

### Avatar
**When to use:** a Gardener's picture anywhere (feed, comments, DMs, profile header).
**Composes:** `expo-image` + `ThemedText` (initials fallback).
```ts
type AvatarProps = {
  uri?: string;               // falls back to initials when absent
  name: string;               // for initials + a11y label
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;       // → Gardener profile
  showBadge?: boolean;        // e.g. online / verified dot
};
```

### Card
**When to use:** the generic rounded surface that wraps most content blocks; optionally pressable.
**Composes:** `ThemedView` (+ `Pressable` when `onPress`).
```ts
type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
};
```

### TextField
**When to use:** text entry — caption, custom Space name ("Other"), manual species, city, nickname.
**Composes:** `TextInput` + `ThemedText` (label/helper/error).
```ts
type TextFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;         // error state when present
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoFocus?: boolean;
  leadingIcon?: IconName;
  onSubmitEditing?: () => void;
};
```

### SearchField
**When to use:** the Encyclopedia search entry on Today/Garden headers; in-screen search.
**Composes:** `TextField` (search variant) + `IconButton` (clear).
```ts
type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onClear?: () => void;
};
```

### Badge
**When to use:** unread counts / status dots overlaid on icons (bell, DM) or beside labels.
**Composes:** `ThemedView` + `ThemedText`.
```ts
type BadgeProps = {
  count?: number;             // omit for a plain dot
  max?: number;               // e.g. 99 → "99+"
  variant?: 'count' | 'dot';
  tone?: 'default' | 'danger' | 'accent';
};
```

### Pill
**When to use:** small read-only status/label tags (e.g. "Unidentified", "Greenhouse", "Locked").
**Composes:** `ThemedView` + `ThemedText` + optional `Icon`.
```ts
type PillProps = {
  label: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  leadingIcon?: IconName;
};
```

### BottomSheet
**When to use:** the base modal sheet container behind every sheet (chooser, setup, paywall, offboard).
**Composes:** `@gorhom/bottom-sheet` *(needs adding)* + `ThemedView`.
```ts
type BottomSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  snapPoints?: (number | string)[];
  enablePanToClose?: boolean;
  children: React.ReactNode;
};
```

### ActionSheet
**When to use:** a list of actions in a sheet — backs the **FAB choosers** (Identify/Add manually;
Add photo/Diagnose) and other quick menus. Each chooser is just `actions` data, not a new component.
**Composes:** `BottomSheet` + `Button`/row + `Icon`.
```ts
type ActionSheetAction = {
  key: string;
  label: string;
  icon?: IconName;
  tone?: 'default' | 'destructive';
  disabled?: boolean;
  onPress: () => void;
};
type ActionSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  actions: ActionSheetAction[];
};
```

### ListSection / SectionHeader
**When to use:** a titled group inside a list — Today urgency groups, Garden Space groups, settings groups.
**Composes:** `ThemedText` (header) + children.
```ts
type ListSectionProps = {
  title: string;
  count?: number;
  action?: { label: string; onPress: () => void }; // e.g. "Water all"
  children: React.ReactNode;
};
```

### StepProgress
**When to use:** progress through a sequence — per-Location onboarding steps; Treatment steps n/m.
**Composes:** `ThemedView` segments + `ThemedText`.
```ts
type StepProgressProps = {
  total: number;
  current: number;            // 1-based
  labels?: string[];
};
```

### Stepper
**When to use:** bounded numeric input — pot size (cm).
**Composes:** `IconButton` (±) + `ThemedText`.
```ts
type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;              // "cm"
};
```

### Toggle
**When to use:** boolean settings — notification categories, dark mode, quiet hours.
**Composes:** `Switch` + `ThemedText`.
```ts
type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};
```

### ProgressRing
**When to use:** circular completion — Today's progress, streak progress.
**Composes:** `react-native-svg`/Reanimated + `ThemedText` (center label).
```ts
type ProgressRingProps = {
  progress: number;           // 0..1
  size?: number;
  label?: string;             // center text, e.g. "3/5"
};
```

### Toast
**When to use:** transient, non-blocking confirmations ("Added to Living Room · View plant").
**Composes:** `ThemedView` + `ThemedText` + optional `Button` (action).
```ts
type ToastProps = {
  message: string;
  visible: boolean;
  onHide: () => void;
  tone?: 'default' | 'success' | 'error';
  action?: { label: string; onPress: () => void };
  durationMs?: number;
};
```

### ConfirmDialog
**When to use:** confirm a consequential/destructive action (delete Space with plants, delete account).
**Composes:** modal + `ThemedText` + `Button`.
```ts
type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};
```

### PhotoCarousel
**When to use:** swipeable image pager — the Plant detail hero (`‹ Plant fotos ›`), post photos.
**Composes:** `expo-image` + gesture pager + page indicator.
```ts
type PhotoCarouselProps = {
  photos: { uri: string; id: ID }[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onPressPhoto?: (id: ID) => void;
  showIndicator?: boolean;
};
```

### Thumbnail
**When to use:** small fixed-ratio image (plant card cover, task-row thumb, candidate thumb).
**Composes:** `expo-image`.
```ts
type ThumbnailProps = {
  uri?: string;
  aspectRatio?: number;       // default 1
  rounded?: 'sm' | 'md' | 'full';  // shape intent, not a style value
  placeholderIcon?: IconName; // shown when uri absent
  accessibilityLabel?: string;
};
```

---

# Tier 2 · Domain components

### PlantCard
**When to use:** a plant in the Garden grid (grouped by Space).
**Composes:** `Card` + `Thumbnail` + `ThemedText` + `Badge`/dot.
```ts
type PlantCardProps = {
  plant: PlantSummary;
  onPress: (plantId: ID) => void;
  showSpace?: boolean;        // label the Space/Place on the card
};
```

### CareTaskRow
**When to use:** one due task in the Today list (and in Plant detail Care).
**Composes:** `Thumbnail` + `Icon` + `ThemedText` + swipe actions (gesture-handler).
```ts
type CareTaskRowProps = {
  task: CareTaskItem;
  onComplete: (taskId: ID) => void;
  onSnooze: (taskId: ID) => void;
  onSkip: (taskId: ID) => void;
  onPress: (taskId: ID) => void;   // → task detail
};
```

### TaskGroupSection
**When to use:** an urgency bucket on Today (Overdue / Due today / Coming up) with optional batch action.
**Composes:** `ListSection` + `CareTaskRow`.
```ts
type TaskGroupSectionProps = {
  urgency: Urgency;
  tasks: CareTaskItem[];
  onCompleteAll?: () => void;      // "Water all" batch
  onTaskComplete: (taskId: ID) => void;
  onTaskSnooze: (taskId: ID) => void;
  onTaskSkip: (taskId: ID) => void;
  onTaskPress: (taskId: ID) => void;
};
```

### StreakBadge
**When to use:** the 🔥 streak indicator on Today and Profile.
**Composes:** `Icon` + `ThemedText`.
```ts
type StreakBadgeProps = {
  count: number;
  active?: boolean;           // dimmed when broken/zero
  onPress?: () => void;
};
```

### IdentificationResultCard
**When to use:** the high-confidence identification result (single top match + actions).
**Composes:** `Card` + `PhotoCarousel`/`Thumbnail` + `ConfidencePill` + `CarePreview` + `Button`.
```ts
type IdentificationResultCardProps = {
  photoUri: string;
  topMatch: IdentificationCandidate;
  onAddToGarden: () => void;
  onSeeSpecies: (speciesId: ID) => void;
};
```

### CandidateRow / CandidateList
**When to use:** the low-confidence "Not sure yet" candidate picker.
**Composes:** `Thumbnail` + `ThemedText` + `ConfidencePill` (row); list wraps rows + escape hatches.
```ts
type CandidateRowProps = {
  candidate: IdentificationCandidate;
  onPress: (speciesId: ID) => void;
};
type CandidateListProps = {
  candidates: IdentificationCandidate[];
  onSelect: (speciesId: ID) => void;
  onRetake: () => void;
  onSearchByName: () => void;
  onAddWithoutIdentifying: () => void;
};
```

### ConfidencePill
**When to use:** show an identification/diagnosis confidence %, with tone keyed to thresholds.
**Composes:** `Pill`.
```ts
type ConfidencePillProps = {
  confidence: number;         // 0..1; component maps to high/med/low tone
};
```

### CarePreview
**When to use:** a compact care summary (light + water cadence) on the result card and Species page.
**Composes:** `Icon` + `ThemedText`.
```ts
type CarePreviewProps = {
  light?: 'direct' | 'indirect' | 'shade';
  waterEveryDays?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  petSafe?: boolean;
};
```

### PlantSetupSheet
**When to use:** the "Add to Garden" / add-manually setup sheet — captures nickname · Place · Space.
**Composes:** `BottomSheet` + `TextField` + `PlacePicker` + `SpacePicker` + `Button`.
```ts
type PlantSetupValue = {
  nickname?: string;
  place: Place;
  spaceId?: ID;               // existing Space…
  newSpaceName?: string;      // …or a custom "Other" name
};
type PlantSetupSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  locationId: ID;
  spaces: SpaceRef[];         // existing Spaces in this Location
  initial?: Partial<PlantSetupValue>;
  onSave: (value: PlantSetupValue) => void;
};
```

### PlacePicker
**When to use:** choose the fixed environment — Indoor / Outdoor / Greenhouse.
**Composes:** `Chip` row.
```ts
type PlacePickerProps = {
  value?: Place;
  onChange: (place: Place) => void;
};
```

### SpacePicker
**When to use:** pick a room/area for the chosen Place — predefined chips + an "Other" custom input.
Enforces the rule that Indoor Spaces are rooms only (no balcony/terrace under Indoor).
**Composes:** `Chip` (predefined) + `TextField` ("Other").
```ts
type SpacePickerProps = {
  place: Place;               // scopes the predefined options
  spaces: SpaceRef[];         // existing Spaces for this Place
  selectedSpaceId?: ID;
  onSelect: (spaceId: ID) => void;
  onCreate: (name: string) => void;  // "Other" → custom Space
};
```

### LocationSwitcher
**When to use:** the Garden header "Home ▾" switcher (and Profile › Locations entry). Hidden chrome
when only one Location exists; "+ Add location" is gated on free.
**Composes:** `IconButton`/`Button` trigger + `ActionSheet`/menu + `Pill` (locked).
```ts
type LocationSwitcherProps = {
  locations: LocationRef[];
  activeLocationId: ID;
  onSelect: (locationId: ID) => void;
  onAddLocation: () => void;  // → location-setup, or paywall if gated
  canAddLocation: boolean;    // false on free with 1 location → gate
};
```

### CareActionBar
**When to use:** the sticky primary care action pinned on Plant detail ("Mark watered / done").
**Composes:** `Button` (+ context label).
```ts
type CareActionBarProps = {
  nextTask?: CareTaskItem;    // absent → "All caught up"
  onComplete: (taskId: ID) => void;
};
```

### TreatmentBanner
**When to use:** the "Under treatment — step n/m" card atop the Care tab when a Treatment is active.
**Composes:** `Card` + `Icon` + `ThemedText` + `StepProgress`.
```ts
type TreatmentBannerProps = {
  diagnosis: string;
  issueType: IssueType;
  severity: Severity;
  currentStep: number;
  totalSteps: number;
  onPress: () => void;        // → full Treatment screen
};
```

### TreatmentStepList
**When to use:** the ordered, checkable steps inside a Treatment.
**Composes:** `ThemedText` + checkbox row + `Button` (log photo).
```ts
type TreatmentStep = { id: ID; text: string; done: boolean };
type TreatmentStepListProps = {
  steps: TreatmentStep[];
  onToggleStep: (stepId: ID, done: boolean) => void;
  onLogPhoto?: () => void;
};
```

### WeatherAdvisoryBanner
**When to use:** the dismissible "rain expected — skip?" hint for outdoor tasks. **Never auto-skips.**
**Composes:** `Card` + `Icon` + `ThemedText` + `Button`.
```ts
type WeatherAdvisoryBannerProps = {
  message: string;            // "Rain expected today"
  onSkip: () => void;         // user-initiated only
  onDismiss: () => void;
};
```

### SpeciesListItem / SpeciesCard
**When to use:** Encyclopedia search results / browse cards; wishlist bookmarking.
**Composes:** `Card`/row + `Thumbnail` + `ThemedText` + `IconButton` (bookmark).
```ts
type SpeciesListItemProps = {
  species: SpeciesRef & { thumbUrl?: string; difficulty?: 'easy' | 'medium' | 'hard' };
  bookmarked?: boolean;
  onPress: (speciesId: ID) => void;
  onToggleWishlist?: (speciesId: ID) => void;
};
```

### PostCard
**When to use:** a community feed post (Discover/Following) and post detail header.
**Composes:** `Card` + `GardenerProfileHeader`(compact) + `PhotoCarousel` + action row + `IconButton`.
```ts
type PostCardProps = {
  post: {
    id: ID;
    author: GardenerRef;
    photoUrls: string[];
    caption: string;
    likeCount: number;
    commentCount: number;
    liked: boolean;
    saved: boolean;
    taggedSpecies?: SpeciesRef;
    createdAtLabel: string;
  };
  onPressPost: (postId: ID) => void;
  onPressAuthor: (handle: string) => void;
  onToggleLike: (postId: ID) => void;
  onToggleSave: (postId: ID) => void;
  onComment: (postId: ID) => void;
  onOpenModeration: (target: { type: ReportTargetType; id: ID }) => void;
};
```

### CommentRow
**When to use:** a single comment under a post.
**Composes:** `Avatar` + `ThemedText` + `IconButton` (overflow).
```ts
type CommentRowProps = {
  comment: { id: ID; author: GardenerRef; text: string; createdAtLabel: string };
  onPressAuthor: (handle: string) => void;
  onOpenModeration: (target: { type: 'comment'; id: ID }) => void;
};
```

### GardenerProfileHeader
**When to use:** the header of a public Gardener profile (and compact form atop a PostCard).
**Composes:** `Avatar` + `ThemedText` + `Button` (Follow/Message).
```ts
type GardenerProfileHeaderProps = {
  gardener: GardenerRef & { bio?: string; followerCount: number; followingCount: number };
  isSelf?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onEditProfile?: () => void; // when isSelf
};
```

### ConversationRow
**When to use:** a row in the DM inbox.
**Composes:** `Avatar` + `ThemedText` + `Badge`.
```ts
type ConversationRowProps = {
  conversation: {
    id: ID;
    other: GardenerRef;
    lastMessagePreview: string;
    lastAtLabel: string;
    unreadCount: number;
  };
  onPress: (conversationId: ID) => void;
};
```

### MessageBubble
**When to use:** a single DM message (text and/or image), sent or received.
**Composes:** `ThemedView` + `ThemedText` + `expo-image`.
```ts
type MessageBubbleProps = {
  text?: string;
  imageUrl?: string;
  direction: 'sent' | 'received';
  timeLabel?: string;
  moderation?: ModerationState;  // 'removed' → placeholder
};
```

### SwapListingCard
**When to use:** a swap-board listing card.
**Composes:** `Card` + `Thumbnail` + `ThemedText` + `Pill` (status) + `Button` (message).
```ts
type SwapListingCardProps = {
  listing: {
    id: ID;
    title: string;
    thumbUrl?: string;
    author: GardenerRef;
    status: 'open' | 'claimed' | 'closed';
    species?: SpeciesRef;
  };
  onPress: (listingId: ID) => void;
  onMessage: (listingId: ID) => void;
};
```

### ChallengeCard
**When to use:** a community challenge summary.
**Composes:** `Card` + `ThemedText` + `Pill` (active/ended).
```ts
type ChallengeCardProps = {
  challenge: { id: ID; title: string; description: string; dateRangeLabel: string; active: boolean };
  onPress: (challengeId: ID) => void;
};
```

### NotificationRow
**When to use:** an item in the unified Notifications screen (Care / Community / System).
**Composes:** `Icon`/`Avatar` + `ThemedText` + unread dot.
```ts
type NotificationRowProps = {
  notification: {
    id: ID;
    kind: 'care' | 'community' | 'system';
    title: string;
    body: string;
    atLabel: string;
    read: boolean;
  };
  onPress: (id: ID) => void;  // deep-links via entityRef
};
```

### PaywallSheet
**When to use:** the contextual upgrade gate, raised at a cap (2nd Location, 6th plant, ID cap,
Dr. Plant, posting) and from Profile "Update subscription".
**Composes:** `BottomSheet` + `ThemedText` + feature list + `Button` (subscribe/restore).
```ts
type PaywallSheetProps = {
  visible: boolean;
  trigger: PaywallTrigger;    // drives the headline/limit copy
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
  onRestore: () => void;
  onDismiss: () => void;
};
```

### MemorialPlantCard
**When to use:** an archived/lost plant in Profile › Memorial (read-only).
**Composes:** `Card` + `Thumbnail` + `ThemedText` + `Pill`.
```ts
type MemorialPlantCardProps = {
  plant: PlantSummary & { status: Exclude<PlantStatus, 'alive'>; goneAtLabel?: string };
  onPress: (plantId: ID) => void;
};
```

### OffboardSheet
**When to use:** the empathetic "mark as gone" flow (cause picker → archive).
**Composes:** `BottomSheet` + `Chip` (cause) + `TextField` (detail) + `Button`.
```ts
type OffboardReason = 'died' | 'gave-away' | 'other';
type OffboardSheetProps = {
  visible: boolean;
  plantName: string;
  onDismiss: () => void;
  onConfirm: (input: { reason: OffboardReason; detail?: string }) => void;
};
```

---

# Tier 3 · Chrome & states

### AppHeader
**When to use:** the top header for primary tabs — title + optional `LocationSwitcher` + search + bell.
**Composes:** `ThemedView` + `ThemedText` + `IconButton` + `SearchField` + `LocationSwitcher`.
```ts
type AppHeaderProps = {
  title: string;
  locationSwitcher?: LocationSwitcherProps;  // Garden only
  onPressSearch?: () => void;
  onPressBell: () => void;
  bellBadgeCount?: number;
  trailing?: React.ReactNode;  // e.g. DM icon on Community
};
```

### ScreenHeader
**When to use:** the nav bar for pushed (non-tab) screens — Notifications, Paywall, Dr. Plant.
**Composes:** `IconButton` (back) + `ThemedText`.
```ts
type ScreenHeaderProps = {
  title: string;
  onBack: () => void;
  trailing?: React.ReactNode;
};
```

### CenterFAB
**When to use:** the center camera FAB in the tab bar; **smart per surface** (capture / plant-actions
/ compose) and hidden on Profile.
**Composes:** `Pressable` + `Icon` (opens an `ActionSheet` or navigates per `mode`).
```ts
type CenterFABProps = {
  mode: 'capture' | 'plant-actions' | 'compose' | 'hidden';
  onPress: () => void;        // host decides the sheet/route for the mode
  icon?: IconName;            // default camera
  accessibilityLabel?: string;
};
```

### EmptyState
**When to use:** any "nothing here yet" surface — caught-up Today, empty Garden/Space, empty feed,
no Locations.
**Composes:** `Icon` + `ThemedText` + `Button` (CTA).
```ts
type EmptyStateProps = {
  icon?: IconName;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
};
```

### Skeleton
**When to use:** loading placeholders for cards/rows/lists before data resolves.
**Composes:** `ThemedView` + shimmer (Reanimated).
```ts
type SkeletonProps = {
  variant: 'card' | 'row' | 'text' | 'avatar' | 'image';
  count?: number;             // repeat N placeholders
};
```

### PendingSyncBadge
**When to use:** mark items queued in the offline MMKV write-queue ("pending sync").
**Composes:** `Pill` + `Icon`.
```ts
type PendingSyncBadgeProps = {
  state: 'pending' | 'syncing' | 'failed';
  onRetry?: () => void;       // when failed
};
```

### ErrorRetry
**When to use:** a recoverable failure surface — AI vendor outage ("couldn't reach our botanist"),
query failure.
**Composes:** `Icon` + `ThemedText` + `Button` (retry).
```ts
type ErrorRetryProps = {
  title?: string;
  message: string;
  onRetry: () => void;
};
```

### ModerationActionSheet
**When to use:** the Report / Block / Mute menu exposed on every post, comment, DM, user, listing.
**Composes:** `ActionSheet`.
```ts
type ModerationActionSheetProps = {
  visible: boolean;
  target: { type: ReportTargetType; id: ID };
  onReport: (target: { type: ReportTargetType; id: ID }, reason: string) => void;
  onBlock: (target: { type: ReportTargetType; id: ID }) => void;
  onMute: (target: { type: ReportTargetType; id: ID }) => void;
  onDismiss: () => void;
};
```

### PermissionPrimer
**When to use:** the in-context pre-permission explainer shown before the OS prompt (camera, location,
push).
**Composes:** `Icon` + `ThemedText` + `Button` (allow / not now).
```ts
type PermissionPrimerProps = {
  visible: boolean;
  permission: 'camera' | 'location' | 'push' | 'photos';
  title: string;
  rationale: string;
  onAllow: () => void;        // triggers the real OS request
  onSkip: () => void;
};
```

---

# Tier 4 · Handoff-revealed components

> Components the 29 shipped screens require that weren't in v1. Same contract (When to use ·
> Composes · props). They lean on Tier 0 (`NeuSurface`/`NeuPressable`).

### NavRow
**When to use:** the ubiquitous `.row` list item — icon + label (+ value/subtitle) + chevron.
Backs settings, account, about, permissions, locations lists.
**Composes:** `NeuPressable` + `Icon` + `ThemedText`.
```ts
type NavRowProps = {
  label: string;
  leadingIcon?: IconName;
  value?: string;             // trailing value/subtitle
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;      // e.g. "Delete account"
  trailing?: React.ReactNode; // e.g. a Toggle
};
```

### OAuthButton
**When to use:** the provider sign-in buttons on Login (Google · Apple · email magic link).
**Composes:** `NeuPressable` + `Icon` + `ThemedText`.
```ts
type OAuthButtonProps = {
  provider: 'google' | 'apple' | 'email';
  onPress: () => void;
  loading?: boolean;
};
```

### StepScaffold
**When to use:** the shared shell for every onboarding/location-setup step — `StepProgress`
header, title/subtitle, slot for the step body, and a sticky Back/Next footer.
**Composes:** `NeuSurface` + `StepProgress` + `ThemedText` + `Button`.
```ts
type StepScaffoldProps = {
  step: number;               // 1-based
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;  // the step's inputs
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;         // "Next" | "All set"
  nextDisabled?: boolean;
  canSkip?: boolean;
  onSkip?: () => void;
};
```

### LoopRow
**When to use:** the onboarding/welcome "product loop" rows (Identify · Care · Diagnose · Connect)
— icon + label + description + step number.
**Composes:** `NeuSurface` + `Icon` + `ThemedText`.
```ts
type LoopRowProps = {
  icon: IconName;
  label: string;
  description: string;
  index: number;
};
```

### CityClimateSearch
**When to use:** onboarding climate step — search a city and preview its live climate.
**Composes:** `SearchField` + `NeuSurface` (result list) + `ThemedText`.
```ts
type CityResult = { id: ID; label: string; lat: number; lon: number };
type ClimatePreview = { tempLabel: string; zoneLabel: string; icon: IconName };
type CityClimateSearchProps = {
  query: string;
  onChangeQuery: (q: string) => void;
  results: CityResult[];
  onSelectCity: (city: CityResult) => void;
  selected?: CityResult;
  preview?: ClimatePreview;   // shown once a city is chosen
  onUseDeviceLocation?: () => void;
};
```

### StatGrid
**When to use:** the 3-up stats block on Profile (plants · streak · tasks done).
**Composes:** `NeuSurface` + `ThemedText`.
```ts
type StatGridProps = {
  stats: { label: string; value: string | number }[];
};
```

### GradientCover
**When to use:** the deterministic gradient placeholder used as a plant/photo cover when there's
no image (the handoff's `COV[]` palette). Falls back to `expo-image` when a `uri` exists.
**Composes:** `expo-linear-gradient` + `expo-image` + `Icon`.
```ts
type GradientCoverProps = {
  uri?: string;               // real image wins; else gradient
  seed?: number | string;     // picks a stable gradient from the palette
  placeholderIcon?: IconName; // 📸 / 🌿 equivalent
  aspectRatio?: number;
};
```

### ConfidenceMeter
**When to use:** the capture/identify confidence-gating visual (high/med/low bands) — the larger
sibling of `ConfidencePill` shown on the result hero.
**Composes:** `NeuSurface` + `ThemedText`.
```ts
type ConfidenceMeterProps = {
  confidence: number;         // 0..1 → high/med/low band + copy
};
```

### LegalReader
**When to use:** the shared scroll-progress document reader for Terms / Privacy /
Acknowledgements.
**Composes:** `ScrollView` + `ScrollProgressBar` + `ThemedText`.
```ts
type LegalSection = { heading: string; body: string };
type LegalReaderProps = {
  title: string;
  updatedLabel?: string;      // "Last updated …"
  sections: LegalSection[];
  header?: React.ReactNode;   // e.g. Privacy's data-at-a-glance card
};
```

### ScrollProgressBar
**When to use:** the thin top progress bar that fills as the user scrolls a long reader.
**Composes:** Reanimated (driven by scroll offset).
```ts
type ScrollProgressBarProps = {
  progress: number;           // 0..1 (from scroll offset)
};
```

### DataGlanceCard
**When to use:** the Privacy "data at a glance" summary card.
**Composes:** `NeuSurface` + `Icon` + `ThemedText`.
```ts
type DataGlanceItem = { icon: IconName; label: string; detail: string };
type DataGlanceCardProps = { items: DataGlanceItem[] };
```

### PermissionRow
**When to use:** a row on the Permissions screen — what's accessed, why, current status, toggle to
re-request/open settings. (Distinct from `PermissionPrimer`, the pre-prompt explainer.)
**Composes:** `NeuSurface` + `Icon` + `ThemedText` + `Button`/`Toggle`.
```ts
type PermissionRowProps = {
  permission: 'camera' | 'location' | 'push' | 'photos';
  title: string;
  why: string;
  status: 'granted' | 'denied' | 'undetermined';
  onPressManage: () => void;  // request or open OS settings
};
```

### StarRating
**When to use:** the Rate screen's 1–5 star input that routes to the App Store (high) or in-app
feedback (low).
**Composes:** `NeuPressable` + `Icon`.
```ts
type StarRatingProps = {
  value: number;              // 0–5
  onChange: (value: number) => void;
  max?: number;               // default 5
};
```

### BlockedRow
**When to use:** a row in Blocked Accounts — avatar + handle + Unblock.
**Composes:** `Avatar` + `ThemedText` + `Button`.
```ts
type BlockedRowProps = {
  user: GardenerRef;
  onUnblock: (userId: ID) => void;
};
```

### ReportForm
**When to use:** the Report Abuse screen — names the reported subject and collects a reason.
**Composes:** `NeuSurface` + `Chip`/radio + `TextField` + `Button`.
```ts
type ReportReason =
  | 'spam' | 'harassment' | 'nudity' | 'misinformation' | 'other';
type ReportFormProps = {
  target: { type: ReportTargetType; id: ID; label: string };  // "@handle" / post preview
  reasons: { value: ReportReason; label: string }[];
  onSubmit: (input: { reason: ReportReason; detail?: string }) => void;
  onCancel: () => void;
};
```

### BrandMark
**When to use:** the animated 8-petal Evergreen flower mark (splash, about, onboarding accents).
**Composes:** `react-native-svg` + Reanimated (bloom/idle rotation).
```ts
type BrandMarkProps = {
  size?: number;
  animate?: 'bloom' | 'idle' | 'none';
  onBloomComplete?: () => void;  // splash → route after bloom
};
```

---

## Notes for implementation

- **Lists:** `PostCard`, `PlantCard` grids, `ConversationRow`, and search results should render in
  `@shopify/flash-list` *(needs adding)* with paginated Convex queries (PRD §10).
- **Sheets:** all `*Sheet` components share the `BottomSheet` base (`@gorhom/bottom-sheet`,
  *needs adding*); keep one provider at the app root.
- **Icons/images:** never import raw vector packs — go through `Icon` (`expo-symbols`) and
  `Thumbnail`/`expo-image`.
- **No styling in this doc by design** — variant/size enums are the styling *API*; concrete values
  live in `src/constants/theme.ts` and each component's implementation.
```

