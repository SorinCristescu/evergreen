/**
 * Icon — single wrapper over the react-native-svg icon registry (components.md Tier 1).
 * The handoff's inline stroke SVGs live in `icons/registry.tsx`; `IconName` is its keys.
 */
import Svg from 'react-native-svg';

import { ICONS, type IconName } from '@/components/icons/registry';
import { useTheme } from '@/theme';

export type { IconName };

type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'spark' | 'warning' | 'danger' | 'inverse';

export type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  tone?: Tone;
  color?: string; // overrides tone
  filled?: boolean;
  accessibilityLabel?: string;
};

export function Icon({
  name,
  size = 22,
  strokeWidth = 2,
  tone = 'default',
  color,
  filled = false,
  accessibilityLabel,
}: IconProps) {
  const theme = useTheme();
  const TONE: Record<Tone, string> = {
    default: theme.fg,
    muted: theme.fgMuted,
    subtle: theme.fgSubtle,
    accent: theme.ever500,
    spark: theme.terra,
    warning: theme.warning,
    danger: theme.danger,
    inverse: theme.white,
  };
  const c = color ?? TONE[tone];
  const render = ICONS[name];
  if (!render) {
    if (__DEV__) console.warn(`Icon: unknown name "${name}"`);
    return null;
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
    >
      {render({ stroke: c, fill: c, strokeWidth, filled })}
    </Svg>
  );
}
