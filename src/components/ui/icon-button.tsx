/** IconButton — icon-only tap target with optional unread Badge (components.md Tier 1). */
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuPressable } from '@/components/neu-surface';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Palette, Radius } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Size = 'sm' | 'md' | 'lg';
// 40px matches the handoff `.iconbtn`; touch target preserved via hitSlop.
const DIM: Record<Size, number> = { sm: 36, md: 40, lg: 52 };

export type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: Size;
  badgeCount?: number;
  disabled?: boolean;
  tone?: 'default' | 'muted' | 'accent' | 'danger' | 'inverse';
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 'md',
  badgeCount,
  disabled = false,
  tone = 'default',
}: IconButtonProps) {
  const t = useTheme();
  const dim = DIM[size];
  const hasUnread = badgeCount != null && badgeCount > 0;
  const iconSize = Math.round(dim * 0.52);
  return (
    <View>
      <NeuPressable
        onPress={onPress}
        disabled={disabled}
        radius="full"
        elevation="raised-sm"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full }}
      >
        {hasUnread ? (
          <AnimatedIcon name={icon} size={iconSize} color={Palette.ever400} motion={icon === 'bell' ? 'ring' : 'pulse'} />
        ) : (
          <Icon name={icon} size={iconSize} tone={tone === 'default' ? 'default' : tone} />
        )}
      </NeuPressable>
      {badgeCount != null && badgeCount > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            width: 9,
            height: 9,
            borderRadius: 999,
            backgroundColor: Palette.terra,
            borderWidth: 2,
            borderColor: t.ever100,
          }}
        />
      ) : null}
    </View>
  );
}
