/** AnimatedIcon — an Icon with a small, looping idle motion.
 * Generic presets:
 *  - 'bob'    : gentle vertical float (location pin "hovering")
 *  - 'search' : magnifier drifting in a small circle (a "scanning" feel)
 *  - 'nudge'  : rightward nudge (CTA arrows)
 *  - 'pulse'  : gentle breathing scale
 *  - 'grow'   : sprouts up from the ground once on mount, then a soft living sway
 * Themed presets (match the meaning of the card):
 *  - 'drip'      : a falling water drop (droplet · "keep them alive")
 *  - 'rise'      : trends up-and-to-the-right (trend · "help them grow")
 *  - 'flip'      : a page turning (book · "learn as I go")
 *  - 'broadcast' : pulses outward (share · "share with others")
 *  - 'spin'      : slow continuous rotation (sun · "outdoor")
 *  - 'write'     : small back-and-forth wiggle (pencil · editing a field)
 *  - 'zoom'      : pronounced zoom in / zoom out (camera FAB)
 *  - 'ring'      : bell swinging from the top (unread notifications)
 *  - 'pop'       : one-shot scale-in with overshoot (a check landing)
 *  - 'breathe'   : gentle looping fade + zoom in/out
 *  - 'appear'    : one-shot fade-in + zoom-in (plays once when mounted, e.g. a check)
 */
import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Icon, type IconProps } from '@/components/icon';

export type IconMotion = 'bob' | 'search' | 'nudge' | 'pulse' | 'grow' | 'drip' | 'rise' | 'flip' | 'broadcast' | 'spin' | 'write' | 'zoom' | 'ring' | 'pop' | 'breathe' | 'appear';

// Loops that ping-pong (reverse). Non-reversing loops (rise/search/spin) are handled separately.
const PINGPONG_DURATION: Partial<Record<IconMotion, number>> = { bob: 1200, nudge: 900, pulse: 1400, drip: 2200, flip: 1600, broadcast: 1100, write: 700, zoom: 1500, ring: 480, breathe: 1500 };

export function AnimatedIcon({ motion, ...iconProps }: IconProps & { motion: IconMotion }) {
  const clock = useSharedValue(0);
  // 'grow'/'pop'/'appear' use a one-shot scale value; 'grow' adds a living sway angle.
  const grow = useSharedValue(motion === 'grow' || motion === 'pop' || motion === 'appear' ? 0 : 1);
  const sway = useSharedValue(0);

  useEffect(() => {
    if (motion === 'grow') {
      grow.value = 0;
      // sprout up from the ground with a little overshoot
      grow.value = withSequence(
        withTiming(1.06, { duration: 520, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 220, easing: Easing.inOut(Easing.sin) }),
      );
      // then breathe/sway gently, as if alive
      sway.value = withDelay(740, withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
      return;
    }
    if (motion === 'pop' || motion === 'appear') {
      grow.value = 0;
      grow.value = withSequence(
        withTiming(1.15, { duration: 260, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 170, easing: Easing.inOut(Easing.sin) }),
      );
      return;
    }
    if (motion === 'search') {
      clock.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
    } else if (motion === 'spin') {
      clock.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
    } else if (motion === 'rise') {
      clock.value = withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: 0 }), withDelay(300, withTiming(0, { duration: 0 }))), -1, false);
    } else {
      clock.value = withRepeat(withTiming(1, { duration: PINGPONG_DURATION[motion] ?? 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
  }, [clock, grow, sway, motion]);

  const style = useAnimatedStyle(() => {
    if (motion === 'grow') {
      // anchored at the bottom so it reads as growing up out of the soil
      return { transformOrigin: '50% 100%', transform: [{ scaleY: grow.value }, { scaleX: 0.5 + grow.value * 0.5 }, { rotate: `${(sway.value - 0.5) * 5}deg` }] };
    }
    if (motion === 'search') {
      const a = clock.value * Math.PI * 2;
      return { transform: [{ translateX: Math.cos(a) * 2 }, { translateY: Math.sin(a) * 2 }] };
    }
    if (motion === 'bob') return { transform: [{ translateY: clock.value * -3 }] };
    if (motion === 'pulse') return { transform: [{ scale: 1 + clock.value * 0.14 }] };
    if (motion === 'drip') return { opacity: 1 - clock.value * 0.18, transform: [{ translateY: clock.value * 3 }, { scale: 1 + clock.value * 0.06 }] };
    if (motion === 'rise') return { opacity: 0.55 + (1 - Math.abs(clock.value - 0.5) * 2) * 0.45, transform: [{ translateY: clock.value * -6 }, { translateX: clock.value * 4 }] };
    if (motion === 'flip') return { transform: [{ perspective: 320 }, { rotateY: `${clock.value * 50}deg` }] };
    if (motion === 'broadcast') return { transform: [{ scale: 1 + clock.value * 0.16 }] };
    if (motion === 'spin') return { transform: [{ rotate: `${clock.value * 360}deg` }] };
    if (motion === 'write') return { transform: [{ translateX: (clock.value - 0.5) * 3 }, { rotate: `${(clock.value - 0.5) * 12}deg` }] };
    if (motion === 'zoom') return { transform: [{ scale: 0.93 + clock.value * 0.16 }] };
    if (motion === 'ring') return { transformOrigin: '50% 10%', transform: [{ rotate: `${(clock.value - 0.5) * 28}deg` }] };
    if (motion === 'pop') return { transform: [{ scale: grow.value }] };
    if (motion === 'appear') return { opacity: Math.min(grow.value * 1.6, 1), transform: [{ scale: grow.value }] };
    if (motion === 'breathe') return { opacity: 0.55 + clock.value * 0.45, transform: [{ scale: 0.9 + clock.value * 0.16 }] };
    return { transform: [{ translateX: clock.value * 5 }] }; // nudge
  });

  return (
    <Animated.View style={style}>
      <Icon {...iconProps} />
    </Animated.View>
  );
}
