/**
 * Evergreen design tokens — the single source of truth for the pixel-faithful neumorphic UI.
 * Mirrors `docs/design/evergreen-mobile-app-design/DESIGN-MANIFEST.json` (the CSS `:root` vars).
 * Consumed by component implementations only (per components.md, props never carry style values).
 */

// ── Color palette (--ever-*, --leaf, --terra, --sun, --fg*) ───────────────────
export const Palette = {
  ever100: '#d8e9df', // light surface — most interactive UI sits here
  ever400: '#4daf82',
  ever500: '#2c694e', // forest green (brand)
  ever700: '#1b4332', // deep green
  ever900: '#0c1f17', // near-black dark canvas (splash)
  leaf: '#3e7c4f', // secondary green
  terra: '#c76b4f', // terracotta — the single "spark" (streaks/celebration)
  sun: '#f5c451', // warm yellow accent
  warning: '#b5821f',
  danger: '#b3402f',
  fg: '#16271e', // primary text
  fgMuted: '#4b6357', // secondary text
  fgSubtle: '#7d9488', // tertiary text
  accentTint: 'rgba(46,109,78,0.12)',
  white: '#ffffff',
  // Raised dual-shadow: dark drop (bottom-right) + light highlight (top-left). Matches the
  // handoff --neu-raised exactly (paintInside is off, so 0.80 highlight reads as a soft glow).
  shadowDark: 'rgba(11,30,21,0.13)',
  shadowDarkSm: 'rgba(11,30,21,0.12)',
  shadowLight: 'rgba(255,255,255,0.80)',
  shadowLightSm: 'rgba(255,255,255,0.78)',
  // Inset / recessed wells (faked with gradients — react-native-shadow-2 has no inset).
  shadowInsetDark: 'rgba(11,30,21,0.16)',
  shadowInsetLight: 'rgba(255,255,255,0.70)',
  insetHairline: 'rgba(11,30,21,0.10)',
  insetFill: '#d2e4d8',
} as const;

// ── Themeable color sets (light / dark) ──────────────────────────────────────
// Consumed reactively via `useTheme()`. Accent colors (ever400/500, leaf, terra, sun,
// warning, danger, white) AND the dark canvas `ever900` are identical across themes —
// only surfaces, text layers, accentTint, inset fills and the neumorphic shadows flip.
// Dark values mirror evergreen-profile.html's `.screen.dark { … }` block.
export type ThemeName = 'light' | 'dark';

export type ThemeColors = {
  /** Page background behind all content (light: == ever100; dark: the deep splash canvas). */
  canvas: string;
  ever100: string;
  ever400: string;
  ever500: string;
  ever700: string;
  ever900: string;
  leaf: string;
  terra: string;
  sun: string;
  warning: string;
  danger: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  accentTint: string;
  white: string;
  insetFill: string;
  insetHairline: string;
  shadowInsetDark: string;
  shadowInsetLight: string;
  neuRaised: string;
  neuRaisedSm: string;
  neuPressed: string;
  scheme: ThemeName;
};

// Colors that never change between themes (brand accents + the always-dark canvas).
const STATIC_COLORS = {
  ever400: '#4daf82',
  ever500: '#2c694e',
  ever900: '#0c1f17', // always-dark canvas (splash, dark accent cards) — not a text color
  leaf: '#3e7c4f',
  terra: '#c76b4f',
  sun: '#f5c451',
  warning: '#b5821f',
  danger: '#b3402f',
  white: '#ffffff',
} as const;

export const lightColors: ThemeColors = {
  ...STATIC_COLORS,
  canvas: '#d8e9df', // light: page background matches the surface (classic neumorphism)
  ever100: '#d8e9df',
  ever700: '#1b4332',
  fg: '#16271e',
  fgMuted: '#4b6357',
  fgSubtle: '#7d9488',
  accentTint: 'rgba(46,109,78,0.12)',
  insetFill: '#d2e4d8',
  insetHairline: 'rgba(11,30,21,0.10)',
  shadowInsetDark: 'rgba(11,30,21,0.16)',
  shadowInsetLight: 'rgba(255,255,255,0.70)',
  neuRaised: '6px 6px 14px rgba(11,30,21,0.13), -5px -5px 12px rgba(255,255,255,0.55)',
  neuRaisedSm: '4px 4px 9px rgba(11,30,21,0.12), -4px -4px 8px rgba(255,255,255,0.52)',
  neuPressed: 'inset 4px 4px 9px rgba(11,30,21,0.13), inset -4px -4px 9px rgba(255,255,255,0.55)',
  scheme: 'light',
};

