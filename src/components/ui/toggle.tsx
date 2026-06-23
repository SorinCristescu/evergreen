/** Toggle — recessed pill track + sliding raised knob (Settings, Permissions). `.toggle` in handoff. */
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel?: string;
};

export function Toggle({ value, onChange, accessibilityLabel }: ToggleProps) {
  const t = useTheme();
  const progress = useDerivedValue(() => withTiming(value ? 1 : 0, { duration: 200 }), [value]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 3 + progress.value * 19 }],
    // knob turns evergreen when on; neutral raised disc when off
    backgroundColor: value ? Palette.ever400 : '#fff',
  }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          // track stays the page/background color as a recessed well in both states
          { width: 46, height: 27, borderRadius: 999, justifyContent: 'center', backgroundColor: t.canvas, boxShadow: t.neuPressed } as never,
        ]}
      >
        <Animated.View
          style={[
            { position: 'absolute', top: 3, left: 0, width: 21, height: 21, borderRadius: 999, boxShadow: '0 1px 3px rgba(0,0,0,0.25)' } as never,
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
