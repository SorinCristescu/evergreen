/** CandidateRow — a low-confidence identification candidate. `.cand` in evergreen-capture-identify.html. */
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { ConfidencePill } from '@/components/domain/confidence-pill';
import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { coverForSeed } from '@/constants/tokens';
import type { IdentificationCandidate } from '@/data';

export type CandidateRowProps = {
  candidate: IdentificationCandidate;
  onPress: () => void;
};

export function CandidateRow({ candidate, onPress }: CandidateRowProps) {
  const [from, to] = coverForSeed(candidate.species.id);
  return (
    <NeuPressable onPress={onPress} radius={14} accessibilityLabel={candidate.species.scientificName} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 11, overflow: 'hidden' }}>
        <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="bodyBold" numberOfLines={1}>
          {candidate.species.commonName ?? candidate.species.scientificName}
        </AppText>
        <ConfidencePill confidence={candidate.confidence} showLabel={false} />
      </View>
    </NeuPressable>
  );
}