export const darkColors: ThemeColors = {
  ...STATIC_COLORS,
  canvas: '#081811', // dark: deep splash-canvas behind every screen
  ever100: '#0e221a', // dark surface (cards/controls lift off the deeper canvas)
  ever700: '#bfe3cf', // light green — for text/icons that sat on light surfaces
  fg: '#eaf3ed',
  fgMuted: '#9fd4ba',
  fgSubtle: '#6f9a85',
  accentTint: 'rgba(77,175,130,0.2)',
  insetFill: '#0b1c15',
  insetHairline: 'rgba(0,0,0,0.28)',
  shadowInsetDark: 'rgba(0,0,0,0.45)',
  shadowInsetLight: 'rgba(255,255,255,0.045)',
  neuRaised: '6px 6px 14px rgba(0,0,0,0.42), -5px -5px 12px rgba(255,255,255,0.045)',
  neuRaisedSm: '4px 4px 9px rgba(0,0,0,0.4), -3px -3px 8px rgba(255,255,255,0.04)',
  neuPressed: 'inset 4px 4px 9px rgba(0,0,0,0.45), inset -3px -3px 8px rgba(255,255,255,0.045)',
  scheme: 'dark',
};

export const Themes: Record<ThemeName, ThemeColors> = { light: lightColors, dark: darkColors };

// Semantic light theme (the app's default surface). Dark theme handled separately when needed.
export const Theme = {
  background: Palette.ever100,
  surface: Palette.ever100,
  surfaceDark: Palette.ever900,
  fg: Palette.fg,
  fgMuted: Palette.fgMuted,
  fgSubtle: Palette.fgSubtle,
  brand: Palette.ever500,
  brandDeep: Palette.ever700,
  leaf: Palette.leaf,
  spark: Palette.terra,
  sun: Palette.sun,
  warning: Palette.warning,
  danger: Palette.danger,
  accentTint: Palette.accentTint,
} as const;

// ── Confidence bands (AI identify/diagnose; ADR-0002 cardinal-sin guardrail) ──
export const Confidence = {
  high: { min: 0.75, color: Palette.ever500, label: 'High confidence' },
  medium: { min: 0.5, color: Palette.warning, label: 'Some confidence' },
  low: { min: 0, color: Palette.danger, label: 'Not sure yet' },
} as const;

// ── Spacing rhythm ────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** Extra breathing room added above every standard screen's header/top content.
 *  Applied via the shared AppHeader/ScreenHeader and the hand-rolled tops. Excludes the
 *  splash and the camera (take-photo) screen, whose layouts are full-bleed by design. */
export const ScreenTopExtra = 50;

// ── Border radii (soft UI: 15–20px on major surfaces) ────────────────────────
export const Radius = {
  sm: 10,
  md: 15,
  lg: 20,
  pill: 999,
  full: 9999,
} as const;

// ── Touch target ──────────────────────────────────────────────────────────────
export const HIT = 44; // --hit

// ── Type scale (font families resolved in constants/fonts.ts) ────────────────
export const Type = {
  display1: { size: 30, lineHeight: 36, weight: '700' as const, family: 'display' as const },
  display2: { size: 24, lineHeight: 30, weight: '600' as const, family: 'display' as const },
  title: { size: 20, lineHeight: 26, weight: '600' as const, family: 'display' as const },
  subtitle: { size: 17, lineHeight: 24, weight: '600' as const, family: 'body' as const },
  body: { size: 15, lineHeight: 22, weight: '400' as const, family: 'body' as const },
  bodyBold: { size: 15, lineHeight: 22, weight: '600' as const, family: 'body' as const },
  small: { size: 13, lineHeight: 18, weight: '400' as const, family: 'body' as const },
  // JetBrains Mono — metadata/counts, often uppercase + tracked
  meta: { size: 11, lineHeight: 14, weight: '500' as const, family: 'mono' as const, letterSpacing: 0.5 },
  metaSm: { size: 9, lineHeight: 12, weight: '500' as const, family: 'mono' as const, letterSpacing: 0.6 },
} as const;
export type TypeVariant = keyof typeof Type;

