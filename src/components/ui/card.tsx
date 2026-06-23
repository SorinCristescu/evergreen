/** Card — generic rounded neumorphic surface, optionally pressable (components.md Tier 1). */
import { type ViewStyle } from 'react-native';

import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { Radius } from '@/constants/tokens';

type RadiusKey = keyof typeof Radius;

export type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  radius?: RadiusKey;
  padded?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function Card({ children, onPress, radius = 'lg', padded = true, style, accessibilityLabel }: CardProps) {
  const inner: ViewStyle = { padding: padded ? 16 : 0, ...style };
  if (onPress) {
    return (
      <NeuPressable onPress={onPress} radius={radius} style={inner} accessibilityLabel={accessibilityLabel}>
        {children}
      </NeuPressable>
    );
  }
  return (
    <NeuSurface radius={radius} style={inner} accessibilityLabel={accessibilityLabel}>
      {children}
    </NeuSurface>
  );
}
