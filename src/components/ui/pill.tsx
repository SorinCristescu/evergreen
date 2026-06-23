/** Pill — small read-only status/label tag (components.md Tier 1). */
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type PillProps = {
  label: string;
  tone?: Tone;
  leadingIcon?: IconName;
};

export function Pill({ label, tone = 'neutral', leadingIcon }: PillProps) {
  const t = useTheme();
  const TONE: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: t.accentTint, fg: t.fgMuted },
    info: { bg: 'rgba(46,109,78,0.14)', fg: Palette.ever500 },
    success: { bg: 'rgba(77,175,130,0.18)', fg: t.ever700 },
    warning: { bg: 'rgba(181,130,31,0.16)', fg: Palette.warning },
    danger: { bg: 'rgba(179,64,47,0.14)', fg: Palette.danger },
  };
  const c = TONE[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        alignSelf: 'flex-start',
        backgroundColor: c.bg,
        paddingVertical: 4,
        paddingHorizontal: Spacing.md,
        borderRadius: 999,
      }}
    >
      {leadingIcon ? <Icon name={leadingIcon} size={12} color={c.fg} /> : null}
      <AppText variant="metaSm" color={c.fg} uppercase>
        {label}
      </AppText>
    </View>
  );
}
