import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BrandMark } from '@/components/domain/brand-mark';
import { AppText } from '@/components/ui/app-text';
import { Wordmark } from '@/components/ui/wordmark';
import { fontFamily } from '@/constants/fonts';
import { Palette } from '@/constants/tokens';
import { useConvexAuth } from 'convex/react';

import { useHasActionableToday, useNeedsOnboarding } from '@/data';

const DOTS_DURATION = 3000; // dots animate for 3s, then navigate
const DOT_PERIOD = 1100; // full bounce cycle (handoff `@keyframes dot` 1.1s)
const BLOOM_MS = 1900; // bloom length — the radial gradient develops over this, in sync

// The radial gradient's darkest/edge colour. The screen starts as this flat colour; the lighter
// centre fades in during the bloom, so the very bottom of the screen never changes.
const EDGE = '#081811'; // ~10% deeper edge → gradient reads a touch more visible
const MID = '#0c1f17';
const CENTER = '#113124'; // ~10% lighter centre

/** One bouncing loader dot — driven off a shared clock with a distinct phase so the three
 * dots cascade one-after-another (handoff `@keyframes dot` + staggered animation-delay). */
function LoaderDot({ clock, phase }: { clock: SharedValue<number>; phase: number }) {
  const style = useAnimatedStyle(() => {
    const p = (clock.value + phase) % 1; // 0..1 within this dot's cycle
    const b = Math.sin(p * Math.PI); // smooth 0→1→0 bump (rise at p=0.5)
    return { opacity: 0.28 + 0.72 * b, transform: [{ translateY: -5 * b }] };
  });
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.ever400 }, style]} />;
}

/**
 * Splash + entry router. Phase 3 adds the Clerk auth gate here (→ /(auth)/login when no session).
 *
 * Sequence: the canvas starts as a flat dark green (the gradient's edge colour); as the flower
 * blooms, the radial gradient's lighter centre fades in at the same speed; then the "evergreen"
 * wordmark, the tagline and the staggered loader dots animate in. Finally we apply the care-state
 * landing rule (Today if actionable, else Garden).
 */
export default function Index() {
  // 'bloom' → mark blooming + gradient developing; 'word' → wordmark in; 'rest' → tagline + dots in.
  const [phase, setPhase] = useState<'bloom' | 'word' | 'rest'>('bloom');
  const [done, setDone] = useState(false);
  const actionable = useHasActionableToday();
  const needsOnboarding = useNeedsOnboarding();
  const { isAuthenticated: convexAuthed } = useConvexAuth();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { width, height } = useWindowDimensions();

  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(14);
  const tagOpacity = useSharedValue(0);
  const tagY = useSharedValue(8);
  const dotsOpacity = useSharedValue(0);
  const gradient = useSharedValue(0); // 0 = flat edge colour, 1 = full radial (fades in during bloom)
  const dotClock = useSharedValue(0); // shared 0→1 clock driving the staggered dot wave

  useEffect(() => {
    gradient.value = withTiming(1, { duration: BLOOM_MS, easing: Easing.inOut(Easing.sin) });
    dotClock.value = withRepeat(withTiming(1, { duration: DOT_PERIOD, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(dotClock);
  }, [gradient, dotClock]);

  useEffect(() => {
    if (phase === 'word') {
      wordOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
      wordY.value = withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) });
      const t = setTimeout(() => setPhase('rest'), 560);
      return () => clearTimeout(t);
    }
    if (phase === 'rest') {
      tagOpacity.value = withTiming(1, { duration: 450 });
      tagY.value = withTiming(0, { duration: 450 });
      dotsOpacity.value = withTiming(1, { duration: 450 });
      const t = setTimeout(() => setDone(true), DOTS_DURATION);
      return () => clearTimeout(t);
    }
  }, [phase, wordOpacity, wordY, tagOpacity, tagY, dotsOpacity]);

  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value, transform: [{ translateY: wordY.value }] }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagOpacity.value, transform: [{ translateY: tagY.value }] }));
  const dotsStyle = useAnimatedStyle(() => ({ opacity: dotsOpacity.value }));
  const gradientStyle = useAnimatedStyle(() => ({ opacity: gradient.value }));

  // Auth gate (minimal — full gating is Phase 4): after the splash, no Clerk session → login;
  // signed in → care-state landing (Today if an overdue/due-today task exists, else Garden).
  if (done && authLoaded) {
    if (!isSignedIn) return <Redirect href="/(auth)/login" />;
    // Wait for Convex to authenticate + the locations query to settle before routing, so we never
    // misread a still-loading user as "needs onboarding".
    if (convexAuthed && needsOnboarding !== undefined) {
      if (needsOnboarding) return <Redirect href="/(auth)/onboarding" />;
      if (actionable !== undefined) {
        return <Redirect href={actionable ? '/(app)/(tabs)/today' : '/(app)/(tabs)/garden'} />;
      }
    }
  }

  return (
    // Flat edge colour at the start; the radial gradient (above) fades in during the bloom.
    <View style={{ flex: 1, backgroundColor: EDGE, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width, height, opacity: 0 }, gradientStyle]} pointerEvents="none">
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="bg" cx={width / 2} cy={height * 0.38} rx={width * 0.65} ry={height * 0.45} gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor={CENTER} />
              <Stop offset="52%" stopColor={MID} />
              <Stop offset="100%" stopColor={EDGE} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill="url(#bg)" />
        </Svg>
      </Animated.View>

      <View style={{ alignItems: 'center', gap: 26 }}>
        {/* 1) mark blooms in the middle, then gently sways */}
        <View style={{ width: 188, height: 188, alignItems: 'center', justifyContent: 'center' }}>
          <BrandMark size={188} animate="bloom" idle onBloomComplete={() => setPhase('word')} />
        </View>

        {/* 2) wordmark, then 3) tagline */}
        <View style={{ alignItems: 'center', gap: 13 }}>
          <Animated.View style={wordStyle}>
            <Wordmark size={44} everColor={Palette.white} />
          </Animated.View>
          <Animated.View style={tagStyle}>
            <AppText
              color="#7fae93"
              style={{ fontFamily: fontFamily('mono', '500'), fontSize: 13, letterSpacing: 3.4, textTransform: 'uppercase' }}
            >
              grow something alive
            </AppText>
          </Animated.View>
        </View>
      </View>

      {/* 3) loader dots — fade in with the tagline, bounce one-after-another */}
      <Animated.View style={[{ position: 'absolute', bottom: 64, flexDirection: 'row', gap: 7 }, dotsStyle]}>
        <LoaderDot clock={dotClock} phase={0} />
        <LoaderDot clock={dotClock} phase={0.16} />
        <LoaderDot clock={dotClock} phase={0.32} />
      </Animated.View>
    </View>
  );
}
