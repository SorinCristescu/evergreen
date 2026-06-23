import { ScrollView, View } from 'react-native';

import { BrandMark } from '@/components/domain/brand-mark';
import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/tokens';

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 10, letterSpacing: 1.4, marginLeft: 4, marginBottom: 9, marginTop: 6 }}>
      {children}
    </AppText>
  );
}

function CreditRow({ icon, name, detail, first }: { icon: IconName; name: string; detail: string; first?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: 'rgba(22,39,30,0.07)',
      }}
    >
      <NeuSurface elevation="pressed" radius={10} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} strokeWidth={1.7} color={Palette.ever500} />
      </NeuSurface>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold" color={Palette.ever900} style={{ fontSize: 13.5 }}>{name}</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 11.5, marginTop: 1 }}>{detail}</AppText>
      </View>
    </View>
  );
}

const DATA: { icon: IconName; name: string; detail: string }[] = [
  { icon: 'database', name: 'GBIF', detail: 'Global occurrence data for species ranges' },
  { icon: 'database', name: 'Plant.id', detail: 'Identification & disease detection' },
  { icon: 'database', name: 'Anthropic Claude', detail: 'Care guidance & explanations' },
  { icon: 'database', name: 'OpenWeather', detail: 'Local forecasts & climate' },
];

export default function AcknowledgementsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Acknowledgements" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 10 }}>
          <BrandMark size={48} animate="bloom" />
          <AppText variant="body" tone="muted" align="center" style={{ fontSize: 14, lineHeight: 21, marginTop: 14, paddingHorizontal: 8 }}>
            Evergreen stands on the shoulders of a generous plant community, open science, and beautiful tools.{' '}
            <AppText variant="bodyBold" color={Palette.ever900} style={{ fontSize: 14 }}>Thank you!</AppText>
          </AppText>
        </View>

        <SectionLabel>Data & science</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden', marginBottom: 18 }}>
          {DATA.map((d, i) => (
            <CreditRow key={d.name} icon={d.icon} name={d.name} detail={d.detail} first={i === 0} />
          ))}
        </NeuSurface>

        <SectionLabel>And especially</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden' }}>
          <CreditRow first icon="people" name="Every gardener" detail="Who shared a photo, a tip, or a rescue." />
        </NeuSurface>
      </ScrollView>
    </View>
  );
}
