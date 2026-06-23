/** ChallengeCard — a community challenge summary. `.chcard` in evergreen-community.html. */
import { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type Challenge = {
  id: string;
  title: string;
  description: string;
  metaLabel: string; // "Ends in 12 days · 248 entries"
};

export type ChallengeCardProps = {
  challenge: Challenge;
  onPress: () => void;
};

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const t = useTheme();
  const [joined, setJoined] = useState(false);
  return (
    <NeuSurface radius={18} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 }}>
      <LinearGradient colors={['#4daf82', '#2c694e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="trophy" size={22} color={Palette.white} />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 14.5 }}>{challenge.title}</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 12, marginTop: 1 }}>{challenge.description}</AppText>
        <AppText variant="meta" tone="subtle" style={{ fontSize: 10, marginTop: 4 }}>{challenge.metaLabel}</AppText>
      </View>
      <NeuPressable onPress={() => setJoined((j) => !j)} elevation="raised-sm" radius={999} accessibilityLabel={joined ? 'Joined' : 'Join'} style={{ height: 34, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="bodyBold" color={joined ? Palette.ever500 : t.ever700} style={{ fontSize: 12.5 }}>{joined ? 'Joined' : 'Join'}</AppText>
      </NeuPressable>
    </NeuSurface>
  );
}