// ── Motion (GSAP timings reinterpreted in Reanimated) ────────────────────────
export const Motion = {
  fast: 180,
  base: 340,
  slow: 550,
  stagger: 60, // per-item entrance offset
} as const;

// ── Neumorphic shadow presets (consumed by NeuSurface via react-native-shadow-2) ──
// Each preset is a pair of stacked shadow layers: a dark drop (bottom-right) + a light
// highlight (top-left). Dark is listed first (inner Shadow), light second (outer Shadow).
// `paintInside: false` is critical — the surface is opaque, and painting inside makes the
// light layer render an opaque white ghost offset top-left (the old "messy halo" bug).
export type NeuLayer = {
  color: string;
  distance: number;
  offset: [number, number];
  paintInside?: boolean;
};
export const Neu: Record<'raised' | 'raisedSm', NeuLayer[]> = {
  raised: [
    { color: Palette.shadowDark, distance: 14, offset: [6, 6], paintInside: false },
    { color: Palette.shadowLight, distance: 13, offset: [-6, -6], paintInside: false },
  ],
  raisedSm: [
    { color: Palette.shadowDarkSm, distance: 9, offset: [4, 4], paintInside: false },
    { color: Palette.shadowLightSm, distance: 9, offset: [-4, -4], paintInside: false },
  ],
};

// Exact handoff box-shadows (CSS strings) — applied via the native `boxShadow` style prop, which
// RN 0.85 (New Arch) and react-native-web both support, INCLUDING `inset`. This reproduces
// `--neu-raised`, `--neu-raised-sm`, and `--neu-pressed` 1:1 from the HTML.
export const NeuShadow = {
  raised: '6px 6px 14px rgba(11,30,21,0.13), -5px -5px 12px rgba(255,255,255,0.55)',
  raisedSm: '4px 4px 9px rgba(11,30,21,0.12), -4px -4px 8px rgba(255,255,255,0.52)',
  pressed: 'inset 4px 4px 9px rgba(11,30,21,0.13), inset -4px -4px 9px rgba(255,255,255,0.55)',
} as const;

// Recessed "well" config (consumed by InsetWell in neu-surface.tsx). Two diagonal gradients:
// a dark band hugging the top-left and a light band hugging the bottom-right — the inverse of
// a raised lift — read as a carved-in well on the ever100 surface. Always neutral, never green.
export const NeuInset = {
  dark: Palette.shadowInsetDark,
  light: Palette.shadowInsetLight,
  hairline: Palette.insetHairline,
  fill: Palette.insetFill,
  start: { x: 0, y: 0 } as const,
  end: { x: 1, y: 1 } as const,
  darkLocations: [0, 0.55] as [number, number],
  lightLocations: [0.45, 1] as [number, number],
} as const;

// Deterministic gradient covers (handoff COV[] palette) — used by GradientCover.
export const CoverGradients: [string, string][] = [
  ['#3a8c66', '#1c4d39'],
  ['#5bb389', '#2c6e51'],
  ['#2c694e', '#15382a'],
  ['#79c6a0', '#3a8c66'],
  ['#48876a', '#23503c'],
  ['#8fd0b2', '#4daf82'],
];

export function coverForSeed(seed: number | string): [string, string] {
  const n =
    typeof seed === 'number'
      ? seed
      : Array.from(String(seed)).reduce((a, c) => a + c.charCodeAt(0), 0);
  return CoverGradients[n % CoverGradients.length];
}

// Bundled plant photos used as a deterministic stand-in cover for community posts that
// don't carry an uploaded photo (e.g. seeded/dev feed). Indexed by post seed so each card
// reliably shows the same plant.
export const CommunityPlantPhotos = [
  require('../../assets/images/community/post-1.jpg'),
  require('../../assets/images/community/post-2.jpg'),
  require('../../assets/images/community/post-3.jpg'),
  require('../../assets/images/community/post-4.jpg'),
  require('../../assets/images/community/post-5.jpg'),
  require('../../assets/images/community/post-6.jpg'),
] as const;

export function plantPhotoForSeed(seed: number | string): (typeof CommunityPlantPhotos)[number] {
  const n =
    typeof seed === 'number'
      ? seed
      : Array.from(String(seed)).reduce((a, c) => a + c.charCodeAt(0), 0);
  return CommunityPlantPhotos[n % CommunityPlantPhotos.length];
}
