/** AnimatedRain — a fixed cloud with raindrops that fall and fade on a loop. Used on the
 * plant-detail Humidity card. The cloud stays put; only the drops animate. */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/tokens';

export type AnimatedRainProps = { size?: number; color?: string; strokeWidth?: number };

export function AnimatedRain({ size = 17, color = Palette.ever500, strokeWidth = 2 }: AnimatedRainProps) {
  const t = useSharedValue(0);
  useEffect(() => {
    // gentle, constant-speed fall; opacity fades in/out so each loop is seamless (no snap)
    t.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);

  const drops = useAnimatedStyle(() => ({
    opacity: Math.sin(t.value * Math.PI),
    transform: [{ translateY: t.value * 3 }],
  }));

  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <View style={{ width: size, height: size }}>
      {/* fixed cloud */}
      <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute' }}>
        <Path d="M7 13a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 13Z" {...stroke} />
      </Svg>
      {/* animated drops */}
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, drops]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M8 16.5l-1 3M12 16.5l-1 3M16 16.5l-1 3" {...stroke} />
        </Svg>
      </Animated.View>
    </View>
  );
}
