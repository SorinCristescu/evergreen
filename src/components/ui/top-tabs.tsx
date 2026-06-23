/** TopTabs — labeled in-screen tab bar (Community Feed/Swap/Challenges). `.ttabs` in handoff. */
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type TopTab = { key: string; label: string; badgeCount?: number };
export type TopTabsProps = {
  tabs: TopTab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function TopTabs({ tabs, activeKey, onChange }: TopTabsProps) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.xl, borderBottomWidth: 1, borderBottomColor: 'rgba(22,39,30,0.08)' }}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{ marginRight: 18, paddingTop: 8, paddingBottom: 11 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText variant="bodyBold" style={{ fontSize: 14 }} color={active ? t.fg : t.fgSubtle}>
                {tab.label}
              </AppText>
              {tab.badgeCount ? <Badge count={tab.badgeCount} /> : null}
            </View>
            {active ? (
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2.5, borderRadius: 2, backgroundColor: Palette.ever500 }} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
