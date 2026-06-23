/** Badge — unread count / status dot overlay (components.md Tier 1). */
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Tone = 'default' | 'danger' | 'accent';

const TONE: Record<Tone, string> = {
  default: Palette.terra,
  danger: Palette.danger,
  accent: Palette.ever500,
};

export type BadgeProps = {
  count?: number;
  max?: number;
  variant?: 'count' | 'dot';
  tone?: Tone;
};

export function Badge({ count, max = 99, variant = count == null ? 'dot' : 'count', tone = 'default' }: BadgeProps) {
  const t = useTheme();
  const bg = TONE[tone];
  if (variant === 'dot') {
    return <View style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: bg, borderWidth: 1.5, borderColor: t.ever100 }} />;
  }
  const label = count != null && count > max ? `${max}+` : String(count ?? 0);
  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        paddingHorizontal: 5,
        borderRadius: 999,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="metaSm" color={Palette.white}>
        {label}
      </AppText>
    </View>
  );
}
