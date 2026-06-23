/** ScreenHeader — nav bar for pushed (non-tab) screens: back + title (components.md Tier 3). */
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { Spacing } from '@/constants/tokens';

export type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, trailing }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
      }}
    >
      <IconButton
        icon="back"
        accessibilityLabel="Back"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/profile')))}
      />
      <AppText variant="title" style={{ flex: 1, fontSize: 14, lineHeight: 18.2 }} numberOfLines={1}>
        {title}
      </AppText>
      {trailing}
    </View>
  );
}
