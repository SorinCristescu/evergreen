import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { AppText } from '@/components/ui/app-text';
import { Toggle } from '@/components/ui/toggle';
import { fontFamily } from '@/constants/fonts';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme, useThemeControls } from '@/theme';
import { useAvatarUpload, useEntitlement, useLocations, useProfile } from '@/data';

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 10.5, letterSpacing: 1.4, marginLeft: 2, marginBottom: 10, marginTop: 6 }}>
      {children}
    </AppText>
  );
}

function Row({
  icon,
  title,
  sub,
  count,
  gated,
  first,
  onPress,
  trailing,
}: {
  icon: IconName;
  title: string;
  sub?: string;
  count?: string;
  gated?: boolean;
  first?: boolean;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const t = useTheme();
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
      <NeuSurface elevation="pressed" radius={11} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={gated ? Palette.warning : Palette.ever500} />
      </NeuSurface>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 14 }}>{title}</AppText>
          {gated ? <Icon name="lock" size={13} color={Palette.warning} /> : null}
        </View>
        {sub ? <AppText variant="small" tone="muted" style={{ fontSize: 11.5, marginTop: 1 }}>{sub}</AppText> : null}
      </View>
      {count ? <AppText variant="meta" tone="subtle" style={{ fontSize: 11 }}>{count}</AppText> : null}
      {trailing ?? <Icon name="chevronRight" size={18} tone="subtle" />}
    </View>
  );
  if (!onPress) return inner;
  return <Pressable onPress={onPress} accessibilityLabel={title}>{inner}</Pressable>;
}

