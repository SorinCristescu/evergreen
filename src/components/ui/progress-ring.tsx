/** ProgressRing — circular completion indicator (Today hero). 64px default per handoff.
 * The arc eases smoothly to its target whenever progress changes. */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = {
  progress: number; // 0..1
  size?: number;
  label?: string; // center text, e.g. "1/6"
  caption?: string;
};

export function ProgressRing({ progress, size = 64, label, caption }: ProgressRingProps) {
  const t = useTheme();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  const offset = useSharedValue(c);
  useEffect(() => {
    offset.value = withTiming(c * (1 - clamped), { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [offset, c, clamped]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Palette.ever500} />
            <Stop offset="1" stopColor={Palette.ever400} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(22,39,30,0.10)" strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {label ? (
          <AppText variant="meta" color={t.ever700} style={{ fontSize: 10.5, lineHeight: 12 }}>
            {label}
          </AppText>
        ) : null}
        {caption ? (
          <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 10.5, marginTop: 1 }}>
            {caption}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
