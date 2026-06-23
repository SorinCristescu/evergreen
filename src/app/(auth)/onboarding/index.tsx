import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import * as Location from 'expo-location';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/domain/brand-mark';
import { CameraReticle } from '@/components/domain/camera-reticle';
import { StepScaffold } from '@/components/domain/step-scaffold';
import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon, type IconMotion } from '@/components/ui/animated-icon';
import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { Radio } from '@/components/ui/radio';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { coverForSeed, plantPhotoForSeed, Palette, Radius, Spacing } from '@/constants/tokens';
import { useAddLocation, useCompleteOnboarding, type Place } from '@/data';
import { useTheme } from '@/theme';

const TOTAL = 6;

// ── Step 3: experience levels ────────────────────────────────────────────────
const LEVELS: { v: string; ic: IconName; t: string; d: string }[] = [
  { v: 'beginner', ic: 'sprout', t: 'Beginner', d: 'New to plants — keep it simple, more reminders and step-by-step care.' },
  { v: 'some', ic: 'plant', t: 'Some experience', d: "I've kept a few alive — balanced detail, fewer nudges." },
  { v: 'expert', ic: 'tree', t: 'Expert', d: 'I know my genus — minimal hand-holding, advanced controls.' },
];

// ── Step 4: goals ────────────────────────────────────────────────────────────
// Each goal's checked icon animates in a way that mirrors what the card is about.
const GOALS: { v: string; ic: IconName; t: string; d: string; motion: IconMotion }[] = [
  { v: 'alive', ic: 'droplet', t: 'Keep them alive', d: 'Gentle reminders so nothing slips.', motion: 'drip' },
  { v: 'grow', ic: 'trend', t: 'Help them grow', d: 'Feeding, repotting & growth tracking.', motion: 'rise' },
  { v: 'learn', ic: 'book', t: 'Learn as I go', d: 'The why behind every task.', motion: 'flip' },
  { v: 'share', ic: 'share', t: 'Share with others', d: 'Post wins and swap with gardeners.', motion: 'broadcast' },
];

// ── Step 5: places & spaces ──────────────────────────────────────────────────
const PLACES: { key: Place; label: string; icon: IconName; spaces: string[]; motion: IconMotion }[] = [
  { key: 'indoor', label: 'Indoor', icon: 'home', spaces: ['Kitchen', 'Hallway', 'Office', 'Living Room', 'Bedroom'], motion: 'bob' },
  { key: 'outdoor', label: 'Outdoor', icon: 'sun', spaces: ['Balcony', 'Terrace', 'Patio', 'Garden bed'], motion: 'spin' },
  { key: 'greenhouse', label: 'Greenhouse', icon: 'greenhouse', spaces: ['Main bench', 'Propagation', 'Shelf'], motion: 'pulse' },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="meta" tone="subtle" uppercase style={{ letterSpacing: 1.5, marginBottom: Spacing.sm }}>
      {children}
    </AppText>
  );
}

function LevelRow({ icon, title, desc, selected, onPress }: { icon: IconName; title: string; desc: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const cardStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.md, padding: Spacing.md, minHeight: 104 };
  const inner = (
    <>
      <NeuSurface elevation={selected ? 'raised' : 'pressed'} radius={14} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
        {selected ? (
          <AnimatedIcon name={icon} size={36} color={Palette.ever400} motion="grow" />
        ) : (
          <Icon name={icon} size={36} color={t.fgSubtle} />
        )}
      </NeuSurface>
      <View style={{ flex: 1 }}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="small" tone="subtle">{desc}</AppText>
      </View>
      <View style={{ marginRight: Spacing.sm }}>
        <Radio selected={selected} />
      </View>
    </>
  );
  if (selected) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
        <NeuSurface elevation="pressed" radius={18} stretch style={cardStyle}>{inner}</NeuSurface>
      </Pressable>
    );
  }
  return (
    <NeuPressable onPress={onPress} radius={18} elevation="raised" accessibilityState={{ selected }} style={cardStyle}>
      {inner}
    </NeuPressable>
  );
}

