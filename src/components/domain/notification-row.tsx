/** NotificationRow — an item in the unified Notifications screen (Care/Community/System). */
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { fontFamily } from '@/constants/fonts';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

type IconTone = 'care' | 'warn' | 'streak' | 'sys';

export type NotificationItem = {
  id: string;
  kind: 'care' | 'community' | 'system';
  iconTone?: IconTone;
  icon: IconName;
  /** emphasized fragment (handle / plant name) rendered in deep green */
  emphasis?: string;
  title: string;
  body: string;
  atLabel: string;
  read: boolean;
};

export type NotificationRowProps = {
  notification: NotificationItem;
  onPress: () => void;
};

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const t = useTheme();
  const ICON_COLOR: Record<IconTone, string> = {
    care: Palette.ever500,
    warn: Palette.warning,
    streak: Palette.terra,
    sys: t.fgMuted,
  };
  const iconColor = ICON_COLOR[notification.iconTone ?? 'care'];
  const unread = !notification.read;

  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.md }}>
      <NeuSurface elevation="pressed" radius={11} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={notification.icon} size={19} color={iconColor} filled={notification.iconTone === 'streak'} />
      </NeuSurface>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontFamily: fontFamily('display', '600'), fontSize: 13.5 }} color={t.fg}>
          {notification.emphasis ? (
            <AppText style={{ fontFamily: fontFamily('display', '600'), fontSize: 13.5 }} color={t.ever700}>
              {notification.emphasis}
            </AppText>
          ) : null}
          {notification.emphasis ? ' ' : ''}
          {notification.title}
        </AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {notification.body}
        </AppText>
        <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9.5, marginTop: 4 }} tone="subtle">
          {notification.atLabel}
        </AppText>
      </View>
      {unread ? <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: Palette.ever400, marginTop: 6 }} /> : null}
    </View>
  );

  if (unread) {
    return (
      <NeuPressable onPress={onPress} elevation="raised-sm" radius={15} stretch accessibilityLabel={notification.title} style={{ marginBottom: 4 }}>
        {row}
      </NeuPressable>
    );
  }
  return (
    <NeuSurface elevation="flat" radius={15} stretch style={{ marginBottom: 4 }}>
      {row}
    </NeuSurface>
  );
}
