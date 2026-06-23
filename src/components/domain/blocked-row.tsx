/** BlockedRow — a blocked account with Unblock (Blocked Accounts screen). */
import { View } from 'react-native';

import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/tokens';
import type { GardenerRef, ID } from '@/data';

export type BlockedRowProps = {
  user: GardenerRef;
  onUnblock: (userId: ID) => void;
};

export function BlockedRow({ user, onUnblock }: BlockedRowProps) {
  return (
    <NeuSurface elevation="raised-sm" radius="md" stretch style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md }}>
      <Avatar name={user.name} uri={user.avatarUrl} size="sm" />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold">{user.name}</AppText>
        <AppText variant="small" tone="subtle">@{user.handle}</AppText>
      </View>
      <Button label="Unblock" variant="secondary" size="sm" onPress={() => onUnblock(user.id)} />
    </NeuSurface>
  );
}
