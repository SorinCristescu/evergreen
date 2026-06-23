/** ConfidencePill — identification/diagnosis confidence %, tone keyed to bands (ADR-0002). */
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { AppText } from '@/components/ui/app-text';
import { Confidence, Palette } from '@/constants/tokens';

function band(c: number) {
  if (c >= Confidence.high.min) return { color: Confidence.high.color, label: Confidence.high.label };
  if (c >= Confidence.medium.min) return { color: Confidence.medium.color, label: Confidence.medium.label };
  return { color: Confidence.low.color, label: Confidence.low.label };
}

export type ConfidencePillProps = {
  confidence: number; // 0..1
  showLabel?: boolean;
};

export function ConfidencePill({ confidence, showLabel = true }: ConfidencePillProps) {
  const b = band(confidence);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: `${b.color}22`,
      }}
    >
      <Icon name="check" size={12} color={b.color} />
      <AppText variant="metaSm" color={b.color} uppercase>
        {Math.round(confidence * 100)}%{showLabel ? ` · ${b.label}` : ''}
      </AppText>
    </View>
  );
}
