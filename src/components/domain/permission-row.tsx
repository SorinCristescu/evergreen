/** PermissionRow — Permissions screen: what's accessed, why, status, manage. */
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Spacing } from '@/constants/tokens';

type Perm = 'camera' | 'location' | 'push' | 'photos';
type Status = 'granted' | 'denied' | 'undetermined';

const ICON: Record<Perm, IconName> = { camera: 'camera', location: 'pin', push: 'bell', photos: 'bookmark' };
const STATUS_TONE: Record<Status, 'success' | 'danger' | 'neutral'> = {
  granted: 'success',
  denied: 'danger',
  undetermined: 'neutral',
};

export type PermissionRowProps = {
  permission: Perm;
  title: string;
  why: string;
  status: Status;
  onPressManage: () => void;
};

export function PermissionRow({ permission, title, why, status, onPressManage }: PermissionRowProps) {
  return (
    <NeuSurface elevation="raised-sm" radius="md" stretch style={{ padding: Spacing.md, gap: Spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <Icon name={ICON[permission]} size={20} tone="accent" />
        <AppText variant="bodyBold" style={{ flex: 1 }}>{title}</AppText>
        <Pill label={status} tone={STATUS_TONE[status]} />
      </View>
      <AppText variant="small" tone="subtle">{why}</AppText>
      <Button label={status === 'granted' ? 'Manage in Settings' : 'Allow'} variant="secondary" size="sm" onPress={onPressManage} />
    </NeuSurface>
  );
}
