/** StepScaffold — shared shell for onboarding steps: progress bar + back + kicker + footer. */
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/domain/brand-mark';
import { Icon } from '@/components/icon';
import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

/** One progress segment that eases between empty and filled as the step advances. */
function StepSegment({ filled }: { filled: boolean }) {
  const v = useSharedValue(filled ? 1 : 0.25);
  useEffect(() => {
    v.value = withTiming(filled ? 1 : 0.25, { duration: 420, easing: Easing.inOut(Easing.cubic) });
  }, [v, filled]);
  const style = useAnimatedStyle(() => ({ opacity: v.value }));
  return <Animated.View style={[{ flex: 1, height: 6, borderRadius: 999, backgroundColor: Palette.ever400 }, style]} />;
}

/** Continue arrow with a gentle, looping rightward nudge. */
function ContinueArrow() {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(5, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View style={style}>
      <Icon name="arrowRight" size={18} color={Palette.ever400} />
    </Animated.View>
  );
}

export type StepScaffoldProps = {
  step: number; // 1-based
  totalSteps: number;
  kicker: string; // e.g. "Step 1 · Location"
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
  subnote?: string;
  showMark?: boolean;
  markAlign?: 'center' | 'left';
  scroll?: boolean;
};

export function StepScaffold({
  step,
  totalSteps,
  kicker,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled = false,
  onSkip,
  skipLabel = 'Skip',
  subnote,
  showMark = false,
  markAlign = 'center',
  scroll = false,
}: StepScaffoldProps) {
  const insets = useSafeAreaInsets();
  const t = useTheme();

  const head = (
    <>
      {showMark ? (
        <View style={{ alignItems: markAlign === 'center' ? 'center' : 'flex-start', marginTop: Spacing.lg, marginBottom: Spacing.xs }}>
          <BrandMark size={64} animate="bloom" />
        </View>
      ) : null}
      <View style={{ marginTop: Spacing.lg, gap: 6, alignItems: markAlign === 'center' && showMark ? 'center' : 'flex-start' }}>
        <AppText variant="meta" tone="brand" uppercase style={{ letterSpacing: 2 }}>
          {kicker}
        </AppText>
        <AppText variant="display2">{title}</AppText>
        {subtitle ? <AppText variant="body" tone="muted" align={markAlign === 'center' && showMark ? 'center' : 'left'}>{subtitle}</AppText> : null}
      </View>
    </>
  );

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: { paddingTop: Spacing.xxl, paddingBottom: Spacing.md }, showsVerticalScrollIndicator: false, style: { flex: 1 } }
    : { style: { marginTop: Spacing.xxl, flex: 1 } };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingHorizontal: Spacing.xl, paddingBottom: insets.bottom + Spacing.lg }}>
      {/* Progress header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 44 }}>
        <NeuPressable onPress={onBack ?? (() => {})} radius="full" elevation="raised-sm" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Back">
          <Icon name="back" size={20} tone="default" />
        </NeuPressable>
        <View style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <StepSegment key={i} filled={i < step} />
          ))}
        </View>
        <AppText variant="meta" tone="muted">
          {step}/{totalSteps}
        </AppText>
      </View>

      {head}

      <Body {...(bodyProps as any)}>{children}</Body>

      {/* Footer */}
      <View style={{ gap: Spacing.sm }}>
        {/* When a Skip action exists (step 6), order is: subnote text → Skip → Continue.
            Otherwise: Continue → subnote. */}
        {onSkip ? (
          <NeuPressable onPress={onSkip} radius={Radius.md} elevation="raised" stretch backgroundColor={t.ever100} accessibilityLabel={skipLabel} style={{ height: 50, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="bodyBold" color={t.ever700} style={{ fontSize: 15 }}>{skipLabel}</AppText>
          </NeuPressable>
        ) : null}
        {onSkip && subnote ? <AppText variant="small" tone="subtle" align="center">{subnote}</AppText> : null}
        <NeuPressable
          onPress={() => !nextDisabled && onNext()}
          radius={Radius.md}
          elevation="raised"
          stretch
          backgroundColor={t.ever100}
          accessibilityLabel={nextLabel}
          accessibilityState={{ disabled: nextDisabled }}
          style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: nextDisabled ? 0.5 : 1 }}
        >
          <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>{nextLabel}</AppText>
          <ContinueArrow />
        </NeuPressable>
        {!onSkip && subnote ? <AppText variant="small" tone="subtle" align="center">{subnote}</AppText> : null}
      </View>
    </View>
  );
}
