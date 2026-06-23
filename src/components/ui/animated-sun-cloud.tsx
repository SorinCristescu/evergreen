/** AnimatedSunCloud — partly-cloudy glyph: a slowly spinning sun (upper-left) peeking out from
 * behind a cloud (lower-right) that gently drifts. Composes AnimatedSun with a drifting cloud. */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AnimatedSun } from '@/components/ui/animated-sun';
import { Palette } from '@/constants/tokens';

export type AnimatedSunCloudProps = { size?: number; cloudColor?: string; sunColor?: string };

export function AnimatedSunCloud({ size = 24, cloudColor = '#8aa6b8', sunColor = Palette.sun }: AnimatedSunCloudProps) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(drift);
  }, [drift]);
  const cloudStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (drift.value - 0.5) * (size * 0.06) }] }));

  return (
    <View style={{ width: size, height: size }}>
      {/* sun, upper-left */}
      <View style={{ position: 'absolute', left: size * 0.02, top: 0, width: size * 0.52, height: size * 0.52 }}>
        <AnimatedSun size={size * 0.52} color={sunColor} />
      </View>
      {/* cloud, lower-right (drifts) */}
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, cloudStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M9.5 19a3.4 3.4 0 0 1 .3-6.8 4.6 4.6 0 0 1 8.7 1.2A2.9 2.9 0 0 1 17.2 19Z"
            stroke={cloudColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
