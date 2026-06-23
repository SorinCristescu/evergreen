/** AnimatedSnow — a fixed cloud with snowflakes that drift down and fade on a loop. Mirrors
 * AnimatedRain but with softer, swaying flakes. */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

export type AnimatedSnowProps = { size?: number; cloudColor?: string; flakeColor?: string };

export function AnimatedSnow({ size = 24, cloudColor = '#8aa6b8', flakeColor = '#cfe2f2' }: AnimatedSnowProps) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);

  const flakes = useAnimatedStyle(() => ({
    opacity: Math.sin(t.value * Math.PI),
    transform: [{ translateY: t.value * 4 }, { translateX: Math.sin(t.value * Math.PI * 2) * (size * 0.03) }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute' }}>
        <Path d="M7 13a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 13Z" stroke={cloudColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, flakes]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={8} cy={17.5} r={1.1} fill={flakeColor} />
          <Circle cx={12} cy={19} r={1.1} fill={flakeColor} />
          <Circle cx={16} cy={17.5} r={1.1} fill={flakeColor} />
        </Svg>
      </Animated.View>
    </View>
  );
}
