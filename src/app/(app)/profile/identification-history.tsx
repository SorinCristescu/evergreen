import { LinearGradient } from 'expo-linear-gradient';
import { Fragment } from 'react';
import { ScrollView, View } from 'react-native';

import { Icon } from '@/components/icon';
import { InsetWell, NeuSurface } from '@/components/neu-surface';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/app-text';
import { coverForSeed, Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Level = 'high' | 'med' | 'low';

type Row = {
  id: string;
  group: 'TODAY' | 'THIS WEEK' | 'EARLIER';
  name: string;
  common: string;
  conf: number; // 0 = no match
  level: Level;
  out: string;
  added: boolean;
  time: string;
  seed: string | null; // null = unidentified "?" well
};

const ROWS: Row[] = [
  { id: 'r1', group: 'TODAY', name: 'Monstera deliciosa', common: 'Swiss cheese plant', conf: 96, level: 'high', out: 'Added as "Mara"', added: true, time: '9:12', seed: 'r1' },
  { id: 'r2', group: 'THIS WEEK', name: 'Pilea peperomioides', common: 'Chinese money plant', conf: 91, level: 'high', out: 'Added as "Pancake"', added: true, time: 'Mon', seed: 'r2' },
  { id: 'r3', group: 'THIS WEEK', name: 'Best guesses', common: 'low confidence', conf: 61, level: 'med', out: 'Dismissed — retake photo', added: false, time: 'Mon', seed: null },
  { id: 'r4', group: 'THIS WEEK', name: 'Goeppertia orbifolia', common: 'Calathea orbifolia', conf: 88, level: 'med', out: 'Saved to Wishlist', added: false, time: 'Sun', seed: 'r4' },
  { id: 'r5', group: 'EARLIER', name: 'Unidentified', common: 'added without ID', conf: 0, level: 'low', out: 'Added as "Office fern"', added: true, time: 'Jun 2', seed: null },
  { id: 'r6', group: 'EARLIER', name: 'Dracaena trifasciata', common: 'Snake plant', conf: 94, level: 'high', out: 'Added as "Snake"', added: true, time: 'May 28', seed: 'r6' },
];

const GROUPS: Row['group'][] = ['TODAY', 'THIS WEEK', 'EARLIER'];

function ConfChip({ conf, level }: { conf: number; level: Level }) {
  const t = useTheme();
  const CHIP: Record<Level, { bg: string; fg: string }> = {
    high: { bg: 'rgba(62,124,79,0.14)', fg: Palette.leaf },
    med: { bg: 'rgba(181,130,31,0.14)', fg: Palette.warning },
    low: { bg: 'rgba(125,148,136,0.18)', fg: t.fgSubtle },
  };
  const c = CHIP[level];
  return (
    <View
      style={{
        height: 20,
        paddingHorizontal: Spacing.sm,
        borderRadius: 999,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="metaSm" color={c.fg} style={{ fontSize: 10, lineHeight: 12 }}>
        {conf > 0 ? `${conf}%` : 'no match'}
      </AppText>
    </View>
  );
}

export default function IdentificationHistoryScreen() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader
        title="Identification history"
        trailing={
          <AppText variant="meta" tone="subtle">
            6
          </AppText>
        }
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: 120 }}>
        {GROUPS.map((g) => {
          const rows = ROWS.filter((r) => r.group === g);
          if (!rows.length) return null;
          return (
            <Fragment key={g}>
              <AppText variant="metaSm" tone="subtle" uppercase style={{ marginTop: 14, marginBottom: 9, marginLeft: 4 }}>
                {g}
              </AppText>
              {rows.map((r) => (
                <NeuSurface
                  key={r.id}
                  radius={15}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: 11, marginBottom: 10 }}
                >
                  {r.seed ? (
                    <View style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden' }}>
                      <LinearGradient
                        colors={coverForSeed(r.seed)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon name="image" size={20} color="rgba(255,255,255,0.5)" />
                      </LinearGradient>
                    </View>
                  ) : (
                    <InsetWell
                      radius={12}
                      style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <AppText variant="subtitle" tone="subtle">
                        ?
                      </AppText>
                    </InsetWell>
                  )}

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="bodyBold" style={{ fontSize: 13.5, lineHeight: 18 }} numberOfLines={1}>
                      {r.name}
                      <AppText variant="metaSm" tone="muted" style={{ fontSize: 11 }}>
                        {'  · '}
                        {r.common}
                      </AppText>
                    </AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 }}>
                      <ConfChip conf={r.conf} level={r.level} />
                      <AppText
                        variant="small"
                        color={r.added ? Palette.leaf : t.fgMuted}
                        style={{ fontSize: 10.5, lineHeight: 14 }}
                      >
                        {r.out}
                      </AppText>
                    </View>
                  </View>

                  <AppText variant="metaSm" tone="subtle" style={{ alignSelf: 'flex-start', paddingTop: 2 }}>
                    {r.time}
                  </AppText>
                </NeuSurface>
              ))}
            </Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}
