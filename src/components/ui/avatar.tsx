/** Avatar — Gardener picture with initials fallback (components.md Tier 1). */
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const DIM: Record<Size, number> = { xs: 24, sm: 32, md: 44, lg: 64, xl: 88 };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export type AvatarProps = {
  uri?: string;
  name: string;
  size?: Size;
  onPress?: () => void;
};

export function Avatar({ uri, name, size = 'md', onPress }: AvatarProps) {
  const dim = DIM[size];
  const body = (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: 999,
        backgroundColor: Palette.ever400,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      accessibilityLabel={name}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: dim, height: dim }} contentFit="cover" />
      ) : (
        <AppText variant="bodyBold" color={Palette.white} style={{ fontSize: dim * 0.36 }}>
          {initials(name)}
        </AppText>
      )}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name}>
      {body}
    </Pressable>
  ) : (
    body
  );
}
