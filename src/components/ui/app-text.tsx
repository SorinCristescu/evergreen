/**
 * AppText — typography primitive bound to the Evergreen type scale + font families.
 * Sets fontFamily (which encodes weight) — never fontWeight — to avoid faux-bold on Android.
 */
import { Text, type TextProps, type TextStyle } from 'react-native';

import { fontFamily } from '@/constants/fonts';
import { Type, type TypeVariant } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Tone = 'default' | 'muted' | 'subtle' | 'brand' | 'spark' | 'danger' | 'warning' | 'inverse';

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  tone?: Tone;
  color?: string;
  align?: TextStyle['textAlign'];
  uppercase?: boolean;
};

export function AppText({
  variant = 'body',
  tone = 'default',
  color,
  align,
  uppercase,
  style,
  ...rest
}: AppTextProps) {
  const c = useTheme();
  const TONE: Record<Tone, string> = {
    default: c.fg,
    muted: c.fgMuted,
    subtle: c.fgSubtle,
    brand: c.ever500,
    spark: c.terra,
    danger: c.danger,
    warning: c.warning,
    inverse: c.white,
  };
  const t = Type[variant];
  const resolved: TextStyle = {
    fontFamily: fontFamily(t.family, t.weight),
    fontSize: t.size,
    lineHeight: t.lineHeight,
    color: color ?? TONE[tone],
    textAlign: align,
    letterSpacing: 'letterSpacing' in t ? (t as { letterSpacing: number }).letterSpacing : undefined,
    textTransform: uppercase ? 'uppercase' : undefined,
  };
  return <Text style={[resolved, style]} {...rest} />;
}
