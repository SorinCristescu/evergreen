import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/domain/brand-mark';
import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { AppText } from '@/components/ui/app-text';
import { Wordmark } from '@/components/ui/wordmark';
import { Palette, Radius, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

const LOOP: { icon: IconName; label: string; description: string }[] = [
  { icon: 'scan', label: 'Identify', description: 'Point your camera, know any plant.' },
  { icon: 'droplet', label: 'Care', description: 'A routine tuned to your home, gentle reminders.' },
  { icon: 'warning', label: 'Diagnose', description: 'Spot trouble early with Dr. Plant.' },
  { icon: 'people', label: 'Connect', description: 'Share wins with fellow gardeners.' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.lg }}>
        <View style={{ alignItems: 'center', gap: 6, marginBottom: Spacing.sm }}>
          <BrandMark size={72} animate="bloom" />
          <AppText variant="meta" tone="brand" uppercase style={{ letterSpacing: 2, marginTop: Spacing.sm }}>
            Welcome to
          </AppText>
          <Wordmark size={30} />
          <AppText variant="body" tone="subtle" align="center" style={{ marginTop: 4 }}>
            Everything you need to keep them thriving — in one calm place.
          </AppText>
        </View>

        <NeuSurface elevation="raised" radius={20} stretch style={{ paddingHorizontal: Spacing.lg }}>
          {LOOP.map((l, i) => (
            <View
              key={l.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingVertical: Spacing.md,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: 'rgba(125,148,136,0.18)',
              }}
            >
              <NeuSurface elevation="pressed" radius={13} style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={l.icon} size={22} tone="accent" />
              </NeuSurface>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{l.label}</AppText>
                <AppText variant="small" tone="subtle">{l.description}</AppText>
              </View>
              <AppText variant="meta" tone="subtle">{`0${i + 1}`}</AppText>
            </View>
          ))}
        </NeuSurface>

        <NeuPressable
          onPress={() => router.replace('/(app)/(tabs)/garden')}
          radius={Radius.md}
          elevation="raised"
          stretch
          backgroundColor={t.ever100}
          accessibilityLabel="Enter your garden"
          style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Enter your garden</AppText>
          <AnimatedIcon name="arrowUpRight" size={18} color={Palette.ever400} motion="nudge" />
        </NeuPressable>

        <Pressable onPress={() => router.replace('/(app)/(tabs)/garden')} style={{ alignItems: 'center', paddingVertical: Spacing.xs }}>
          <AppText variant="small" tone="muted">Take the 30-second tour</AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
