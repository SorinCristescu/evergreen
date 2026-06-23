import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { BrandMark } from '@/components/domain/brand-mark';
import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Wordmark } from '@/components/ui/wordmark';
import { Palette, Spacing } from '@/constants/tokens';

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 10, letterSpacing: 1.4, marginLeft: 4, marginBottom: 9, marginTop: 6 }}>
      {children}
    </AppText>
  );
}

function Row({
  icon,
  label,
  end,
  first,
  onPress,
}: {
  icon: IconName;
  label: string;
  end: 'ext' | 'chev';
  first?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
          paddingVertical: 14,
          paddingHorizontal: 14,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: 'rgba(22,39,30,0.07)',
        }}
      >
        <NeuSurface elevation="pressed" radius={10} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} strokeWidth={1.7} color={Palette.ever500} />
        </NeuSurface>
        <AppText variant="bodyBold" color={Palette.ever900} style={{ flex: 1, fontSize: 14 }}>{label}</AppText>
        {end === 'ext' ? (
          <Icon name="arrowUpRight" size={15} strokeWidth={2} tone="subtle" />
        ) : (
          <Icon name="chevronRight" size={18} tone="subtle" />
        )}
      </View>
    </Pressable>
  );
}

export default function AboutScreen() {
  const router = useRouter();
  const go = (p: string) => () => router.push(p as never);
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="About & legal" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: 4, marginTop: 18, marginBottom: 14 }}>
          <BrandMark size={64} animate="bloom" />
          <View style={{ marginTop: 8 }}>
            <Wordmark size={26} />
          </View>
          <AppText variant="meta" tone="subtle" style={{ fontSize: 11, letterSpacing: 0.5, marginTop: 4 }}>
            Version 1.0.0 · build 142
          </AppText>
        </View>

        <SectionLabel>Legal</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden', marginBottom: 18 }}>
          <Row first icon="doc" label="Terms of Service" end="ext" onPress={go('/(app)/profile/settings/terms')} />
          <Row icon="shield" label="Privacy Policy" end="ext" onPress={go('/(app)/profile/settings/privacy')} />
          <Row icon="heart" label="Acknowledgements" end="chev" onPress={go('/(app)/profile/settings/acknowledgements')} />
        </NeuSurface>

        <SectionLabel>Safety & feedback</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden', marginBottom: 22 }}>
          <Row first icon="ban" label="Blocked accounts" end="chev" onPress={go('/(app)/profile/settings/blocked')} />
          <Row icon="star" label="Rate Evergreen" end="ext" onPress={go('/(app)/profile/settings/rate')} />
        </NeuSurface>

        <View style={{ alignItems: 'center', gap: 3 }}>
          <AppText variant="small" tone="subtle" align="center" style={{ fontSize: 12 }}>Made for plant people, with care.</AppText>
          <AppText variant="small" tone="subtle" align="center" style={{ fontSize: 12 }}>
            <AppText variant="bodyBold" tone="muted" style={{ fontSize: 12 }}>© 2026 Evergreen</AppText> · Lisbon
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