function GoalTile({ icon, title, desc, selected, onPress, motion }: { icon: IconName; title: string; desc: string; selected: boolean; onPress: () => void; motion: IconMotion }) {
  const t = useTheme();
  const cardStyle = { padding: Spacing.md, gap: Spacing.sm, minHeight: 168 };
  const inner = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <NeuSurface elevation={selected ? 'raised' : 'pressed'} radius={13} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          {selected ? (
            <AnimatedIcon name={icon} size={30} color={Palette.ever400} motion={motion} />
          ) : (
            <Icon name={icon} size={30} color={t.fgSubtle} />
          )}
        </NeuSurface>
        <Radio selected={selected} size={22} />
      </View>
      <View style={{ flex: 1, justifyContent: 'flex-end', gap: 4 }}>
        <AppText variant="bodyBold">{title}</AppText>
        <AppText variant="small" tone="subtle">{desc}</AppText>
      </View>
    </>
  );
  return (
    <View style={{ flex: 1 }}>
      {selected ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
          <NeuSurface elevation="pressed" radius={18} stretch style={cardStyle}>{inner}</NeuSurface>
        </Pressable>
      ) : (
        <NeuPressable onPress={onPress} radius={18} elevation="raised" stretch accessibilityState={{ selected }} style={cardStyle}>
          {inner}
        </NeuPressable>
      )}
    </View>
  );
}

function FirstPlantCard({ icon, title, desc, recommended, selected, onPress, motion }: { icon: IconName; title: string; desc: string; recommended?: boolean; selected: boolean; onPress: () => void; motion: IconMotion }) {
  const t = useTheme();
  const cardStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: Spacing.md, padding: Spacing.lg };
  const inner = (
    <>
      <NeuSurface elevation={selected ? 'raised' : 'pressed'} radius={14} style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
        {selected ? (
          <AnimatedIcon name={icon} size={24} color={Palette.ever400} motion={motion} />
        ) : (
          <Icon name={icon} size={24} color={t.fgSubtle} />
        )}
      </NeuSurface>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
          <AppText variant="subtitle">{title}</AppText>
          {recommended ? (
            <View style={{ backgroundColor: t.accentTint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
              <AppText variant="metaSm" tone="brand" uppercase style={{ letterSpacing: 0.5 }}>Recommended</AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="small" tone="subtle">{desc}</AppText>
      </View>
      <View style={{ marginRight: Spacing.sm }}>
        <Radio selected={selected} />
      </View>
    </>
  );
  if (selected) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
        <NeuSurface elevation="pressed" radius={18} stretch style={cardStyle}>{inner}</NeuSurface>
      </Pressable>
    );
  }
  return (
    <NeuPressable onPress={onPress} radius={18} elevation="raised" accessibilityState={{ selected }} style={cardStyle}>
      {inner}
    </NeuPressable>
  );
}

// ── Camera variant (step 6 · Identify with camera) ───────────────────────────
// Mirrors evergreen-onboarding-identify.html: camera → scan → result sheet (96%
// match, with a low-confidence alternate) → all-set bloom.

const MATCH = { species: 'Monstera deliciosa', common: 'Swiss cheese plant' };

type CarePreviewRow = { icon: IconName; label: string; value: string };
const CARE_PREVIEW: CarePreviewRow[] = [
  { icon: 'sun', label: 'Light', value: 'Bright indirect' },
  { icon: 'droplet', label: 'Water', value: 'Every 7 days' },
];

const GUESSES: { species: string; common: string; pct: number; tone: 'med' | 'low' }[] = [
  { species: 'Monstera deliciosa', common: 'Swiss cheese plant', pct: 61, tone: 'med' },
  { species: 'Monstera adansonii', common: 'Swiss cheese vine', pct: 24, tone: 'low' },
  { species: 'Philodendron hederaceum', common: 'Heartleaf', pct: 9, tone: 'low' },
];

const CONF_TONE = {
  high: { bg: 'rgba(62,124,79,0.14)', fg: '#3e7c4f' },
  med: { bg: 'rgba(181,130,31,0.16)', fg: '#b5821f' },
  low: { bg: 'rgba(125,148,136,0.18)', fg: '#7d9488' },
};

/** Pressed (recessed) well used for care + destination rows in the result sheet. */
function CarePill({ row }: { row: CarePreviewRow }) {
  const t = useTheme();
  return (
    <NeuSurface elevation="pressed" radius={14} style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11 }}>
        <Icon name={row.icon} size={17} color={Palette.ever500} />
        <View style={{ flex: 1 }}>
          <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 9, letterSpacing: 1 }}>{row.label}</AppText>
          <AppText variant="bodyBold" color={t.ever900} style={{ fontSize: 12.5, marginTop: 1 }}>{row.value}</AppText>
        </View>
      </View>
    </NeuSurface>
  );
}

