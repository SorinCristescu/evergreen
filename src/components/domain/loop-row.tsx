/** LoopRow — product-loop row on Welcome/onboarding (Identify · Care · Diagnose · Connect). */
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/tokens';

export type LoopRowProps = {
  icon: IconName;
  label: string;
  description: string;
  index: number;
};

export function LoopRow({ icon, label, description, index }: LoopRowProps) {
  return (
    <NeuSurface elevation="raised" radius={16} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md }}>
      <NeuSurface elevation="pressed" radius={13} style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} tone="accent" />
      </NeuSurface>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold">{label}</AppText>
        <AppText variant="small" tone="subtle">{description}</AppText>
      </View>
      <AppText variant="meta" tone="subtle">{index}</AppText>
    </NeuSurface>
  );
}
