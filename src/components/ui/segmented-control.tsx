/** SegmentedControl — 2–3 way inline switch (e.g. Discover ⇄ Following) (components.md Tier 1).
 * Recessed track (neu-pressed) with a raised-sm thumb under the active segment. `.subseg` in handoff. */
import { Pressable, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon, type IconMotion } from '@/components/ui/animated-icon';
import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type SegmentedControlProps<T extends string = string> = {
  options: { value: T; label: string; icon?: IconName; motion?: IconMotion }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string = string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const t = useTheme();
  const hasIcons = options.some((o) => o.icon);
  return (
    <NeuSurface elevation="raised" radius={14} stretch style={{ flexDirection: 'row', padding: 5, gap: 5 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        // Selected segment stays pressed (inset) with ever400 icon/label (global interaction rule).
        const activeStyle: ViewStyle = active ? ({ backgroundColor: t.ever100, boxShadow: t.neuPressed } as ViewStyle) : {};
        const fg = active ? Palette.ever400 : t.fgMuted;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 5 },
              hasIcons ? { paddingVertical: 10 } : { height: 34 },
              activeStyle,
            ]}
          >
            {opt.icon ? (
              active ? (
                <AnimatedIcon name={opt.icon} size={30} color={fg} motion={opt.motion ?? 'pulse'} />
              ) : (
                <Icon name={opt.icon} size={30} color={fg} />
              )
            ) : null}
            <AppText variant={active ? 'bodyBold' : 'body'} style={{ fontSize: 13 }} color={fg}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </NeuSurface>
  );
}
