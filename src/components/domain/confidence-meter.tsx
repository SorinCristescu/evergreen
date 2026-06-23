/** ConfidenceMeter — larger confidence-band visual for the capture result hero (Tier 4). */
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Confidence } from '@/constants/tokens';
import { useTheme } from '@/theme';

function band(c: number) {
  if (c >= Confidence.high.min) return { color: Confidence.high.color, label: Confidence.high.label };
  if (c >= Confidence.medium.min) return { color: Confidence.medium.color, label: Confidence.medium.label };
  return { color: Confidence.low.color, label: Confidence.low.label };
}

export type ConfidenceMeterProps = {
  confidence: number; // 0..1
};

export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const t = useTheme();
  const b = band(confidence);
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AppText variant="metaSm" color={b.color} uppercase>{b.label}</AppText>
        <AppText variant="bodyBold" color={b.color}>{pct}%</AppText>
      </View>
      <View style={{ height: 8, borderRadius: 999, backgroundColor: t.accentTint, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${pct}%`, borderRadius: 999, backgroundColor: b.color }} />
      </View>
    </View>
  );
}
