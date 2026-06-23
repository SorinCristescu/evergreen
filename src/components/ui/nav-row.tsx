/** NavRow — the ubiquitous list row: icon + label (+ value) + chevron (components.md Tier 4). */
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/tokens';

export type NavRowProps = {
  label: string;
  leadingIcon?: IconName;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  /** Tint the icon + label in the accent green (e.g. an "Add …" affordance). */
  accent?: boolean;
  trailing?: React.ReactNode;
};

export function NavRow({ label, leadingIcon, value, onPress, showChevron = true, destructive = false, accent = false, trailing }: NavRowProps) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, paddingHorizontal: 16 }}>
      {leadingIcon ? (
        accent ? (
          <Icon name={leadingIcon} size={20} color={Palette.ever400} />
        ) : (
          <Icon name={leadingIcon} size={20} tone={destructive ? 'danger' : 'muted'} />
        )
      ) : null}
      <AppText variant="body" tone={destructive ? 'danger' : 'default'} color={accent ? Palette.ever400 : undefined} style={{ flex: 1 }}>
        {label}
      </AppText>
      {value ? <AppText variant="small" tone="subtle">{value}</AppText> : null}
      {trailing}
      {onPress && showChevron && !trailing ? <Icon name="chevronRight" size={18} tone="subtle" /> : null}
    </View>
  );
  return onPress ? (
    <NeuPressable onPress={onPress} elevation="raised-sm" radius="md" stretch accessibilityLabel={label}>
      {body}
    </NeuPressable>
  ) : (
    <NeuSurface elevation="raised-sm" radius="md" stretch>{body}</NeuSurface>
  );
}
