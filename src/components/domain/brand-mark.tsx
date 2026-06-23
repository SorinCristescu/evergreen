/** BrandMark — the Evergreen 8-petal mark with the handoff's stagger bloom + living idle.
 *
 * Ports the GSAP timeline from evergreen-splash.html / evergreen-about.html:
 *   1) the heart pops from the centre  (back.out(2.4))
 *   2) each petal staggers outward     (back.out(1.7), stagger 0.085)
 *   3) the whole flower settles into a gentle ±5° living sway  (sine.inOut, 6.5s, yoyo)
 *
 * `animate="bloom"` runs the full sequence then drifts into idle; `animate="idle"` skips
 * straight to the sway; `animate="none"` renders the settled glyph with no motion.
 */
import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

const AEllipse = Animated.createAnimatedComponent(Ellipse);
const ACircle = Animated.createAnimatedComponent(Circle);

const PETALS = ['#2c694e', '#377a5b', '#46866a', '#5fa17f', '#7cbf9b', '#9bd8b9', '#a9dfc6', '#8ed1b1'];

// Timeline (ms) — reinterpreted from the GSAP splash bloom.
const HEART_DELAY = 120;
const HEART_DUR = 700;
const PETAL_BASE = 480;
const PETAL_STAGGER = 85;
const PETAL_DUR = 820;
const BLOOM_END = PETAL_BASE + (PETALS.length - 1) * PETAL_STAGGER + PETAL_DUR; // ≈ 1895

const backOut = (s: number) => Easing.out(Easing.back(s));

export type BrandMarkProps = {
  size?: number;
  animate?: 'bloom' | 'idle' | 'none' | 'loop';
  onBloomComplete?: () => void;
  /** After the bloom finishes, gently sway 0°→+5°→−5°→0° forever (used on the splash). */
  idle?: boolean;
};

/** A single petal that scales + fades in from the flower centre. */
function AnimatedPetal({ index, color, animate }: { index: number; color: string; animate: BrandMarkProps['animate'] }) {
  const bloom = animate === 'bloom';
  const loop = animate === 'loop';
  const scale = useSharedValue(bloom || loop ? 0 : 1);
  const opacity = useSharedValue(bloom || loop ? 0 : 0.9);

  useEffect(() => {
    // Loader: the same staggered bloom, repeated forever — petals open then close in a wave.
    if (loop) {
      const delay = index * PETAL_STAGGER;
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: PETAL_DUR, easing: backOut(1.7) }),
            withTiming(0.18, { duration: PETAL_DUR, easing: Easing.inOut(Easing.cubic) }),
          ),
          -1,
          false,
        ),
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.9, { duration: PETAL_DUR * 0.6 }),
            withTiming(0.25, { duration: PETAL_DUR }),
          ),
          -1,
          false,
        ),
      );
      return () => {
        cancelAnimation(scale);
        cancelAnimation(opacity);
      };
    }
    if (!bloom) {
      scale.value = 1;
      opacity.value = 0.9;
      return;
    }
    const delay = PETAL_BASE + index * PETAL_STAGGER;
    scale.value = withDelay(delay, withTiming(1, { duration: PETAL_DUR, easing: backOut(1.7) }));
    opacity.value = withDelay(delay, withTiming(0.9, { duration: PETAL_DUR * 0.5 }));
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [bloom, loop, index, opacity, scale]);

  // Scale about the flower centre (120,120) then place the petal radially. Use react-native-svg's
  // transform props (rotation/scale about originX/originY) rather than an SVG transform string —
  // on native, Reanimated parses the `transform` prop as a CSS transform and rejects SVG syntax.
  const props = useAnimatedProps(() => ({
    scale: scale.value,
    opacity: opacity.value,
  }));

  return (
    <AEllipse
      cx={120}
      cy={68}
      rx={32}
      ry={57}
      fill={color}
      fillOpacity={0.9}
      rotation={index * 45}
      originX={120}
      originY={120}
      animatedProps={props}
    />
  );
}

export function BrandMark({ size = 88, animate = 'none', onBloomComplete, idle = false }: BrandMarkProps) {
  const bloom = animate === 'bloom';
  const heartScale = useSharedValue(bloom ? 0 : 1);
  const heartOpacity = useSharedValue(bloom ? 0 : 1);
  const rot = useSharedValue(0);

  useEffect(() => {
    // Heart pops from the centre.
    if (bloom) {
      heartScale.value = withDelay(HEART_DELAY, withTiming(1, { duration: HEART_DUR, easing: backOut(2.4) }));
      heartOpacity.value = withDelay(HEART_DELAY, withTiming(1, { duration: HEART_DUR * 0.4 }));
    } else {
      heartScale.value = 1;
      heartOpacity.value = 1;
    }

    // Gentle living sway once the mark has settled: 0°→+5°→−5°→0°, very slow, forever.
    if (idle) {
      const sway = withRepeat(
        withSequence(
          withTiming(5, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(-5, { duration: 6400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
      rot.value = bloom ? withDelay(BLOOM_END, sway) : sway;
    }

    // Fire the completion callback once the bloom has fully opened.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (bloom && onBloomComplete) {
      timer = setTimeout(() => runOnJS(onBloomComplete)(), BLOOM_END);
    }
    return () => {
      cancelAnimation(heartScale);
      cancelAnimation(heartOpacity);
      cancelAnimation(rot);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);

  const heartProps = useAnimatedProps(() => ({
    scale: heartScale.value,
    opacity: heartOpacity.value,
  }));
  const wrapStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  return (
    <Animated.View style={wrapStyle}>
      <Svg width={size} height={size} viewBox="0 0 240 240">
        <G>
          {PETALS.map((c, i) => (
            <AnimatedPetal key={i} index={i} color={c} animate={animate} />
          ))}
          <ACircle cx={120} cy={120} r={20} fill="#0c1f17" originX={120} originY={120} animatedProps={heartProps} />
          <AEllipse cx={113} cy={113} rx={6} ry={4.5} fill="rgba(154,215,184,0.30)" originX={120} originY={120} animatedProps={heartProps} />
        </G>
      </Svg>
    </Animated.View>
  );
}
