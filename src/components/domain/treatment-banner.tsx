/** TreatmentBanner — active-treatment card atop the Care tab. `.treat` in evergreen-plant-detail.html. */
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import type { Treatment } from '@/data';

export type TreatmentBannerProps = {
  treatment: Treatment;
  onPress: () => void;
};

export function TreatmentBanner({ treatment, onPress }: TreatmentBannerProps) {
  const dots = Array.from({ length: treatment.totalSteps });
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Treatment: ${treatment.diagnosis}`} style={{ alignSelf: 'stretch' }}>
      <NeuSurface elevation="raised" radius={16} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
        {/* warn-tint icon well */}
        <View style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(181,130,31,0.14)' }}>
          <Icon name="warning" size={20} color={Palette.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold" color={Palette.ever900} numberOfLines={1} style={{ fontSize: 14 }}>
            Under treatment · {treatment.diagnosis}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <AppText variant="meta" tone="muted" style={{ fontSize: 10.5 }}>
              Step {treatment.currentStep} of {treatment.totalSteps}
            </AppText>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              {dots.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 14,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i < treatment.currentStep ? Palette.ever400 : 'rgba(22,39,30,0.14)',
                  }}
                />
              ))}
            </View>
          </View>
        </View>
        <Icon name="chevronRight" size={18} tone="subtle" />
      </NeuSurface>
    </Pressable>
  );
}
