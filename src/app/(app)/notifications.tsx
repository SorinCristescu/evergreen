import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { NotificationRow, type NotificationItem } from '@/components/domain/notification-row';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { fontFamily } from '@/constants/fonts';
import { NeuPressable } from '@/components/neu-surface';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

const ALL: NotificationItem[] = [
  { id: 'n1', kind: 'care', iconTone: 'warn', icon: 'droplet', emphasis: 'Mara', title: 'needs water', body: 'Overdue by 1 day · Living Room', atLabel: '2h ago', read: false },
  { id: 'n2', kind: 'care', iconTone: 'care', icon: 'fertilize', title: 'Fertilize Rosemary', body: 'Due today · Balcony', atLabel: '5h ago', read: false },
  { id: 'n3', kind: 'care', iconTone: 'streak', icon: 'flame', title: 'Your streak hit 12 days', body: 'Three tasks today keeps it alive.', atLabel: '1d ago', read: true },
  { id: 'n4', kind: 'community', iconTone: 'care', icon: 'heart', emphasis: '@fernfiend', title: 'liked your post', body: '“New leaf unfurling”', atLabel: '3h ago', read: false },
  { id: 'n5', kind: 'community', iconTone: 'care', icon: 'comment', emphasis: '@leaf.lydia', title: 'replied to your swap', body: 'Pilea pups ×3 — “See you Saturday!”', atLabel: '6h ago', read: false },
  { id: 'n6', kind: 'community', iconTone: 'care', icon: 'people', emphasis: '@potted.pete', title: 'followed you', body: 'Tap to view their garden', atLabel: '1d ago', read: true },
  { id: 'n7', kind: 'community', iconTone: 'care', icon: 'trophy', title: '#BrightWindow ends in 3 days', body: 'You’re ranked 14th of 248', atLabel: '2d ago', read: true },
  { id: 'n8', kind: 'system', iconTone: 'care', icon: 'star', title: 'Welcome to evergreen+', body: 'Your 7-day trial is active.', atLabel: '1d ago', read: true },
  { id: 'n9', kind: 'system', iconTone: 'sys', icon: 'rotate', title: 'Photos synced', body: '3 items uploaded from offline.', atLabel: '2d ago', read: true },
  { id: 'n10', kind: 'system', iconTone: 'sys', icon: 'info', title: 'Community guidelines updated', body: 'Review what’s changed.', atLabel: '3d ago', read: true },
];

const SECTIONS = [
  { key: 'care', label: 'Care' },
  { key: 'community', label: 'Community' },
  { key: 'system', label: 'System' },
] as const;

type Filter = 'all' | 'care' | 'community' | 'system';

export default function NotificationsScreen() {
  const t = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState(ALL);

  const unreadTotal = items.filter((n) => !n.read).length;
  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const chips: { key: Filter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: unreadTotal },
    { key: 'care', label: 'Care' },
    { key: 'community', label: 'Community' },
    { key: 'system', label: 'System' },
  ];

  const visibleSections = SECTIONS.filter((s) => filter === 'all' || filter === s.key);

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader
        title="Notifications"
        trailing={
          <Pressable onPress={markAllRead} disabled={unreadTotal === 0} accessibilityRole="button" style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
            <AppText
              style={{ fontFamily: fontFamily('body', '600'), fontSize: 12, opacity: unreadTotal === 0 ? 0.6 : 1 }}
              color={unreadTotal === 0 ? t.fgSubtle : Palette.ever400}
            >
              Mark all read
            </AppText>
          </Pressable>
        }
      />

      {/* chip tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ gap: 7, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12 }}>
        {chips.map((c) => {
          const active = filter === c.key;
          return (
            <NeuPressable
              key={c.key}
              onPress={() => setFilter(c.key)}
              elevation="raised-sm"
              radius="full"
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{ height: 32, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}
            >
              <AppText style={{ fontFamily: fontFamily('body', active ? '600' : '500'), fontSize: 12.5 }} color={active ? t.ever700 : t.fgMuted}>
                {c.label}
              </AppText>
              {c.count ? (
                <View style={{ minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 999, backgroundColor: t.accentTint, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9 }} color={Palette.ever500}>{c.count}</AppText>
                </View>
              ) : null}
            </NeuPressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {visibleSections.map((s) => {
          const rows = items.filter((n) => n.kind === s.key);
          if (rows.length === 0) return null;
          const newCount = rows.filter((n) => !n.read).length;
          return (
            <View key={s.key}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 9, paddingHorizontal: 4 }}>
                <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 10, letterSpacing: 1.4 }} tone="subtle" uppercase>
                  {s.label}
                </AppText>
                <View style={{ flex: 1 }} />
                {newCount ? (
                  <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 10, letterSpacing: 1.4 }} tone="subtle" uppercase>
                    {newCount} new
                  </AppText>
                ) : null}
              </View>
              {rows.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onPress={() => setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
