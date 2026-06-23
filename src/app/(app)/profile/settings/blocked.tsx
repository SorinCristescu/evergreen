import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/icon';
import { NeuSurface, NeuPressable } from '@/components/neu-surface';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Blocked = { id: string; initials: string; handle: string; when: string };

const INITIAL: Blocked[] = [
  { id: 'b1', initials: 'SS', handle: '@spammy.sam', when: 'Blocked · 3 days ago' },
  { id: 'b2', initials: 'RR', handle: '@rude.rick', when: 'Blocked · 2 weeks ago' },
  { id: 'b3', initials: 'BA', handle: '@bot.account', when: 'Blocked · 1 month ago' },
];

function BlockedRow({ user, onUnblock }: { user: Blocked; onUnblock: () => void }) {
  const t = useTheme();
  return (
    <NeuSurface elevation="raised" radius={16} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13 }}>
      <NeuSurface elevation="flat" radius="full" style={{ width: 42, height: 42, overflow: 'hidden' }}>
        <LinearGradient colors={['#7d8a86', '#4a534f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="bodyBold" color={Palette.white} style={{ fontSize: 14 }}>{user.initials}</AppText>
        </LinearGradient>
      </NeuSurface>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 14 }}>{user.handle}</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 11.5, marginTop: 1 }}>{user.when}</AppText>
      </View>
      <NeuPressable onPress={onUnblock} elevation="raised-sm" radius="pill" style={{ height: 32, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="bodyBold" color={t.ever700} style={{ fontSize: 12.5 }}>Unblock</AppText>
      </NeuPressable>
    </NeuSurface>
  );
}

export default function BlockedScreen() {
  const [blocked, setBlocked] = useState<Blocked[]>(INITIAL);
  const unblock = (id: string) => setBlocked((b) => b.filter((u) => u.id !== id));
  const t = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader
        title="Blocked accounts"
        trailing={<AppText variant="meta" tone="subtle" style={{ fontSize: 11, paddingRight: 6 }}>{blocked.length}</AppText>}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <NeuSurface
          elevation="pressed"
          radius={14}
          stretch
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 11, paddingHorizontal: 13, marginTop: 8, marginBottom: 16 }}
        >
          <Icon name="shield" size={15} strokeWidth={1.7} color={Palette.ever500} />
          <AppText variant="small" tone="muted" style={{ flex: 1, fontSize: 12, lineHeight: 18 }}>
            Blocked gardeners can’t follow you, message you, or see your posts. Unblock anyone whenever you like.
          </AppText>
        </NeuSurface>

        <View style={{ gap: 10 }}>
          {blocked.length ? (
            blocked.map((u) => <BlockedRow key={u.id} user={u} onUnblock={() => unblock(u.id)} />)
          ) : (
            <NeuSurface elevation="raised" radius={16} stretch style={{ padding: Spacing.xxl, alignItems: 'center', gap: 8 }}>
              <Icon name="ban" size={30} strokeWidth={1.6} tone="subtle" />
              <AppText variant="bodyBold" color={t.fg}>No one’s blocked</AppText>
              <AppText variant="small" tone="subtle" align="center">People you block will show up here so you can unblock them.</AppText>
            </NeuSurface>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
