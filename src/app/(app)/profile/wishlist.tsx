import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { InsetWell, NeuSurface } from '@/components/neu-surface';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/app-text';
import { coverForSeed, Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

const WISHLIST = [
  { id: 'w1', name: 'Swiss cheese vine', species: 'Monstera adansonii', tag: 'Easy care' },
  { id: 'w2', name: 'String of pearls', species: 'Curio rowleyanus', tag: 'Bright light' },
  { id: 'w3', name: 'Bird of paradise', species: 'Strelitzia nicolai', tag: 'Statement' },
  { id: 'w4', name: 'Calathea orbifolia', species: 'Goeppertia orbifolia', tag: 'Loves humidity' },
  { id: 'w5', name: 'ZZ Raven', species: 'Zamioculcas "Raven"', tag: 'Low light' },
  { id: 'w6', name: 'Wax plant', species: 'Hoya carnosa', tag: 'Trailing' },
];

export default function WishlistScreen() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader
        title="Wishlist"
        trailing={
          <AppText variant="meta" tone="subtle">
            6 saved
          </AppText>
        }
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md, paddingBottom: 120 }}>
        <InsetWell
          radius={14}
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, height: 44, paddingHorizontal: 14 }}
        >
          <Icon name="search" size={18} tone="accent" />
          <TextInput
            placeholder="Search Species to add…"
            placeholderTextColor={t.fgSubtle}
            style={{ flex: 1, fontSize: 14, color: t.fg }}
          />
        </InsetWell>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {WISHLIST.map((w) => (
            <View key={w.id} style={{ width: '47.5%' }}>
              <NeuSurface radius={16} style={{ overflow: 'hidden' }}>
                <View style={{ height: 92 }}>
                  <LinearGradient
                    colors={coverForSeed(w.id)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="image" size={24} color="rgba(255,255,255,0.45)" />
                  </LinearGradient>
                  <View
                    style={{
                      position: 'absolute',
                      top: 9,
                      right: 9,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="heart" size={16} tone="spark" filled />
                  </View>
                </View>
                <View style={{ padding: 11, paddingTop: 10, paddingBottom: 12 }}>
                  <AppText variant="bodyBold" style={{ fontSize: 13, lineHeight: 18 }}>
                    {w.name}
                  </AppText>
                  <AppText variant="metaSm" tone="subtle" style={{ marginTop: 2 }}>
                    {w.species}
                  </AppText>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 8,
                      backgroundColor: t.accentTint,
                      paddingVertical: 2,
                      paddingHorizontal: Spacing.sm,
                      borderRadius: 999,
                    }}
                  >
                    <AppText variant="metaSm" color={Palette.ever500}>

                      {w.tag}
                    </AppText>
                  </View>
                </View>
              </NeuSurface>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
