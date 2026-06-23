/**
 * Tier 0 — the neumorphic substrate everything composes (components.md §Tier 0).
 *
 * NeuSurface   — non-interactive raised / raised-sm / pressed (inset) / flat surface.
 * NeuPressable — interactive control that recesses (inset) while held.
 * InsetWell    — neutral recessed well (inputs, segmented tracks, toggles, radios).
 *
 * Shadows use the native `boxShadow` style prop with the EXACT handoff CSS strings
 * (`NeuShadow` in tokens). RN 0.85 (New Architecture) and react-native-web both support
 * `boxShadow` including `inset`, so raised + recessed render 1:1 with the design — no
 * react-native-shadow-2 approximation, and full-width cards "just work" (plain View).
 */
import { useMemo, useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Motion, Radius } from '@/constants/tokens';
import { useTheme } from '@/theme';
import type { ThemeColors } from '@/constants/tokens';

type Elevation = 'raised' | 'raised-sm' | 'pressed' | 'flat';
type RadiusKey = keyof typeof Radius;
type RadiusProp = RadiusKey | number;

function radiusValue(r: RadiusProp): number {
  return typeof r === 'number' ? r : Radius[r];
}

function shadowFor(elevation: Elevation, c: ThemeColors): string | undefined {
  switch (elevation) {
    case 'raised':
      return c.neuRaised;
    case 'raised-sm':
      return c.neuRaisedSm;
    case 'pressed':
      return c.neuPressed;
    default:
      return undefined; // flat
  }
}

/** Neutral recessed well — a rounded box with the exact inset neumorphic shadow. */
export function InsetWell({
  radius = Radius.md,
  backgroundColor,
  style,
  children,
  accessibilityLabel,
}: {
  radius?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const c = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ backgroundColor: backgroundColor ?? c.ever100, borderRadius: radius, boxShadow: c.neuPressed } as ViewStyle, style]}
    >
      {children}
    </View>
  );
}

export type NeuSurfaceProps = {
  children: React.ReactNode;
  elevation?: Elevation;
  radius?: RadiusProp;
  /** kept for API compatibility; boxShadow is cheap so this is a no-op now */
  flatten?: boolean;
  /** fill the parent's cross-axis (cards/rows). */
  stretch?: boolean;
  backgroundColor?: string;
  style?: ViewStyle; // layout only (size/padding); not a design-token escape hatch
  accessibilityLabel?: string;
};

export function NeuSurface({
  children,
  elevation = 'raised',
  radius = 'md',
  stretch = false,
  backgroundColor,
  style,
  accessibilityLabel,
}: NeuSurfaceProps) {
  const c = useTheme();
  const br = radiusValue(radius);
  const shadow = shadowFor(elevation, c);
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        { backgroundColor: backgroundColor ?? c.ever100, borderRadius: br },
        shadow ? ({ boxShadow: shadow } as ViewStyle) : null,
        stretch ? { alignSelf: 'stretch' } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type NeuPressableProps = {
  children: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  elevation?: 'raised' | 'raised-sm';
  radius?: RadiusProp;
  disabled?: boolean;
  stretch?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  accessibilityRole?: 'button' | 'link' | 'tab';
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
};

export function NeuPressable({
  children,
  onPress,
  onLongPress,
  elevation = 'raised',
  radius = 'md',
  disabled = false,
  stretch = false,
  backgroundColor,
  style,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
}: NeuPressableProps) {
  const pressed = useSharedValue(0);
  const [down, setDown] = useState(false);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.02 }],
  }));

  // raised at rest; recessed (inset) while held — mirrors the handoff `:active` neumorphism.
  const shownElevation = useMemo<Elevation>(
    () => (disabled ? 'flat' : down ? 'pressed' : elevation),
    [disabled, down, elevation],
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={() => {
        setDown(true);
        pressed.value = withTiming(1, { duration: 120 });
      }}
      onPressOut={() => {
        setDown(false);
        pressed.value = withTiming(0, { duration: Motion.fast });
      }}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
    >
      <Animated.View style={[animatedStyle, stretch ? { alignSelf: 'stretch' } : null, disabled ? { opacity: 0.5 } : null]}>
        <NeuSurface
          elevation={shownElevation}
          radius={radius}
          stretch={stretch}
          backgroundColor={backgroundColor}
          style={style}
        >
          {children}
        </NeuSurface>
      </Animated.View>
    </Pressable>
  );
}
