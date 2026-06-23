/**
 * App theming — a reactive light/dark color provider.
 *
 * `useTheme()` returns the active `ThemeColors` (every Palette key, themed). Because the
 * provider sits above the whole tree and nothing here is memoized, flipping the theme
 * re-renders every consumer, so inline `t.ever100` / `t.fg` reads pick up the new palette
 * with no remount (navigation state is preserved).
 *
 * Accent colors (ever400/500, terra, sun, …) are identical across themes, so components that
 * only use accents need no change — only surfaces, text, shadows and inset fills flip.
 */
import { createContext, useContext, useMemo, useState } from 'react';

import { Themes, type ThemeColors, type ThemeName } from '@/constants/tokens';

type ThemeControls = {
  name: ThemeName;
  colors: ThemeColors;
  setName: (name: ThemeName) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeControls>({
  name: 'light',
  colors: Themes.light,
  setName: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children, initial = 'light' }: { children: React.ReactNode; initial?: ThemeName }) {
  const [name, setName] = useState<ThemeName>(initial);
  const value = useMemo<ThemeControls>(
    () => ({
      name,
      colors: Themes[name],
      setName,
      toggle: () => setName((n) => (n === 'light' ? 'dark' : 'light')),
    }),
    [name],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The active themed color set. Use everywhere a color is read in a rendered component. */
export function useTheme(): ThemeColors {
  return useContext(ThemeContext).colors;
}

/** Theme name + setters (for the Profile dark-mode toggle, StatusBar, nav theme). */
export function useThemeControls(): ThemeControls {
  return useContext(ThemeContext);
}
