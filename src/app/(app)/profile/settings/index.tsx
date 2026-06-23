import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/app-text';
import { NavRow } from '@/components/ui/nav-row';
import { Palette, Spacing } from '@/constants/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [careAlerts, setCareAlerts] = useState(true);

  const go = (p: string) => () => router.push(p as never);

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.xl, paddingBottom: 120 }}>
        <View style={{ gap: Spacing.sm }}>
          <AppText variant="meta" tone="subtle" uppercase>Notifications</AppText>
          <NavRow label="Care reminders" leadingIcon="bell" trailing={<Switch value={careAlerts} onValueChange={setCareAlerts} trackColor={{ true: Palette.ever500 }} />} showChevron={false} />
          <NavRow label="Notification settings" leadingIcon="bell" onPress={go('/(app)/notifications')} />
        </View>

        <View style={{ gap: Spacing.sm }}>
          <AppText variant="meta" tone="subtle" uppercase>App</AppText>
          <NavRow label="Permissions" leadingIcon="lock" onPress={go('/(app)/profile/settings/permissions')} />
          <NavRow label="Dark mode" leadingIcon="settings" trailing={<Switch value={dark} onValueChange={setDark} trackColor={{ true: Palette.ever500 }} />} showChevron={false} />
          <NavRow label="Account" leadingIcon="user" onPress={go('/(app)/profile/settings/account')} />
          <NavRow label="Blocked accounts" leadingIcon="close" onPress={go('/(app)/profile/settings/blocked')} />
        </View>

        <View style={{ gap: Spacing.sm }}>
          <AppText variant="meta" tone="subtle" uppercase>About</AppText>
          <NavRow label="About Evergreen" leadingIcon="leaf" onPress={go('/(app)/profile/settings/about')} />
          <NavRow label="Rate Evergreen" leadingIcon="star" onPress={go('/(app)/profile/settings/rate')} />
          <NavRow label="Terms of Service" onPress={go('/(app)/profile/settings/terms')} />
          <NavRow label="Privacy Policy" onPress={go('/(app)/profile/settings/privacy')} />
          <NavRow label="Acknowledgements" onPress={go('/(app)/profile/settings/acknowledgements')} />
        </View>
      </ScrollView>
    </View>
  );
}
