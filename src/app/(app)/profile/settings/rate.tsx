import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BrandMark } from '@/components/domain/brand-mark';
import { StarRating } from '@/components/domain/star-rating';
import { Icon, type IconName } from '@/components/icon';
import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Palette, Radius, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

// Star → label, mirroring the handoff's LABELS array.
const LABELS = ['Tap a star to rate', 'Not great', 'Could be better', "It's okay", 'Really good!', 'Love it!'];

/** Full-width CTA with a circular accent-tint arrow badge (the handoff `.btn .arr`). */
function ActionButton({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  const t = useTheme();
  return (
    <NeuPressable
      onPress={onPress}
      radius={Radius.md}
      elevation="raised"
      stretch
      backgroundColor={t.ever100}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: Spacing.lg }}
    >
      <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>{label}</AppText>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.accentTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={15} color={Palette.ever400} />
      </View>
    </NeuPressable>
  );
}

export default function RateScreen() {
  const t = useTheme();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const high = rating >= 4;
  const rated = rating > 0;
  const dismiss = () => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/profile'));

  const title = !rated ? null : high ? 'You made our day' : 'Thanks for the honesty';
  const subtitle = !rated
    ? 'Your rating helps more plant people find us.'
    : high
      ? "We're so glad you're growing with us."
      : 'Tell us what fell short — we read every note.';

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader title="" onBack={dismiss} />
      <View style={{ flex: 1, paddingHorizontal: Spacing.xl }}>
        {/* Top region (weighted heavier to push everything lower) — fixed group: logo, title,
            subtitle, stars, label. Bottom-aligned so it sits low and holds its position across states. */}
        <View style={{ flex: 1.7, alignItems: 'center', justifyContent: 'flex-end' }}>
          <BrandMark size={72} animate="bloom" />

          {rated ? (
            <AppText variant="title" align="center" style={{ fontSize: 24, marginTop: 28 }}>{title}</AppText>
          ) : (
            <AppText variant="title" align="center" style={{ fontSize: 24, marginTop: 28 }}>
              Enjoying ever
              <AppText variant="title" color={Palette.ever400} style={{ fontSize: 24 }}>green</AppText>
              ?
            </AppText>
          )}

          <AppText variant="body" tone="muted" align="center" style={{ fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 250, minHeight: 42 }}>
            {subtitle}
          </AppText>

          <View style={{ marginTop: 24, marginBottom: 8 }}>
            <StarRating value={rating} onChange={setRating} size={36} />
          </View>

          <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 11, letterSpacing: 1.6, marginTop: 6, minHeight: 16 }}>
            {LABELS[rating]}
          </AppText>
        </View>

        {/* Bottom half — dynamically routed actions. Low scores collect feedback; high scores go to the store. */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: Spacing.lg }}>
          {rated && !high ? (
            <View style={{ width: '100%', gap: 11 }}>
              <TextField value={feedback} onChangeText={setFeedback} placeholder="What would make evergreen better for you?" multiline />
              <ActionButton label="Send feedback" icon="arrowRight" onPress={dismiss} />
            </View>
          ) : null}

          {rated && high ? (
            <View style={{ width: '100%' }}>
              <ActionButton label="Rate on the App Store" icon="arrowUpRight" onPress={dismiss} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
