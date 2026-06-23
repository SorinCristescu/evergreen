/** DataGlanceCard — Privacy "what we hold, at a glance" summary (2×2 chip grid). */
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';

export type DataGlanceItem = { icon: IconName; label: string };
export type DataGlanceCardProps = { title?: string; items: DataGlanceItem[] };

export function DataGlanceCard({ title = 'What we hold, at a glance', items }: DataGlanceCardProps) {
  return (
    <NeuSurface elevation="raised" radius={16} stretch style={{ padding: 14, marginBottom: 16 }}>
      <AppText variant="bodyBold" color={Palette.ever900} style={{ fontSize: 13 }}>{title}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 11 }}>
        {items.map((it) => (
          <NeuSurface
            key={it.label}
            elevation="pressed"
            radius={11}
            style={{ width: '47.5%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 10 }}
          >
            <Icon name={it.icon} size={15} strokeWidth={1.8} color={Palette.ever500} />
            <AppText variant="small" tone="muted" style={{ flex: 1, fontSize: 11.5, lineHeight: 15 }}>{it.label}</AppText>
          </NeuSurface>
        ))}
      </View>
    </NeuSurface>
  );
}
