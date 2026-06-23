import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/app-text';
import { coverForSeed, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

const MEMORIAL = [
  {
    id: 'm1',
    name: 'Rubber',
    species: 'Ficus elastica',
    span: '2023–2024',
    with: 'With you 14 months',
    cause: "Couldn't recover from root rot",
  },
  {
    id: 'm2',
    name: 'Sweet basil',
    species: 'Ocimum basilicum',
    span: '2024',
    with: 'With you 5 months',
    cause: 'Reached the end of its season',
  },
  {
    id: 'm3',
    name: 'Hedgehog',
    species: 'Echinopsis',
    span: '2023–2024',
    with: 'With you 8 months',
    cause: 'Gave it to a good friend',
  },
];

export default function MemorialScreen() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader
        title="Memorial"
        trailing={
          <AppText variant="meta" tone="subtle">
            3 kept
          </AppText>
        }
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md, paddingBottom: 120 }}>
        <NeuSurface
          elevation="pressed"
          radius={14}
          style={{ flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md }}
        >
          <View style={{ paddingTop: 1 }}>
            <Icon name="heart" size={16} tone="accent" filled />
          </View>
          <AppText variant="small" tone="muted" style={{ flex: 1 }}>
            Every plant leaves a mark. Their photos and journals stay here — gently, and forever.
          </AppText>
        </NeuSurface>

        {MEMORIAL.map((m) => (
          <NeuSurface
            key={m.id}
            radius={16}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 11 }}
          >
            <View style={{ width: 64, height: 64, borderRadius: 13, overflow: 'hidden' }}>
              <LinearGradient
                colors={coverForSeed(m.id)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="image" size={24} color="rgba(255,255,255,0.5)" />
              </LinearGradient>
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(11,24,18,0.55)',
                  paddingVertical: 2,
                  alignItems: 'center',
                }}
              >
                <AppText variant="metaSm" tone="inverse">
                  {m.span}
                </AppText>
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <AppText variant="bodyBold">{m.name}</AppText>
                <Icon name="heart" size={14} tone="accent" filled />
              </View>
              <AppText variant="metaSm" tone="subtle" style={{ marginTop: 1 }}>
                {m.species}
              </AppText>
              <AppText variant="small" tone="muted" style={{ marginTop: 5 }}>
                {m.with}
              </AppText>
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 6,
                  backgroundColor: t.accentTint,
                  paddingVertical: 2,
                  paddingHorizontal: Spacing.sm,
                  borderRadius: 999,
                }}
              >
                <AppText variant="small" color={t.ever700} style={{ fontSize: 10.5, lineHeight: 16 }}>
                  {m.cause}
                </AppText>
              </View>
            </View>
          </NeuSurface>
        ))}
      </ScrollView>
    </View>
  );
}
