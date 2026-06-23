import { Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon, type IconName } from '@/components/icon';
import { NeuSurface, NeuPressable } from '@/components/neu-surface';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 10, letterSpacing: 1.4, marginLeft: 4, marginBottom: 9, marginTop: 6 }}>
      {children}
    </AppText>
  );
}

function Well({ icon, glyph }: { icon?: IconName; glyph?: string }) {
  const t = useTheme();
  return (
    <NeuSurface elevation="pressed" radius={10} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
      {glyph ? (
        <AppText variant="bodyBold" color={t.ever700} style={{ fontSize: 15 }}>{glyph}</AppText>
      ) : icon ? (
        <Icon name={icon} size={18} strokeWidth={1.7} color={Palette.ever500} />
      ) : null}
    </NeuSurface>
  );
}

function RowFrame({
  children,
  first,
  onPress,
  danger,
}: {
  children: React.ReactNode;
  first?: boolean;
  onPress?: () => void;
  danger?: boolean;
}) {
  const inner = (
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
      {children}
    </View>
  );
  if (!onPress) return inner;
  return <Pressable onPress={onPress} accessibilityRole="button">{inner}</Pressable>;
}

function PillButton({ label, ghost, onPress }: { label: string; ghost?: boolean; onPress: () => void }) {
  const t = useTheme();
  if (ghost) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6} style={{ paddingHorizontal: 13, height: 28, justifyContent: 'center' }}>
        <AppText variant="bodyBold" color={t.fgMuted} style={{ fontSize: 11 }}>{label}</AppText>
      </Pressable>
    );
  }
  return (
    <NeuPressable onPress={onPress} elevation="raised-sm" radius="pill" style={{ height: 28, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="bodyBold" color={t.ever700} style={{ fontSize: 11 }}>{label}</AppText>
    </NeuPressable>
  );
}

export default function AccountScreen() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader title="Account" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* profile card */}
        <NeuSurface elevation="raised" radius={16} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, marginTop: 8, marginBottom: 16 }}>
          <NeuSurface elevation="flat" radius="full" style={{ width: 48, height: 48, overflow: 'hidden' }}>
            <LinearGradient colors={['#4daf82', '#2c694e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="bodyBold" color={Palette.white} style={{ fontSize: 17 }}>SC</AppText>
            </LinearGradient>
          </NeuSurface>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 15 }}>Sorin C.</AppText>
            <AppText variant="meta" tone="muted" style={{ fontSize: 11, marginTop: 2 }}>sorin.t.cristescu@gmail.com</AppText>
          </View>
        </NeuSurface>

        {/* sign-in methods */}
        <SectionLabel>Sign-in methods</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden', marginBottom: 18 }}>
          <RowFrame first>
            <Well icon="mail" />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13.5 }}>Email · magic link</AppText>
              <AppText variant="small" tone="muted" style={{ fontSize: 11, marginTop: 1 }}>sorin.t.cristescu@gmail.com</AppText>
            </View>
            <AppText variant="meta" color={Palette.leaf} style={{ fontSize: 10.5 }}>Primary</AppText>
          </RowFrame>
          <RowFrame>
            <Well glyph="G" />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13.5 }}>Google</AppText>
              <AppText variant="small" tone="muted" style={{ fontSize: 11, marginTop: 1 }}>Connected</AppText>
            </View>
            <PillButton label="Disconnect" ghost onPress={() => {}} />
          </RowFrame>
          <RowFrame>
            <Well icon="apple" />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13.5 }}>Apple</AppText>
              <AppText variant="small" tone="muted" style={{ fontSize: 11, marginTop: 1 }}>Not connected</AppText>
            </View>
            <PillButton label="Connect" onPress={() => {}} />
          </RowFrame>
        </NeuSurface>

        {/* subscription */}
        <SectionLabel>Subscription</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden', marginBottom: 18 }}>
          <RowFrame first onPress={() => {}}>
            <Well icon="star" />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13.5 }}>evergreen+ · trial</AppText>
              <AppText variant="small" tone="muted" style={{ fontSize: 11, marginTop: 1 }}>6 days left · manage in store</AppText>
            </View>
            <Icon name="chevronRight" size={18} tone="subtle" />
          </RowFrame>
        </NeuSurface>

        {/* your data */}
        <SectionLabel>Your data</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden' }}>
          <RowFrame first onPress={() => {}}>
            <Well icon="download" />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13.5 }}>Export my data</AppText>
              <AppText variant="small" tone="muted" style={{ fontSize: 11, marginTop: 1 }}>Plants, journals & photos as a zip</AppText>
            </View>
            <Icon name="chevronRight" size={18} tone="subtle" />
          </RowFrame>
          <RowFrame onPress={() => {}}>
            <NeuSurface elevation="pressed" radius={10} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trash" size={18} strokeWidth={1.7} color={Palette.danger} />
            </NeuSurface>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" color={Palette.danger} style={{ fontSize: 13.5 }}>Delete account</AppText>
              <AppText variant="small" tone="muted" style={{ fontSize: 11, marginTop: 1 }}>Permanently remove your account & data</AppText>
            </View>
            <Icon name="chevronRight" size={18} tone="subtle" />
          </RowFrame>
        </NeuSurface>
      </ScrollView>
    </View>
  );
}
