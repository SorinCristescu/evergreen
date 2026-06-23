/** AnimatedSun — a slowly spinning sun glyph (rays rotate). Matches the handoff weather glyph idle.
 * Used in the Garden subtitle and the Today weather banner. */
import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Palette } from '@/constants/tokens';

export type AnimatedSunProps = { size?: number; color?: string };

export function AnimatedSun({ size = 16, color = Palette.sun }: AnimatedSunProps) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 16000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rot);
  }, [rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <Icon name="sun" size={size} color={color} strokeWidth={1.9} />
    </Animated.View>
  );
}
