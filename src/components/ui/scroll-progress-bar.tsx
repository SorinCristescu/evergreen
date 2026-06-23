/** ScrollProgressBar — thin top bar that fills with scroll progress (components.md Tier 4). */
import { View } from 'react-native';

import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type ScrollProgressBarProps = {
  progress: number; // 0..1
};

export function ScrollProgressBar({ progress }: ScrollProgressBarProps) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View style={{ height: 3, backgroundColor: t.accentTint }}>
      <View style={{ height: 3, width: `${pct}%`, backgroundColor: Palette.ever500 }} />
    </View>
  );
}
