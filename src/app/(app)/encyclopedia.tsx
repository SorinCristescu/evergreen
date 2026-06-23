/** Full encyclopedia entry for a species (iNaturalist + GBIF). Reached from a plant's About tab. */
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Palette, Spacing } from '@/constants/tokens';
import { useEncyclopediaLookup, type EncyclopediaEntry } from '@/data';
import { useTheme } from '@/theme';

export default function EncyclopediaScreen() {
  const t = useTheme();
  const { name, common } = useLocalSearchParams<{ name?: string; common?: string }>();
  const lookup = useEncyclopediaLookup();
  const [entry, setEntry] = useState<EncyclopediaEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    if (!name) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    lookup(name)
      .then((e) => active && setEntry(e))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  };
  useEffect(load, [name, lookup]);

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={{ marginTop: 20 }}>
      <AppText variant="meta" tone="subtle" uppercase style={{ marginBottom: 8 }}>{label}</AppText>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader title={common || name || 'Encyclopedia'} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={Palette.ever400} /></View>
      ) : failed ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <AppText variant="small" tone="muted">Couldn't load encyclopedia data.</AppText>
          <Pressable onPress={load}><AppText variant="bodyBold" color={Palette.ever400}>Retry</AppText></Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 48 }}>
          {entry?.imageUrl ? (
            <Image source={{ uri: entry.imageUrl }} style={{ width: '100%', height: 220, borderRadius: 18 }} contentFit="cover" transition={150} />
          ) : null}
          <AppText variant="title" style={{ marginTop: 14 }}>{common || name}</AppText>
          <AppText variant="small" tone="muted" style={{ fontStyle: 'italic' }}>{name}</AppText>
          {entry?.commonName && entry.commonName !== common ? <AppText variant="small" tone="muted">{entry.commonName}</AppText> : null}

          {entry?.summary ? <Section label="About"><AppText variant="small" style={{ lineHeight: 21 }}>{entry.summary}</AppText></Section> : null}

          {entry?.photos?.length ? (
            <Section label="Gallery">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {entry.photos.map((p, i) => (
                  <Image key={i} source={{ uri: p.url }} style={{ width: 130, height: 130, borderRadius: 14 }} contentFit="cover" transition={150} />
                ))}
              </ScrollView>
            </Section>
          ) : null}

          {entry?.lineage?.length ? (
            <Section label="Taxonomy">
              <NeuSurface elevation="pressed" radius={14} style={{ padding: 14, gap: 8 }}>
                {entry.lineage.map((l) => (
                  <View key={l.rank} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="meta" tone="subtle" uppercase>{l.rank}</AppText>
                    <AppText variant="small" color={t.fg}>{l.name}</AppText>
                  </View>
                ))}
              </NeuSurface>
            </Section>
          ) : null}

          {entry?.nativeRange || entry?.introducedRange ? (
            <Section label="Distribution">
              {entry?.nativeRange ? <AppText variant="small"><AppText variant="bodyBold" style={{ fontSize: 13 }}>Native: </AppText>{entry.nativeRange}</AppText> : null}
              {entry?.introducedRange ? <AppText variant="small" style={{ marginTop: 4 }}><AppText variant="bodyBold" style={{ fontSize: 13 }}>Introduced: </AppText>{entry.introducedRange}</AppText> : null}
            </Section>
          ) : null}

          {entry?.conservationStatus || entry?.observationsCount || entry?.rank ? (
            <Section label="Facts">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {entry?.rank ? <Fact label="Rank" value={entry.rank} /> : null}
                {entry?.conservationStatus ? <Fact label="Conservation" value={entry.conservationStatus} /> : null}
                {typeof entry?.observationsCount === 'number' ? <Fact label="iNat observations" value={entry.observationsCount.toLocaleString()} /> : null}
              </View>
            </Section>
          ) : null}

          {entry?.photoAttribution ? <AppText variant="meta" tone="subtle" style={{ marginTop: 16 }}>Photo: {entry.photoAttribution}</AppText> : null}
          {entry?.wikipediaUrl ? (
            <Pressable onPress={() => Linking.openURL(entry.wikipediaUrl!)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <Icon name="search" size={15} color={Palette.ever400} />
              <AppText variant="small" color={Palette.ever400}>Read on Wikipedia</AppText>
            </Pressable>
          ) : null}

          {!entry || Object.keys(entry).length === 0 ? (
            <AppText variant="small" tone="muted" style={{ marginTop: 24 }}>No encyclopedia data found for this species.</AppText>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <NeuSurface elevation="pressed" radius={14} style={{ width: '47.5%', paddingVertical: 12, paddingHorizontal: 13 }}>
      <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 9 }}>{label}</AppText>
      <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13, marginTop: 3 }}>{value}</AppText>
    </NeuSurface>
  );
}
