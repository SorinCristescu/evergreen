import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { fontFamily } from '@/constants/fonts';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Msg = { s: 'them' | 'me'; t: string; time: string };

const MSGS: Msg[] = [
  { s: 'them', t: 'Hey! Saw you’re after a pothos — I’ve got 3 Pilea pups to swap.', time: '9:18' },
  { s: 'me', t: 'Perfect timing. I’ve got a golden pothos cutting, well rooted.', time: '9:20' },
  { s: 'them', t: 'Amazing. Are you anywhere near Lisbon?', time: '9:21' },
  { s: 'me', t: 'Yep — Alfama. Could do a swap this weekend?', time: '9:24' },
  { s: 'them', t: 'Let’s do it. I’ll bring the pups to the plant market around 10am Saturday.', time: '9:30' },
  { s: 'me', t: 'Sounds great — see you there!', time: '9:32' },
];

function Bubble({ msg }: { msg: Msg }) {
  const t = useTheme();
  const me = msg.s === 'me';
  return (
    <View style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
      <NeuSurface
        elevation={me ? 'flat' : 'raised-sm'}
        radius={16}
        backgroundColor={me ? 'rgba(46,109,78,0.15)' : t.ever100}
        style={{
          paddingHorizontal: 13,
          paddingVertical: 9,
          borderBottomRightRadius: me ? 6 : 16,
          borderBottomLeftRadius: me ? 16 : 6,
        }}
      >
        <AppText
          variant="small"
          color={t.fg}
          style={{ fontSize: 13, lineHeight: 18 }}
        >
          {msg.t}
        </AppText>
        <AppText
          style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9, marginTop: 4, textAlign: me ? 'right' : 'left' }}
          tone="subtle"
        >
          {msg.time}
        </AppText>
      </NeuSurface>
    </View>
  );
}

export default function MessagesScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: Spacing.md,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(22,39,30,0.07)',
        }}
      >
        <IconButton icon="back" size="sm" accessibilityLabel="Back" onPress={() => router.back()} />
        {/* avatar with online dot */}
        <View style={{ width: 38, height: 38 }}>
          <View style={{ width: 38, height: 38, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            <LinearGradient colors={['#c76b4f', '#9a4733']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
            <AppText color={Palette.white} style={{ fontFamily: fontFamily('display', '600'), fontSize: 13 }}>LD</AppText>
          </View>
          <View
            style={{
              position: 'absolute',
              right: -1,
              bottom: -1,
              width: 11,
              height: 11,
              borderRadius: 999,
              backgroundColor: Palette.ever400,
              borderWidth: 2.5,
              borderColor: t.ever100,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontFamily: fontFamily('display', '600'), fontSize: 15 }} color={t.fg}>@leaf.lydia</AppText>
          <AppText style={{ fontFamily: fontFamily('body', '500'), fontSize: 11 }} color={Palette.leaf}>Active now</AppText>
        </View>
        <IconButton icon="more" size="sm" accessibilityLabel="More" onPress={() => {}} />
      </View>

      {/* Context card */}
      <NeuPressable
        onPress={() => {}}
        elevation="raised-sm"
        radius={13}
        style={{ marginHorizontal: 14, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 11, paddingVertical: 9 }}
      >
        <View style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <LinearGradient colors={['#79c6a0', '#3a8c66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
          <Icon name="leaf" size={20} color="rgba(255,255,255,0.5)" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9.5 }} color={Palette.ever500} uppercase>Swap listing</AppText>
          <AppText style={{ fontFamily: fontFamily('display', '600'), fontSize: 12.5 }} color={t.fg}>Pilea pups ×3</AppText>
        </View>
        <Icon name="chevronRight" size={18} tone="subtle" />
      </NeuPressable>

      {/* Messages */}
      <ScrollView
        contentContainerStyle={{ padding: 14, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText
          align="center"
          style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9.5, marginVertical: 4, alignSelf: 'center' }}
          tone="subtle"
          uppercase
        >
          Today
        </AppText>
        {MSGS.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
        <View style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 2, marginRight: 4 }}>
          <Icon name="checkDouble" size={13} tone="accent" />
          <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9.5 }} tone="subtle">Read 9:32</AppText>
        </View>
      </ScrollView>

      {/* Composer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(22,39,30,0.07)',
        }}
      >
        <NeuPressable onPress={() => {}} elevation="raised-sm" radius="full" accessibilityLabel="Attach" style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={20} tone="accent" />
        </NeuPressable>
        <NeuSurface elevation="pressed" radius={20} style={{ flex: 1, minHeight: 40, justifyContent: 'center', paddingHorizontal: 14 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={t.fgSubtle}
            style={{ fontFamily: fontFamily('body', '400'), fontSize: 14, color: t.fg, padding: 0 }}
          />
        </NeuSurface>
        <NeuPressable onPress={() => setDraft('')} elevation="raised-sm" radius="full" accessibilityLabel="Send" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrowUp" size={19} tone="accent" />
        </NeuPressable>
      </View>
    </View>
  );
}
