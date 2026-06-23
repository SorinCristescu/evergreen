/** Side-by-side compare: the user's captured photo vs. an encyclopedia reference (iNaturalist + GBIF),
 *  with a candidate switcher, so the user confirms which Plant.id match is actually their plant. */
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';
import { useEncyclopediaLookup, type EncyclopediaEntry, type IdentifiedCandidate } from '@/data';

type EncyclopediaCompareProps = {
  visible: boolean;
  capturedUri: string | null;
  candidates: IdentifiedCandidate[];
  initialIndex: number;
  onClose: () => void;
  onChoose: (candidate: IdentifiedCandidate) => void;
};

export function EncyclopediaCompare({ visible, capturedUri, candidates, initialIndex, onClose, onChoose }: EncyclopediaCompareProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const lookup = useEncyclopediaLookup();
  const [index, setIndex] = useState(initialIndex);
  const [entry, setEntry] = useState<EncyclopediaEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset to the requested candidate whenever the sheet is (re)opened.
  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const candidate = candidates[index];

  // Fetch reference data whenever the shown candidate changes while open.
  useEffect(() => {
    if (!visible || !candidate) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    setEntry(null);
    lookup(candidate.scientificName)
      .then((e) => active && setEntry(e))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [visible, candidate, lookup]);

  if (!visible || !candidate) return null;

  const half = { flex: 1, borderRadius: 16, overflow: 'hidden' as const, backgroundColor: t.ever100 };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '92%', backgroundColor: t.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: Spacing.md, paddingHorizontal: 18, paddingBottom: insets.bottom + Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <AppText variant="title" style={{ fontSize: 16 }}>Check in encyclopedia</AppText>
            <Pressable onPress={onClose} accessibilityLabel="Close"><Icon name="close" size={22} tone="subtle" /></Pressable>
          </View>

          {/* candidate switcher */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Pressable disabled={index === 0} onPress={() => setIndex((i) => Math.max(0, i - 1))} accessibilityLabel="Previous match" style={{ opacity: index === 0 ? 0.3 : 1, padding: 6 }}>
              <Icon name="back" size={22} tone="accent" />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <AppText variant="bodyBold" numberOfLines={1} style={{ fontSize: 14 }}>{candidate.scientificName}</AppText>
              <AppText variant="meta" tone="subtle">{index + 1} of {candidates.length} · {Math.round(candidate.confidence * 100)}%</AppText>
            </View>
            <Pressable disabled={index >= candidates.length - 1} onPress={() => setIndex((i) => Math.min(candidates.length - 1, i + 1))} accessibilityLabel="Next match" style={{ opacity: index >= candidates.length - 1 ? 0.3 : 1, padding: 6 }}>
              <Icon name="chevronRight" size={22} tone="accent" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* side-by-side photos */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={half}>
                <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9, padding: 7 }}>Your photo</AppText>
                {capturedUri ? <Image source={{ uri: capturedUri }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" /> : null}
              </View>
              <View style={half}>
                <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9, padding: 7 }}>Encyclopedia</AppText>
                {loading ? (
                  <View style={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={Palette.ever400} /></View>
                ) : entry?.imageUrl ? (
                  <Image source={{ uri: entry.imageUrl }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />
                ) : (
                  <View style={{ aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Icon name="image" size={26} tone="subtle" />
                    <AppText variant="metaSm" tone="subtle">{failed ? 'Lookup failed' : 'No photo found'}</AppText>
                  </View>
                )}
              </View>
            </View>

            {/* reference facts */}
            {entry?.commonName ? <AppText variant="bodyBold" style={{ fontSize: 14, marginBottom: 4 }}>{entry.commonName}</AppText> : null}
            {entry?.family || entry?.genus ? (
              <AppText variant="small" tone="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>
                {[entry.genus && `Genus ${entry.genus}`, entry.family && `Family ${entry.family}`].filter(Boolean).join(' · ')}
              </AppText>
            ) : null}
            {entry?.nativeRange ? <AppText variant="small" tone="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>Native to: {entry.nativeRange}</AppText> : null}
            {entry?.summary ? <AppText variant="small" style={{ fontSize: 12.5, lineHeight: 19, marginTop: 4 }}>{entry.summary}</AppText> : null}
            {entry?.photoAttribution ? <AppText variant="metaSm" tone="subtle" style={{ fontSize: 9, marginTop: 6 }}>{entry.photoAttribution}</AppText> : null}
            {entry?.sourceUrl ? (
              <Pressable onPress={() => entry.sourceUrl && Linking.openURL(entry.sourceUrl)} style={{ marginTop: 6 }}>
                <AppText variant="small" color={Palette.ever400} style={{ fontSize: 12.5 }}>View on Wikipedia ↗</AppText>
              </Pressable>
            ) : null}
          </ScrollView>

          <NeuPressable onPress={() => onChoose(candidate)} radius={Radius.md} elevation="raised" stretch backgroundColor={t.ever100} accessibilityLabel="This is my plant" style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <Icon name="check" size={18} color={Palette.ever400} />
            <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>This is my plant</AppText>
          </NeuPressable>
        </View>
      </View>
    </Modal>
  );
}