function ResultHead({ kicker, title, sub, photo }: { kicker: string; title: string; sub: string; photo?: number }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 13 }}>
      {photo ? (
        <Image source={photo} style={{ width: 58, height: 58, borderRadius: 14 }} contentFit="cover" transition={150} />
      ) : (
        <LinearGradient colors={['#3a8c66', '#1c4d39']} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="leaf" size={22} color="rgba(255,255,255,0.85)" />
        </LinearGradient>
      )}
      <View style={{ flex: 1 }}>
        <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 10, letterSpacing: 1.4 }}>{kicker}</AppText>
        <AppText variant="display2" color={t.ever900} style={{ fontSize: 19, marginTop: 2 }}>{title}</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 12, marginTop: 1 }}>{sub}</AppText>
      </View>
    </View>
  );
}

/** Primary recessed-on-press button used inside the sheet (the `.btn` style). */
function SheetButton({ label, onPress, secondary, trailingArrow, leadingIcon, style }: { label: string; onPress: () => void; secondary?: boolean; trailingArrow?: boolean; leadingIcon?: IconName; style?: object }) {
  const t = useTheme();
  return (
    <NeuPressable onPress={onPress} radius={15} elevation={secondary ? 'raised-sm' : 'raised'} stretch backgroundColor={t.ever100} accessibilityLabel={label} style={{ height: secondary ? 46 : 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...style }}>
      {leadingIcon ? <Icon name={leadingIcon} size={16} color={t.ever700} /> : null}
      <AppText variant="bodyBold" color={t.ever700} style={{ fontSize: secondary ? 13 : 15 }}>{label}</AppText>
      {trailingArrow ? (
        <View style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: t.accentTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrowRight" size={15} color={Palette.ever500} />
        </View>
      ) : null}
    </NeuPressable>
  );
}

