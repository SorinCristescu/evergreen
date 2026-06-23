/** PlantCard — Garden grid cell. Matches `.pcard` in evergreen-garden.html. */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { coverForSeed, Palette } from '@/constants/tokens';
import type { PlantCardStatus, PlantSummary } from '@/data';
import { useTheme } from '@/theme';

export type PlantCardProps = {
  plant: PlantSummary;
  onPress: () => void;
};

export function PlantCard({ plant, onPress }: PlantCardProps) {
  const t = useTheme();
  // status → dot icon/colour (top-right) and footer line icon/colour.
  const STATUS: Record<PlantCardStatus, { dot: IconName; dotColor: string; line: IconName; lineColor: string; fallback: string }> = {
    warn: { dot: 'droplet', dotColor: Palette.warning, line: 'droplet', lineColor: Palette.warning, fallback: 'Needs water' },
    ok: { dot: 'droplet', dotColor: Palette.ever500, line: 'droplet', lineColor: t.fgMuted, fallback: 'Scheduled' },
    good: { dot: 'check', dotColor: Palette.leaf, line: 'leaf', lineColor: Palette.leaf, fallback: 'Healthy' },
  };
  const [from, to] = coverForSeed(plant.id);
  const name = plant.nickname ?? plant.species?.commonName ?? 'Plant';
  const status: PlantCardStatus = plant.status ?? (plant.needsWater ? 'warn' : 'good');
  const cfg = STATUS[status];
  const label = plant.statusLabel ?? cfg.fallback;

  return (
    <NeuPressable onPress={onPress} radius={16} stretch accessibilityLabel={name} style={{ overflow: 'hidden' }}>
      <View style={{ height: 92 }}>
        {plant.coverUrl ? (
          <Image source={{ uri: plant.coverUrl }} style={{ flex: 1 }} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="image" size={26} color="rgba(255,255,255,0.5)" />
          </LinearGradient>
        )}
        {/* soft top-right sheen */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.22)', 'transparent']}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 0.7 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
          }}
        >
          <Icon name={cfg.dot} size={12} color={cfg.dotColor} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 11, paddingTop: 9, paddingBottom: 11 }}>
        <AppText variant="bodyBold" numberOfLines={1} style={{ fontSize: 13.5 }}>
          {name}
        </AppText>
        <AppText variant="metaSm" tone="subtle" numberOfLines={1} style={{ fontSize: 10, marginTop: 1 }}>
          {plant.species?.scientificName ?? 'Unidentified'}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }}>
          <Icon name={cfg.line} size={12} color={cfg.lineColor} />
          <AppText variant="small" color={cfg.lineColor} style={{ fontSize: 11 }}>
            {label}
          </AppText>
        </View>
      </View>
    </NeuPressable>
  );
}
