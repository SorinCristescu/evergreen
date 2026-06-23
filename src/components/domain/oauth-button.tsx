/** OAuthButton — provider sign-in button on Login (handoff `.btn.oauth`): light raised
 * neumorphic button with a leading brand mark (Google "G" text, Apple logo). */
import { ActivityIndicator, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { fontFamily } from '@/constants/fonts';
import { Palette, Radius } from '@/constants/tokens';
import { useTheme } from '@/theme';

type Provider = 'google' | 'apple';

const LABEL: Record<Provider, string> = {
  google: 'Continue with Google',
  apple: 'Continue with Apple',
};

export type OAuthButtonProps = {
  provider: Provider;
  onPress: () => void;
  loading?: boolean;
};

export function OAuthButton({ provider, onPress, loading = false }: OAuthButtonProps) {
  const t = useTheme();
  return (
    <NeuPressable
      onPress={onPress}
      disabled={loading}
      radius={Radius.md}
      elevation="raised"
      stretch
      backgroundColor={t.ever100}
      accessibilityLabel={LABEL[provider]}
      style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
    >
      <View style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <ActivityIndicator color={Palette.ever400} />
        ) : provider === 'google' ? (
          <AppText color={Palette.ever400} style={{ fontFamily: fontFamily('display', '700'), fontSize: 17, lineHeight: 20 }}>G</AppText>
        ) : (
          <Icon name="apple" size={18} color={Palette.ever400} />
        )}
      </View>
      <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>{LABEL[provider]}</AppText>
    </NeuPressable>
  );
}
