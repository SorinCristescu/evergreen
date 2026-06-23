/** Chip / FilterChip — selectable pill (Place filters, Level, Goals, Space) (components.md Tier 1).
 * Matches `.chip` in the handoff: unselected = raised-sm; selected = recessed (pressed/inset) with
 * darker green text. NOT a solid-green fill. */
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  leadingIcon?: IconName;
  disabled?: boolean;
  size?: 'md' | 'lg';
};

export function Chip({ label, selected = false, onPress, leadingIcon, disabled = false, size = 'md' }: ChipProps) {
  const t = useTheme();
  const fg = selected ? Palette.ever400 : t.fgMuted;
  const lg = size === 'lg';
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        height: lg ? 46 : 34,
        paddingHorizontal: lg ? 27 : 15,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {leadingIcon ? <Icon name={leadingIcon} size={lg ? 17 : 15} color={fg} /> : null}
      <AppText variant={selected ? 'bodyBold' : 'small'} color={fg} style={{ fontSize: lg ? 15 : 13 }}>
        {label}
      </AppText>
    </View>
  );

  if (selected) {
    return (
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label}>
        <NeuSurface elevation="pressed" radius={Radius.pill}>
          {inner}
        </NeuSurface>
      </Pressable>
    );
  }

  return (
    <NeuPressable
      onPress={onPress}
      disabled={disabled}
      radius="pill"
      elevation="raised-sm"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {inner}
    </NeuPressable>
  );
}