function IdentifyCamera({ space, onBack, onManual, onDone }: { space: string; onBack: () => void; onManual: () => void; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const [from, to] = coverForSeed('onboarding-identify');
  const [scanning, setScanning] = useState(false);
  const [sheet, setSheet] = useState<null | 'id' | 'low'>(null);
  const [done, setDone] = useState<null | { species: string | null }>(null);

  // scan overlay animation (flash → travelling scanline)
  const flash = useSharedValue(0);
  const scanY = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const scanLineStyle = useAnimatedStyle(() => ({ top: `${30 + scanY.value * 38}%` }));

  const capture = () => {
    if (scanning || sheet || done) return;
    setScanning(true);
    flash.value = withSequence(withTiming(0.85, { duration: 80 }), withTiming(0, { duration: 300 }));
    scanY.value = 0;
    scanY.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), 2, true);
  };

  // when scanning starts, resolve to the result sheet after the scan window
  useEffect(() => {
    if (!scanning) return;
    const id = setTimeout(() => {
      setScanning(false);
      setSheet('id');
    }, 1350);
    return () => clearTimeout(id);
  }, [scanning]);

  const finishWith = (species: string | null) => {
    setSheet(null);
    setDone({ species });
  };

  // ── All-set success state ──────────────────────────────────────────────────
  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: t.ever100 }}>
        <LinearGradient colors={['#e6f1eb', t.ever100]} start={{ x: 0.5, y: 0.05 }} end={{ x: 0.5, y: 0.7 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, gap: 6 }}>
          <View style={{ marginBottom: 14 }}>
            <BrandMark size={96} animate="bloom" idle />
          </View>
          <AppText variant="display2" color={t.ever900} style={{ fontSize: 25 }}>You're all set</AppText>
          <AppText variant="small" tone="muted" align="center" style={{ fontSize: 13.5, maxWidth: 240, lineHeight: 20 }}>
            {done.species
              ? `${done.species} landed in ${space}. Your care plan is ready.`
              : `Added to ${space} as "Unidentified". You can identify it later.`}
          </AppText>
          <View style={{ width: '100%', maxWidth: 240, marginTop: 20 }}>
            <NeuPressable onPress={onDone} radius={Radius.md} elevation="raised" stretch backgroundColor={t.ever100} accessibilityLabel="Enter your garden" style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Enter your garden</AppText>
              <Icon name="arrowRight" size={18} color={Palette.ever400} />
            </NeuPressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Palette.ever900 }}>
      <LinearGradient colors={[from, to]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={{ flex: 1 }} />

      {/* top bar */}
      <View style={{ position: 'absolute', top: insets.top, left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={onBack} accessibilityLabel="Back" style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={18} color={Palette.white} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <AppText variant="small" color={Palette.white}>First plant · 6/6</AppText>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: i < 5 ? Palette.ever400 : 'rgba(255,255,255,0.35)' }} />
            ))}
          </View>
        </View>
        <Pressable onPress={() => finishWith(null)} accessibilityLabel="Skip">
          <AppText variant="bodyBold" color={Palette.white}>Skip</AppText>
        </Pressable>
      </View>

      {/* reticle — animated idle pulse */}
      <View style={{ position: 'absolute', top: '32%', left: '50%', width: 208, height: 208, marginLeft: -104, marginTop: -104 }}>
        <CameraReticle size={208} />
      </View>

      {/* bottom controls */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + Spacing.lg, alignItems: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl }}>
        <AppText variant="small" color="rgba(255,255,255,0.85)" align="center">
          Center your plant in the frame — good light helps us identify it.
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Icon name="scan" size={16} color={Palette.ever400} />
          <AppText variant="bodyBold" color={Palette.white}>Identify your first plant</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xxl }}>
          <Pressable onPress={capture} accessibilityLabel="Choose from gallery" style={{ width: 42, height: 42, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            <LinearGradient colors={['#3a8c66', '#1c4d39']} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
            <Icon name="image" size={20} color={Palette.white} />
          </Pressable>
          <Pressable onPress={capture} accessibilityLabel="Capture" style={{ width: 70, height: 70, borderRadius: 999, borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: Palette.white }} />
          </Pressable>
          <Pressable onPress={() => {}} accessibilityLabel="Flip camera" style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="flip" size={20} color={Palette.white} />
          </Pressable>
        </View>
        <Pressable onPress={onManual}>
          <AppText variant="small" color="rgba(255,255,255,0.78)">Prefer to add it manually instead?</AppText>
        </Pressable>
      </View>

      {/* scan overlay */}
      {scanning ? (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6,13,9,0.5)' }}>
          <Animated.View style={[{ position: 'absolute', left: 46, right: 46, height: 2, borderRadius: 2, backgroundColor: Palette.ever400 }, scanLineStyle]} />
          <AppText variant="meta" color={Palette.white} align="center" uppercase style={{ position: 'absolute', left: 0, right: 0, bottom: '38%', letterSpacing: 1.5 }}>
            Identifying…
          </AppText>
        </View>
      ) : null}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, backgroundColor: '#fff' }, flashStyle]} />

      {/* result sheet */}
      {sheet ? (
        <>
          <Pressable onPress={() => setSheet(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6,13,9,0.45)' }} accessibilityLabel="Dismiss" />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%', borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: t.ever100, paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 22, boxShadow: '0 -16px 40px rgba(0,0,0,0.3)' }}>
            <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: 999, backgroundColor: t.fgSubtle, opacity: 0.4, marginBottom: 14 }} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {sheet === 'id' ? (
                <>
                  <ResultHead kicker="We found a match" title={MATCH.species} sub={MATCH.common} photo={plantPhotoForSeed(MATCH.species)} />
                  <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 11, borderRadius: 999, backgroundColor: CONF_TONE.high.bg, marginBottom: 13 }}>
                    <Icon name="spark" size={13} color={CONF_TONE.high.fg} />
                    <AppText variant="meta" color={CONF_TONE.high.fg} style={{ fontSize: 11.5 }}>96% confident</AppText>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    {CARE_PREVIEW.map((r) => <CarePill key={r.label} row={r} />)}
                  </View>
                  <NeuSurface elevation="pressed" radius={13} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: 11 }}>
                      <Icon name="pin" size={16} color={Palette.ever500} />
                      <AppText variant="small" tone="muted" style={{ fontSize: 12.5 }}>
                        Will be added to <AppText variant="bodyBold" color={t.ever700} style={{ fontSize: 12.5 }}>{space}</AppText> · your first space
                      </AppText>
                    </View>
                  </NeuSurface>
                  <NeuPressable
                    onPress={() => finishWith(MATCH.species)}
                    radius={Radius.md}
                    elevation="raised"
                    stretch
                    backgroundColor={t.ever100}
                    accessibilityLabel="Add to my garden"
                    style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 9 }}
                  >
                    <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Add to my garden</AppText>
                    <Icon name="arrowRight" size={18} color={Palette.ever400} />
                  </NeuPressable>
                  <Pressable onPress={() => setSheet('low')} style={{ paddingVertical: 8 }}>
                    <AppText variant="small" tone="muted" align="center">Not quite right? See other matches</AppText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ResultHead kicker="Not sure yet" title="Best guesses" sub="Pick the closest, or try again" />
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 2, marginBottom: 14 }}>
                    <Icon name="shield" size={15} color={Palette.ever500} />
                    <AppText variant="small" tone="muted" style={{ flex: 1, fontSize: 11.5, lineHeight: 16 }}>
                      We'd rather be honest than confidently wrong. None of these passed our confidence bar.
                    </AppText>
                  </View>
                  {GUESSES.map((g) => (
                    <NeuSurface key={g.species} elevation="raised" radius={14} style={{ marginBottom: 9 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 11 }}>
                        <LinearGradient colors={['#3a8c66', '#1c4d39']} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="leaf" size={20} color="rgba(255,255,255,0.6)" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyBold" color={t.ever900} style={{ fontSize: 14 }}>{g.species}</AppText>
                          <AppText variant="meta" tone="subtle" style={{ fontSize: 11 }}>{g.common}</AppText>
                        </View>
                        <View style={{ height: 26, paddingHorizontal: 11, borderRadius: 999, backgroundColor: CONF_TONE[g.tone].bg, alignItems: 'center', justifyContent: 'center' }}>
                          <AppText variant="meta" color={CONF_TONE[g.tone].fg} style={{ fontSize: 11.5 }}>{g.pct}%</AppText>
                        </View>
                      </View>
                    </NeuSurface>
                  ))}
                  <View style={{ flexDirection: 'row', gap: 9, marginTop: 6 }}>
                    <View style={{ flex: 1 }}><SheetButton label="Retake" secondary leadingIcon="rotate" onPress={() => setSheet(null)} style={{ height: 44 }} /></View>
                    <View style={{ flex: 1 }}><SheetButton label="Search" secondary leadingIcon="search" onPress={() => setSheet(null)} style={{ height: 44 }} /></View>
                  </View>
                  <View style={{ marginTop: 9 }}>
                    <SheetButton label="Add without identifying" secondary onPress={() => finishWith(null)} style={{ height: 44 }} />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </>
      ) : null}
    </View>
  );
}