export default function ProfileScreen() {
  const t = useTheme();
  const profile = useProfile();
  const router = useRouter();
  const locations = useLocations() ?? [];
  const canAdd = useEntitlement() === 'plus';
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    router.replace('/'); // back to the splash → login flow
  };
  const insets = useSafeAreaInsets();
  const { name: themeName, setName: setTheme } = useThemeControls();
  const dark = themeName === 'dark';
  const uploadAvatar = useAvatarUpload();
  // Local preview shown immediately while the upload + Convex round-trip completes.
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Tap the avatar → pick a photo, preview it, then upload it as the saved avatar.
  const pickAvatar = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPreview(asset.uri);
    setUploading(true);
    try {
      await uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return null;

  // Prefer the freshly-picked preview, then the saved avatar from Convex.
  const avatarUri = preview ?? profile.avatarUrl ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      {/* Fixed: identity, stats and the evergreen+ card stay put while the rest scrolls */}
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: insets.top }}>
        {/* header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 8 }}>
          <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Change profile photo" style={{ width: 60, height: 60 }}>
            <NeuSurface elevation="raised-sm" radius="full" style={{ width: 60, height: 60, overflow: 'hidden' }}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ flex: 1, borderRadius: 999 }} contentFit="cover" />
              ) : (
                <LinearGradient colors={['#4daf82', '#2c694e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText variant="bodyBold" color={Palette.white} style={{ fontSize: 21 }}>
                    {profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </AppText>
                </LinearGradient>
              )}
              {uploading ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,30,21,0.35)' }}>
                  <ActivityIndicator color={Palette.white} />
                </View>
              ) : null}
            </NeuSurface>
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 23, height: 23, borderRadius: 999, backgroundColor: t.ever100, alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 5px rgba(11,30,21,0.18)' } as never}>
              <Icon name="camera" size={13} tone="accent" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="display2" style={{ fontSize: 16.1, lineHeight: 21 }}>{profile.name}</AppText>
          </View>
        </View>

        {/* stats — three separate cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 16 }}>
          {[
            { label: 'Plants', value: profile.stats.plants, color: t.ever700 },
            { label: 'Day streak', value: profile.stats.streak, color: Palette.terra },
            { label: 'Tasks done', value: profile.stats.tasksDone, color: t.ever700 },
          ].map((s) => (
            <NeuSurface key={s.label} elevation="raised" radius={15} style={{ flex: 1, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center' }}>
              <AppText variant="meta" color={s.color} style={{ fontSize: 22, lineHeight: 26 }}>{s.value}</AppText>
              <AppText variant="small" tone="muted" align="center" style={{ fontSize: 10.5, marginTop: 2 }}>{s.label}</AppText>
            </NeuSurface>
          ))}
        </View>

        {/* evergreen+ premium card */}
        {profile.entitlement === 'free' ? (
          <View style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 18 }}>
            <LinearGradient colors={['#1b4332', '#0c1f17']} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ padding: 18 }}>
              <View style={{ position: 'absolute', top: 14, right: 16 }}>
                <Icon name="star" size={20} color={Palette.ever400} filled />
              </View>
              <AppText variant="bodyBold" style={{ fontSize: 18 }}>
                <AppText variant="bodyBold" color="#eaf3ed" style={{ fontSize: 18 }}>ever</AppText>
                <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 18 }}>green</AppText>
                <AppText variant="bodyBold" color="#eaf3ed" style={{ fontSize: 18 }}>+</AppText>
              </AppText>
              <AppText variant="small" color="#bfe0cf" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 18, maxWidth: 210 }}>
                Multiple homes, Dr. Plant, unlimited IDs & community posting.
              </AppText>
              <Pressable onPress={() => {}} accessibilityLabel="Start free trial" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 38, paddingHorizontal: 16, borderRadius: 11, backgroundColor: '#eaf3ed', alignSelf: 'flex-start', marginTop: 13 }}>
                <AnimatedIcon name="star" size={16} color={Palette.ever400} motion="pulse" />
                <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 13 }}>Start free trial</AppText>
              </Pressable>
            </LinearGradient>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xs, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Your locations */}
        <SectionLabel>Your locations</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden', marginBottom: 18 }}>
          {locations.map((loc, i) => (
            <Row
              key={loc.id}
              first={i === 0}
              icon="pin"
              title={`${loc.name} · ${loc.climateLabel}`}
              sub={`${loc.locked ? 'Locked · ' : ''}${loc.plantCount} plant${loc.plantCount === 1 ? '' : 's'}`}
              onPress={() => router.push('/(app)/profile/locations')}
            />
          ))}
          <Row
            icon="plus"
            title="Add a location"
            sub={canAdd ? 'Manage your places' : 'evergreen+ unlocks multiple homes'}
            gated={!canAdd}
            first={locations.length === 0}
            onPress={() => router.push('/(app)/profile/locations')}
          />
        </NeuSurface>

        {/* Your garden, kept */}
        <SectionLabel>Your garden, kept</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden', marginBottom: 18 }}>
          <Row first icon="heart" title="Memorial" count="2" onPress={() => router.push('/(app)/profile/memorial')} />
          <Row icon="star" title="Wishlist" count="5" onPress={() => router.push('/(app)/profile/wishlist')} />
          <Row icon="history" title="Identification history" count="14" onPress={() => router.push('/(app)/profile/identification-history')} />
        </NeuSurface>

        {/* Settings */}
        <SectionLabel>Settings</SectionLabel>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden' }}>
          <Row first icon="bell" title="Notifications" onPress={() => router.push('/(app)/notifications')} />
          <Row icon="shield" title="Permissions" onPress={() => router.push('/(app)/profile/settings/permissions')} />
          <Row icon="moon" title="Dark theme" sub={dark ? 'On' : 'Off'} trailing={<Toggle value={dark} onChange={(v) => setTheme(v ? 'dark' : 'light')} accessibilityLabel="Toggle dark theme" />} />
          <Row icon="user" title="Account" sub="Export · delete" onPress={() => router.push('/(app)/profile/settings/account')} />
          <Row icon="info" title="About & legal" onPress={() => router.push('/(app)/profile/settings/about')} />
        </NeuSurface>

        <NeuPressable onPress={handleSignOut} radius={16} elevation="raised" stretch accessibilityLabel="Sign out" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, marginTop: Spacing.lg }}>
          <Icon name="back" size={18} color={Palette.danger} />
          <AppText variant="bodyBold" color={Palette.danger} style={{ fontSize: 15 }}>Sign out</AppText>
        </NeuPressable>
      </ScrollView>
    </View>
  );
}
