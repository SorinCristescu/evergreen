/** Button — primary/secondary/ghost/destructive CTA (components.md Tier 1). */
import { ActivityIndicator, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
};

const PAD: Record<Size, { v: number; h: number }> = {
  sm: { v: Spacing.sm, h: Spacing.lg },
  md: { v: Spacing.md, h: Spacing.xl },
  lg: { v: Spacing.lg, h: Spacing.xxl },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const t = useTheme();
  const bg = (v: Variant): string => {
    switch (v) {
      case 'primary':
        return Palette.ever500;
      case 'destructive':
        return Palette.danger;
      default:
        return t.ever100;
    }
  };
  const fg = (v: Variant): string =>
    v === 'primary' || v === 'destructive' ? Palette.white : t.ever700;

  const pad = PAD[size];
  const tint = fg(variant);
  const ghost = variant === 'ghost';

  return (
    <NeuPressable
      onPress={onPress}
      disabled={disabled || loading}
      radius="pill"
      elevation={ghost ? 'raised-sm' : 'raised'}
      stretch={fullWidth}
      backgroundColor={ghost ? 'transparent' : bg(variant)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        paddingVertical: pad.v,
        paddingHorizontal: pad.h,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: Spacing.sm,
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          {leadingIcon ? <Icon name={leadingIcon} size={18} color={tint} /> : null}
          <AppText variant="bodyBold" color={tint}>
            {label}
          </AppText>
          {trailingIcon ? <Icon name={trailingIcon} size={18} color={tint} /> : null}
        </View>
      )}
    </NeuPressable>
  );
}
