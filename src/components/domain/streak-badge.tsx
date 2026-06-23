/** StreakBadge — 🔥 streak (Today hero + Profile). `.streak` in evergreen-today.html. */
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type StreakBadgeProps = {
  count: number;
  best?: number;
  active?: boolean;
};

export function StreakBadge({ count, best, active = true }: StreakBadgeProps) {
  const t = useTheme();
  const color = active ? Palette.terra : t.fgSubtle;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 }}>
      <Icon name="flame" size={14} color={color} filled />
      <AppText variant="meta" color={color} style={{ fontSize: 10.5 }}>
        {count}-day streak{best != null ? ` · best ${best}` : ''}
      </AppText>
    </View>
  );
}
