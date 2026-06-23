/** AppHeader — main-tab header: leading slot + title + trailing actions (bell/search/DM). */
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/tokens';

export type AppHeaderProps = {
  title?: string;
  leading?: React.ReactNode; // e.g. LocationSwitcher
  trailing?: React.ReactNode; // e.g. bell / DM icon buttons
  subtitle?: React.ReactNode;
};

export function AppHeader({ title, leading, trailing, subtitle }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <View style={{ flex: 1 }}>
          {leading ?? (title ? <AppText variant="display2" style={{ fontSize: 16.8, lineHeight: 21 }}>{title}</AppText> : null)}
        </View>
        {trailing ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>{trailing}</View> : null}
      </View>
      {subtitle ? <View style={{ marginTop: Spacing.xs }}>{subtitle}</View> : null}
    </View>
  );
}
