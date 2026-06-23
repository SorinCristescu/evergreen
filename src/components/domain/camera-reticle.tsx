/** CameraReticle — the four L-bracket viewfinder corners with the handoff's idle pulse.
 * Mirrors evergreen-capture-identify.html: gsap.to(reticle,{scale:1.04,duration:1.8,
 * ease:'sine.inOut',yoyo:true,repeat:-1}). Shared by the Identify/Dr. Plant capture screen
 * and the onboarding "Identify your first plant" camera step. */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export type CameraReticleProps = {
  /** Outer square size in px (handoff uses 208). */
  size?: number;
  /** Corner bracket arm length (handoff uses 30). */
  arm?: number;
  /** Border thickness (handoff uses 2.5). */
  weight?: number;
  /** Outer corner radius (handoff uses 14). */
  radius?: number;
  color?: string;
};

/** One corner of the L-bracket reticle. */
function Bracket({
  corner,
  arm,
  weight,
  radius,
  color,
}: {
  corner: 'tl' | 'tr' | 'bl' | 'br';
  arm: number;
  weight: number;
  radius: number;
  color: string;
}) {
  const sides: Record<typeof corner, object> = {
    tl: { top: 0, left: 0, borderTopWidth: weight, borderLeftWidth: weight, borderTopLeftRadius: radius },
    tr: { top: 0, right: 0, borderTopWidth: weight, borderRightWidth: weight, borderTopRightRadius: radius },
    bl: { bottom: 0, left: 0, borderBottomWidth: weight, borderLeftWidth: weight, borderBottomLeftRadius: radius },
    br: { bottom: 0, right: 0, borderBottomWidth: weight, borderRightWidth: weight, borderBottomRightRadius: radius },
  };
  return <View style={[{ position: 'absolute', width: arm, height: arm, borderColor: color }, sides[corner]] as object} />;
}

export function CameraReticle({
  size = 208,
  arm = 30,
  weight = 2.5,
  radius = 14,
  color = 'rgba(255,255,255,0.9)',
}: CameraReticleProps) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(scale);
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Bracket corner="tl" arm={arm} weight={weight} radius={radius} color={color} />
      <Bracket corner="tr" arm={arm} weight={weight} radius={radius} color={color} />
      <Bracket corner="bl" arm={arm} weight={weight} radius={radius} color={color} />
      <Bracket corner="br" arm={arm} weight={weight} radius={radius} color={color} />
    </Animated.View>
  );
}