export default function OnboardingScreen() {
  const t = useTheme();
  const router = useRouter();
  const complete = useCompleteOnboarding();
  const addLocation = useAddLocation();
  // `?add=1` → adding another location from Profile › Locations (not first-run onboarding).
  const { add: addParam } = useLocalSearchParams<{ add?: string }>();
  const adding = addParam === '1';
  const [step, setStep] = useState(1);
  const [camera, setCamera] = useState(false);

  const [name, setName] = useState('Home');
  const [city, setCity] = useState('');
  const [cityCoords, setCityCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [level, setLevel] = useState<string | null>('beginner');
  const [goals, setGoals] = useState<Set<string>>(new Set(['alive']));
  const [place, setPlace] = useState<Place>('indoor');
  const [space, setSpace] = useState<string | null>('Kitchen');
  const [customSpace, setCustomSpace] = useState('');
  const [method, setMethod] = useState<'camera' | 'manual'>('camera');

  // Persist the collected place/climate/level/goals as the user's first location + space, then
  // hand off to the welcome screen → garden. Idempotent server-side (won't duplicate).
  const onboardingInput = () => ({
    name,
    climateLabel: city,
    level: (level === 'expert' ? 'expert' : level === 'some' ? 'intermediate' : 'beginner') as 'beginner' | 'intermediate' | 'expert',
    goals: Array.from(goals),
    place,
    spaceName: space === 'Custom' ? customSpace : space ?? 'My space',
    lat: cityCoords?.lat,
    lon: cityCoords?.lon,
  });

  // "Use my location": ask permission, read the device GPS, reverse-geocode it to a city label, and
  // keep the real coordinates so the weather forecast uses them exactly (no re-geocoding needed).
  const useMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setCityCoords({ lat: latitude, lon: longitude });

      // Reverse-geocode coords → a city name (never raw coordinates). Try the device geocoder first,
      // then a free, no-key HTTP reverse geocoder (works in the simulator / on web too).
      let cityName: string | undefined;
      let country: string | undefined;
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        cityName = place?.city ?? place?.subregion ?? place?.region ?? undefined;
        country = place?.isoCountryCode ?? place?.country ?? undefined;
      } catch {
        /* fall through to the HTTP lookup */
      }
      if (!cityName) {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const j = await res.json();
          cityName = j.city || j.locality || j.principalSubdivision || undefined;
          country = country ?? j.countryCode ?? undefined;
        } catch {
          /* ignore */
        }
      }
      setCity([cityName, country].filter(Boolean).join(', ') || 'Your location');
    } catch {
      // ignore — the user can still type a city manually
    } finally {
      setLocating(false);
    }
  };

  const finish = async () => {
    if (adding) {
      try { await addLocation(onboardingInput()); } catch { /* ignore */ }
      router.replace('/(app)/profile/locations'); // back to the list with the new location
      return;
    }
    try {
      await complete(onboardingInput());
    } catch {
      // ignore — fall through to welcome; the splash gate will re-route if needed
    }
    router.replace('/(auth)/welcome');
  };

  // Step 6 "add first plant": persist the place/space, then hand off to the same capture flow the
  // Garden FAB uses (Identify or Add manually), opened on the method the user chose. When adding a
  // new location we pass its fresh spaceId so the plant lands in that location, not the first one.
  const addFirstPlant = async () => {
    const modeQuery = method === 'manual' ? 'manual' : 'identify';
    if (adding) {
      let spaceId: string | undefined;
      try { spaceId = (await addLocation(onboardingInput())).spaceId; } catch { /* ignore */ }
      router.replace(`/(app)/capture?mode=${modeQuery}${spaceId ? `&spaceId=${spaceId}` : ''}`);
      return;
    }
    try {
      await complete(onboardingInput());
    } catch {
      // ignore — the capture screen resolves the space server-side
    }
    router.replace(`/(app)/capture?mode=${modeQuery}`);
  };
  const next = () => (step < TOTAL ? setStep(step + 1) : finish());
  const back = () => (step > 1 ? setStep(step - 1) : router.back());
  const toggleGoal = (g: string) =>
    setGoals((p) => {
      const n = new Set(p);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });

  const spaceLabel = space === 'Custom' ? customSpace.trim() || 'this space' : space ?? 'this space';

  // Camera variant (from step 6)
  if (camera) {
    return <IdentifyCamera space={spaceLabel} onBack={() => setCamera(false)} onManual={() => setCamera(false)} onDone={finish} />;
  }

  // Step 1 — Name
  if (step === 1)
    return (
      <StepScaffold step={1} totalSteps={TOTAL} kicker="Step 1 · Location" title="Name this place" subtitle="Start with where you grow. We'll tune care to its climate, light, and season." onNext={next} onBack={back} nextDisabled={!name.trim()} subnote="You can add more places later." showMark>
        <View style={{ gap: Spacing.lg }}>
          <TextField value={name} onChangeText={setName} placeholder="Home" leadingIcon="pin" autoFocus maxLength={32} />
          <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {['Home', 'Office', 'Studio', 'Apartment', 'Holiday house'].map((s) => (
              <Chip key={s} label={s} size="lg" selected={name === s} onPress={() => setName(s)} />
            ))}
          </View>
        </View>
      </StepScaffold>
    );

  // Step 2 — Climate
  if (step === 2)
    return (
      <StepScaffold step={2} totalSteps={TOTAL} kicker="Step 2 · Climate" title="Where do you garden?" subtitle="Your city sets the climate we plan care around — light hours, humidity, and season." onNext={next} onBack={back} nextDisabled={!city.trim()} subnote="We refresh the local forecast each morning.">
        <View style={{ flex: 1, justifyContent: 'center', gap: Spacing.xl }}>
          <NeuPressable
            onPress={useMyLocation}
            disabled={locating}
            radius={Radius.md}
            elevation="raised"
            stretch
            backgroundColor={t.ever100}
            accessibilityLabel="Use my location"
            style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            {locating ? <ActivityIndicator color={Palette.ever400} /> : <AnimatedIcon name="pin" size={18} color={Palette.ever400} motion="bob" />}
            <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>{locating ? 'Locating…' : 'Use my location'}</AppText>
          </NeuPressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: t.fgSubtle, opacity: 0.3 }} />
            <AppText variant="meta" tone="subtle" uppercase>or enter a city</AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: t.fgSubtle, opacity: 0.3 }} />
          </View>
          <TextField value={city} onChangeText={(v) => { setCity(v); setCityCoords(null); }} placeholder="Search your city" leadingIcon="search" />
        </View>
      </StepScaffold>
    );

  // Step 3 — Level
  if (step === 3)
    return (
      <StepScaffold step={3} totalSteps={TOTAL} kicker="Step 3 · Level" title="How green is your thumb?" subtitle="We tune guidance to your experience — for this place. Expert at home, beginner at the cabin is perfectly fine." onNext={next} onBack={back} nextDisabled={!level} subnote="You can change this per place, anytime." scroll>
        <View style={{ gap: Spacing.md }}>
          {LEVELS.map((o) => (
            <LevelRow key={o.v} icon={o.ic} title={o.t} desc={o.d} selected={level === o.v} onPress={() => setLevel(o.v)} />
          ))}
        </View>
      </StepScaffold>
    );

  // Step 4 — Goals
  if (step === 4)
    return (
      <StepScaffold step={4} totalSteps={TOTAL} kicker="Step 4 · Goals" title="What are you hoping for?" subtitle="Pick what matters most here — we'll shape tips and reminders around it. Choose any." onNext={next} onBack={back} nextDisabled={goals.size === 0} subnote="Pick at least one — you can adjust later." scroll>
        <View style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <GoalTile {...{ icon: GOALS[0].ic, title: GOALS[0].t, desc: GOALS[0].d, motion: GOALS[0].motion }} selected={goals.has(GOALS[0].v)} onPress={() => toggleGoal(GOALS[0].v)} />
            <GoalTile {...{ icon: GOALS[1].ic, title: GOALS[1].t, desc: GOALS[1].d, motion: GOALS[1].motion }} selected={goals.has(GOALS[1].v)} onPress={() => toggleGoal(GOALS[1].v)} />
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <GoalTile {...{ icon: GOALS[2].ic, title: GOALS[2].t, desc: GOALS[2].d, motion: GOALS[2].motion }} selected={goals.has(GOALS[2].v)} onPress={() => toggleGoal(GOALS[2].v)} />
            <GoalTile {...{ icon: GOALS[3].ic, title: GOALS[3].t, desc: GOALS[3].d, motion: GOALS[3].motion }} selected={goals.has(GOALS[3].v)} onPress={() => toggleGoal(GOALS[3].v)} />
          </View>
        </View>
      </StepScaffold>
    );

  // Step 5 — Place & Space
  if (step === 5) {
    const current = PLACES.find((p) => p.key === place)!;
    return (
      <StepScaffold step={5} totalSteps={TOTAL} kicker="Step 5 · First space" title="Where will it live?" subtitle="Pick a Place, then the Space within it — we use light and humidity to plan care." onNext={next} onBack={back} nextDisabled={!space || (space === 'Custom' && !customSpace.trim())} subnote="Add more spaces anytime in Manage Spaces." scroll>
        <View style={{ gap: Spacing.lg }}>
          <View>
            <SectionLabel>Place</SectionLabel>
            <SegmentedControl
              options={PLACES.map((p) => ({ value: p.key, label: p.label, icon: p.icon, motion: p.motion }))}
              value={place}
              onChange={(v) => {
                setPlace(v as Place);
                // default to the first space of the newly-selected place (e.g. Outdoor → Balcony)
                const next = PLACES.find((p) => p.key === (v as Place));
                setSpace(next?.spaces[0] ?? null);
                setCustomSpace('');
              }}
            />
          </View>
          <View>
            <SectionLabel>Space</SectionLabel>
            <ScrollView style={{ maxHeight: 168 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap', paddingBottom: 2 }}>
              {current.spaces.map((s) => (
                <Chip key={s} label={s} size="lg" selected={space === s} onPress={() => setSpace(s)} />
              ))}
              <Chip label="+ Other" size="lg" selected={space === 'Custom'} onPress={() => setSpace('Custom')} />
            </ScrollView>
            {space === 'Custom' ? (
              <View style={{ marginTop: Spacing.md }}>
                <TextField value={customSpace} onChangeText={setCustomSpace} placeholder="Name your space" leadingIcon="pencil" leadingIconSize={24} autoFocus maxLength={32} />
              </View>
            ) : null}
          </View>
        </View>
      </StepScaffold>
    );
  }

  // Step 6 — First plant
  return (
    <StepScaffold step={6} totalSteps={TOTAL} kicker="Step 6 · First plant" title="Add your first plant" subtitle={`It'll land in ${spaceLabel}. Snap a photo to identify it, or add it by hand.`} onNext={addFirstPlant} onBack={back} nextLabel="Add your first plant" onSkip={finish} skipLabel="Skip for now" subnote="I'll add plants later" scroll>
      <View style={{ gap: Spacing.md }}>
        <FirstPlantCard icon="camera" title="Identify with camera" desc="Snap a photo — we'll name it and build a care plan." recommended selected={method === 'camera'} onPress={() => setMethod('camera')} motion="pulse" />
        <FirstPlantCard icon="pencil" title="Add it manually" desc="Know what it is? Search the Species yourself." selected={method === 'manual'} onPress={() => setMethod('manual')} motion="write" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xs, marginTop: Spacing.xs }}>
          <Icon name="shield" size={16} tone="subtle" />
          <AppText variant="small" tone="subtle" style={{ flex: 1 }}>
            We always show how sure an ID is — never a confident guess. You can re-identify later.
          </AppText>
        </View>
      </View>
    </StepScaffold>
  );
}
