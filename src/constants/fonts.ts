/**
 * Font wiring for Evergreen.
 *
 * Body  → Inter (Google Fonts)         · @expo-google-fonts/inter
 * Mono  → JetBrains Mono (Google Fonts) · @expo-google-fonts/jetbrains-mono
 * Display → General Sans (Fontshare, NOT on Google Fonts)
 *
 * General Sans isn't installable from npm. Until its TTFs are bundled, `display` falls back to
 * Inter's heavier weights. To enable the real face:
 *   1. drop GeneralSans-Semibold.ttf / GeneralSans-Bold.ttf into `assets/fonts/`
 *   2. add them to `EXTRA_FONTS` below and flip `GENERAL_SANS_BUNDLED = true`.
 */
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';

const GENERAL_SANS_BUNDLED = false; // flip to true once assets/fonts/GeneralSans-*.ttf exist

const EXTRA_FONTS: Record<string, number> = GENERAL_SANS_BUNDLED
  ? {
      // 'GeneralSans-Semibold': require('@/../assets/fonts/GeneralSans-Semibold.ttf'),
      // 'GeneralSans-Bold': require('@/../assets/fonts/GeneralSans-Bold.ttf'),
    }
  : {};

export const BASE_FONTS = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  JetBrainsMono_500Medium,
  ...EXTRA_FONTS,
};

/** Load all app fonts; returns [loaded, error]. Call once at the root. */
export function useAppFonts() {
  return useFonts(BASE_FONTS);
}

type Family = 'display' | 'body' | 'mono';
type Weight = '400' | '500' | '600' | '700';

/** Resolve a loaded font-family name for a (family, weight) pair. */
export function fontFamily(family: Family, weight: Weight = '400'): string {
  if (family === 'mono') return 'JetBrainsMono_500Medium';
  if (family === 'display') {
    if (GENERAL_SANS_BUNDLED) return weight === '700' ? 'GeneralSans-Bold' : 'GeneralSans-Semibold';
    // fallback: Inter heavy weights stand in for General Sans display
    return weight === '700' ? 'Inter_700Bold' : 'Inter_600SemiBold';
  }
  // body → Inter
  switch (weight) {
    case '700':
      return 'Inter_700Bold';
    case '600':
      return 'Inter_600SemiBold';
    case '500':
      return 'Inter_500Medium';
    default:
      return 'Inter_400Regular';
  }
}
