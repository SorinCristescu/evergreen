import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TreatmentBanner } from '@/components/domain/treatment-banner';
import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon, type IconMotion } from '@/components/ui/animated-icon';
import { AnimatedRain } from '@/components/ui/animated-rain';
import { AppText } from '@/components/ui/app-text';
import { Radio } from '@/components/ui/radio';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { TabBar } from '@/components/tab-bar';
import { Palette, Spacing } from '@/constants/tokens';
import { useCareTaskActions, usePlantDetail, usePlantEditor, useTreatmentActions, type CareTaskType, type PlantDetail, type Treatment } from '@/data';
import { useTheme } from '@/theme';

const TABS = [
  { key: 'care', label: 'Care' },
  { key: 'about', label: 'About' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'journal', label: 'Journal' },
];

const HERO_GRADIENTS: [string, string][] = [
  ['#3a8c66', '#1c4d39'],
  ['#2c694e', '#143228'],
  ['#5bb389', '#2c6e51'],
];

const CARE_LABEL: Record<CareTaskType, string> = {
  water: 'Water',
  fertilize: 'Fertilize',
  mist: 'Mist leaves',
  prune: 'Prune',
  repot: 'Repot',
  clean: 'Clean leaves',
  rotate: 'Rotate for light',
};
const CARE_ICON: Record<CareTaskType, IconName> = {
  water: 'droplet',
  fertilize: 'fertilize',
  mist: 'mist',
  prune: 'scissors',
  repot: 'leaf',
  clean: 'leaf',
  rotate: 'rotate',
};

function GlassButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.20)' }}
    >
      <Icon name={icon} size={20} color={Palette.white} />
    </Pressable>
  );
}

type StatusBadge = { label: string; icon: IconName; color: string; tint: string };

/**
 * Status badges. Water status leads — "Needs water" shows whenever the plant is thirsty. "Under
 * treatment" is the second badge (a sick plant still gets watered). "Healthy" is only ever shown
 * when the plant is neither thirsty NOR under treatment.
 */
function statusBadges(plant: PlantDetail): StatusBadge[] {
  const thirsty = !!plant.needsWater || plant.status === 'warn';
  const underTreatment = !!(plant.treatment && plant.treatment.status === 'active');
  const badges: StatusBadge[] = [];
  if (thirsty) {
    badges.push({ label: 'Needs water', icon: 'droplet', color: Palette.warning, tint: 'rgba(181,130,31,0.14)' });
  } else if (!underTreatment) {
    badges.push({ label: 'Healthy', icon: 'check', color: Palette.leaf, tint: 'rgba(62,124,79,0.14)' });
  }
  if (underTreatment) {
    badges.push({ label: 'Under treatment', icon: 'warning', color: Palette.terra, tint: 'rgba(199,107,79,0.14)' });
  }
  return badges;
}

function StatusBadgePill({ badge }: { badge: StatusBadge }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 26,
        paddingHorizontal: 11,
        borderRadius: 999,
        backgroundColor: badge.tint,
      }}
    >
      <Icon name={badge.icon} size={13} color={badge.color} />
      <AppText variant="small" color={badge.color} style={{ fontSize: 11.5, fontFamily: undefined }}>
        {badge.label}
      </AppText>
    </View>
  );
}

const SEVERITY: Record<Treatment['severity'], { label: string; color: string; tint: string }> = {
  low: { label: 'Low severity', color: Palette.leaf, tint: 'rgba(62,124,79,0.14)' },
  medium: { label: 'Moderate', color: Palette.warning, tint: 'rgba(181,130,31,0.14)' },
  high: { label: 'High severity', color: Palette.danger, tint: 'rgba(179,64,47,0.14)' },
};
const ISSUE: Record<Treatment['issueType'], { label: string; icon: IconName }> = {
  disease: { label: 'Disease', icon: 'warning' },
  pest: { label: 'Pest', icon: 'ban' },
  deficiency: { label: 'Deficiency', icon: 'droplet' },
};
function diagnosisSummary(tr: Treatment): string {
  const issue = tr.issueType === 'pest' ? 'a pest problem' : tr.issueType === 'disease' ? 'a disease' : 'a nutrient deficiency';
  const sev = tr.severity === 'high' ? 'It looks serious, so act promptly.' : tr.severity === 'medium' ? 'Caught early — stay consistent.' : 'It’s mild and very treatable.';
  return `Dr. Plant analysed your photos and detected ${tr.diagnosis.toLowerCase()} — ${issue}. ${sev} Work through the ${tr.totalSteps}-step plan below and re-check in about two weeks.`;
}

/** Two linked sheets off the treatment card: a checkable steps list and the Dr. Plant diagnosis. */
function TreatmentSheets({
  treatment,
  photos,
  showSteps,
  showDiagnosis,
  onClose,
  onShowDiagnosis,
  onBackToSteps,
  onToggle,
}: {
  treatment: Treatment;
  photos: string[];
  showSteps: boolean;
  showDiagnosis: boolean;
  onClose: () => void;
  onShowDiagnosis: () => void;
  onBackToSteps: () => void;
  onToggle: (stepIndex: number) => void;
}) {
  const t = useTheme();
  const sev = SEVERITY[treatment.severity];
  const issue = ISSUE[treatment.issueType];
  const dots = Array.from({ length: treatment.totalSteps });
  return (
    <>
      {/* Steps checklist */}
      <Sheet visible={showSteps} onClose={onClose}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <AppText variant="display2" style={{ fontSize: 18 }}>Treatment</AppText>
          <StatusBadgePill badge={{ label: sev.label, icon: 'warning', color: sev.color, tint: sev.tint }} />
        </View>
        <AppText variant="small" tone="muted" style={{ fontSize: 13, marginTop: 3 }}>{treatment.diagnosis}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <AppText variant="meta" tone="muted" style={{ fontSize: 11 }}>Step {treatment.currentStep} of {treatment.totalSteps}</AppText>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {dots.map((_, i) => (
              <View key={i} style={{ width: 16, height: 4, borderRadius: 2, backgroundColor: i < treatment.currentStep ? Palette.ever400 : 'rgba(22,39,30,0.14)' }} />
            ))}
          </View>
        </View>
        <View style={{ gap: 10, marginTop: 14 }}>
          {treatment.steps.map((s, i) => (
            <Pressable key={s.id} onPress={() => onToggle(i)} accessibilityRole="checkbox" accessibilityState={{ checked: s.done }} style={{ alignSelf: 'stretch' }}>
              <NeuSurface elevation={s.done ? 'pressed' : 'raised'} radius={14} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
                <Radio selected={s.done} size={26} />
                <AppText variant="bodyBold" color={s.done ? t.fgSubtle : t.fg} style={[{ flex: 1, fontSize: 13.5 }, s.done ? { textDecorationLine: 'line-through' } : null]}>{s.text}</AppText>
              </NeuSurface>
            </Pressable>
          ))}
        </View>
        <NeuPressable onPress={onShowDiagnosis} elevation="raised" radius={14} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56, marginTop: 16 }} accessibilityLabel="View Dr. Plant diagnosis">
          <NeuSurface elevation="pressed" radius={11} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="scan" size={19} color={Palette.ever500} />
          </NeuSurface>
          <AppText variant="bodyBold" color={t.fg} style={{ flex: 1, fontSize: 14.5 }}>View Dr. Plant diagnosis</AppText>
          <Icon name="chevronRight" size={18} tone="subtle" />
        </NeuPressable>
      </Sheet>

      {/* Dr. Plant diagnosis */}
      <Sheet visible={showDiagnosis} onClose={onClose}>
        <Pressable onPress={onBackToSteps} accessibilityLabel="Back to treatment" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Icon name="back" size={18} tone="subtle" />
          <AppText variant="small" tone="muted" style={{ fontSize: 13 }}>Treatment</AppText>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentTint }}>
            <Icon name="scan" size={22} color={Palette.ever500} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9, letterSpacing: 1.2 }}>Dr. Plant diagnosis</AppText>
            <AppText variant="display2" style={{ fontSize: 19 }}>{treatment.diagnosis}</AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <StatusBadgePill badge={{ label: issue.label, icon: issue.icon, color: Palette.terra, tint: 'rgba(199,107,79,0.14)' }} />
          <StatusBadgePill badge={{ label: sev.label, icon: 'warning', color: sev.color, tint: sev.tint }} />
        </View>
        {photos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} style={{ marginBottom: 14 }}>
            {photos.map((u, i) => (
              <NeuSurface key={i} elevation="raised-sm" radius={14} style={{ width: 130, height: 130, overflow: 'hidden' }}>
                <Image source={{ uri: u }} style={{ flex: 1 }} contentFit="cover" transition={150} />
              </NeuSurface>
            ))}
          </ScrollView>
        ) : (
          <NeuSurface elevation="pressed" radius={14} stretch style={{ height: 90, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
            <Icon name="image" size={22} tone="subtle" />
            <AppText variant="small" tone="subtle" style={{ fontSize: 12 }}>No analysis photos yet</AppText>
          </NeuSurface>
        )}
        <AppText variant="small" style={{ fontSize: 13.5, lineHeight: 21 }}>{diagnosisSummary(treatment)}</AppText>
      </Sheet>
    </>
  );
}

function CarePlanTask({ task, done, onToggle }: { task: PlantDetail['careTasks'][number]; done: boolean; onToggle: () => void }) {
  const t = useTheme();
  const due = task.dueLabel === 'Due now';
  const whenColor = done ? Palette.leaf : due ? Palette.warning : t.fgMuted;
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: done }} style={{ alignSelf: 'stretch' }}>
      <NeuSurface elevation={done ? 'pressed' : 'raised'} radius={15} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
        <NeuSurface elevation="pressed" radius={11} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={CARE_ICON[task.type]} size={18} tone="accent" />
        </NeuSurface>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold" color={done ? t.fgSubtle : t.fg} style={[{ fontSize: 14 }, done ? { textDecorationLine: 'line-through' } : null]}>
            {CARE_LABEL[task.type]}
          </AppText>
          <AppText variant="small" color={whenColor} style={{ fontSize: 11.5, marginTop: 1 }}>
            {done ? 'Done today' : task.dueLabel}
          </AppText>
        </View>
        <Radio selected={done} size={28} />
      </NeuSurface>
    </Pressable>
  );
}

function SectionLabel({ children, style }: { children: string; style?: object }) {
  return (
    <AppText variant="meta" tone="subtle" uppercase style={[{ fontSize: 10.5, letterSpacing: 1.4 }, style]}>
      {children}
    </AppText>
  );
}

export default function PlantDetailScreen() {
  const t = useTheme();
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const plant = usePlantDetail(plantId);
  const [tab, setTab] = useState('care');
  const [slide, setSlide] = useState(0);
  const { completed, complete } = useCareTaskActions();
  const { updatePlant, deletePlant, addPhoto, addNote } = usePlantEditor();
  const { toggleStep } = useTreatmentActions();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/garden'));

  // Sheets: header ⋯ → options/edit; treatment card → treatment/diagnosis; journal → note.
  const [sheet, setSheet] = useState<null | 'options' | 'edit' | 'treatment' | 'diagnosis' | 'note'>(null);
  const [noteText, setNoteText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nickname: '', description: '', scientificName: '' });

  const openOptions = () => {
    setConfirmDelete(false);
    setSheet('options');
  };
  const openEdit = () => {
    if (!plant) return;
    setForm({
      nickname: plant.nickname ?? '',
      description: plant.description ?? '',
      scientificName: plant.species?.scientificName ?? '',
    });
    setSheet('edit');
  };

  const pickAndAddPhotos = async () => {
    if (!plant) return;
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.85 });
    if (result.canceled) return;
    setBusy(true);
    try {
      for (const asset of result.assets) {
        await addPhoto(plant.id, asset.uri, asset.mimeType ?? 'image/jpeg');
      }
      setSheet(null);
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!plant) return;
    setBusy(true);
    try {
      await updatePlant(plant.id, { nickname: form.nickname, description: form.description, scientificName: form.scientificName });
      setSheet(null);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!plant) return;
    setBusy(true);
    try {
      await deletePlant(plant.id);
      setSheet(null);
      router.replace('/(app)/(tabs)/garden');
    } finally {
      setBusy(false);
    }
  };

  const openNote = () => { setNoteText(''); setSheet('note'); };
  const onSaveNote = async () => {
    if (!plant || !noteText.trim()) return;
    setBusy(true);
    try {
      await addNote(plant.id, noteText);
      setSheet(null);
    } finally {
      setBusy(false);
    }
  };

  if (!plant) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top, paddingHorizontal: Spacing.xl }}>
        <Pressable onPress={goBack} accessibilityLabel="Back"><Icon name="back" size={24} /></Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText tone="subtle">Plant not found</AppText>
        </View>
      </View>
    );
  }

  const heroHeight = Math.round(height * 0.32);
  // Bottom clearance for the standalone tab bar (mirrors TabBar's own height).
  const tabBarHeight = 62 + Math.max(insets.bottom, 12);
  const photos = plant.photoUrls.length ? plant.photoUrls : plant.coverUrl ? [plant.coverUrl] : [];
  const dotCount = photos.length || HERO_GRADIENTS.length;
  // "Mark watered" targets the open water task; once there's none (or it's done) the plant is watered.
  const waterTask = plant.careTasks.find((task) => task.type === 'water');
  const watered = !waterTask || completed.has(waterTask.id);

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      {/* Hero carousel (fixed) */}
      <View style={{ height: heroHeight }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setSlide((prev) => (prev === i ? prev : i));
          }}
          onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {photos.length
            ? photos.map((u, i) => (
                <Image key={i} source={{ uri: u }} style={{ width, height: heroHeight }} contentFit="cover" transition={150} />
              ))
            : HERO_GRADIENTS.map((g, i) => (
                <LinearGradient key={i} colors={g} start={{ x: 0.3, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ width, height: heroHeight, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="image" size={30} color="rgba(255,255,255,0.45)" />
                </LinearGradient>
              ))}
        </ScrollView>
        {/* top gradient scrim for legibility */}
        <LinearGradient pointerEvents="none" colors={['rgba(11,24,18,0.45)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 110 }} />
        {/* glassy actions */}
        <View style={{ position: 'absolute', top: insets.top, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <GlassButton icon="back" label="Back" onPress={goBack} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <GlassButton icon="bell" label="Notifications" onPress={() => router.push('/(app)/notifications')} />
            <GlassButton icon="more" label="Plant options" onPress={openOptions} />
          </View>
        </View>
        {/* dots */}
        <View style={{ position: 'absolute', bottom: 13, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <View key={i} style={{ width: i === slide ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === slide ? '#fff' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </View>
      </View>

      {/* Title block (fixed) */}
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: 12, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <AppText variant="display2" style={{ fontSize: 21 }}>{plant.nickname}</AppText>
          {statusBadges(plant).map((b) => (
            <StatusBadgePill key={b.label} badge={b} />
          ))}
        </View>
        <AppText variant="meta" tone="subtle" style={{ marginTop: 2 }}>
          {plant.species?.scientificName ?? 'Unidentified'}
          {plant.species?.commonName ? ` · ${plant.species.commonName}` : ''}
        </AppText>
        {/* location · place · space chips */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
          <LocChip icon="pin" label="Home" />
          <AppText tone="subtle" style={{ fontSize: 11 }}>·</AppText>
          <LocChip icon="home" label={cap(plant.space.place)} />
          <AppText tone="subtle" style={{ fontSize: 11 }}>·</AppText>
          <LocChip icon="grid" label={plant.space.name} />
        </View>
      </View>

      {/* Tabs (fixed) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(22,39,30,0.08)' }}>
        {TABS.map((tab2) => {
          const active = tab2.key === tab;
          return (
            <Pressable key={tab2.key} onPress={() => setTab(tab2.key)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={{ paddingVertical: 8, paddingBottom: 11 }}>
              <AppText variant="bodyBold" style={{ fontSize: 14 }} color={active ? t.fg : t.fgSubtle}>{tab2.label}</AppText>
              {active ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2.5, borderRadius: 2, backgroundColor: Palette.ever500 }} /> : null}
            </Pressable>
          );
        })}
      </View>

      {/* Content (scroll) */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: 14, paddingBottom: tabBarHeight + 52 }} showsVerticalScrollIndicator={false}>
        {tab === 'care' ? (
          <View>
            {plant.careGuide ? (
              <>
                <SectionLabel>Care guide</SectionLabel>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 20 }}>
                  {[
                    { icon: 'sun' as IconName, motion: 'spin' as IconMotion, label: 'Light', value: plant.careGuide.light, color: Palette.sun },
                    { icon: 'droplet' as IconName, motion: 'drip' as IconMotion, label: 'Water', value: plant.careGuide.water, color: '#3f8fd0' },
                    { icon: 'rain' as IconName, motion: 'drip' as IconMotion, label: 'Humidity', value: plant.careGuide.humidity, color: Palette.ever500 },
                  ].map((g) => (
                    <NeuSurface key={g.label} elevation="pressed" radius={14} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 4 }}>
                      {g.icon === 'rain' ? <AnimatedRain size={17} color={g.color} /> : <AnimatedIcon name={g.icon} motion={g.motion} size={17} color={g.color} />}
                      <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9 }}>{g.label}</AppText>
                      <AppText variant="bodyBold" color={t.fg} align="center" style={{ fontSize: 12, lineHeight: 15 }}>{g.value}</AppText>
                    </NeuSurface>
                  ))}
                </View>
              </>
            ) : null}

            {plant.treatment ? <View style={{ marginBottom: 16 }}><TreatmentBanner treatment={plant.treatment} onPress={() => setSheet('treatment')} /></View> : null}
            <SectionLabel>Up next</SectionLabel>
            <View style={{ gap: 10, marginTop: 10 }}>
              {plant.careTasks.map((task) => (
                <CarePlanTask key={task.id} task={task} done={completed.has(task.id)} onToggle={() => complete(task.id)} />
              ))}
              {/* Mark watered — last item in the list */}
              <NeuPressable
                onPress={() => { if (waterTask && !watered) complete(waterTask.id); }}
                disabled={watered}
                elevation="raised"
                radius={16}
                stretch
                accessibilityLabel={watered ? 'Watered' : 'Mark watered'}
                accessibilityState={{ disabled: watered }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, marginTop: 2 }}
              >
                <View style={{ width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: watered ? 'rgba(62,124,79,0.14)' : t.accentTint }}>
                  <Icon name={watered ? 'check' : 'droplet'} size={15} color={watered ? Palette.leaf : Palette.ever400} strokeWidth={watered ? 2.6 : 2} />
                </View>
                <AppText variant="bodyBold" color={watered ? Palette.leaf : Palette.ever400} style={{ fontSize: 15 }}>{watered ? 'Watered' : 'Mark watered'}</AppText>
              </NeuPressable>
            </View>
          </View>
        ) : tab === 'about' && plant.about ? (
          <View>
            <AppText variant="small" style={{ fontSize: 13.5, lineHeight: 21 }}>{plant.about.lead}</AppText>
            <SectionLabel style={{ marginTop: 18, marginBottom: 10 }}>Quick facts</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {plant.about.facts.map((f) => (
                <NeuSurface key={f.label} elevation="pressed" radius={14} style={{ width: '47.5%', paddingVertical: 12, paddingHorizontal: 13 }}>
                  <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9 }}>{f.label}</AppText>
                  <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13, marginTop: 3 }}>{f.value}</AppText>
                </NeuSurface>
              ))}
            </View>
            <SectionLabel style={{ marginTop: 18, marginBottom: 10 }}>Good to know</SectionLabel>
            <View style={{ gap: 9 }}>
              {plant.about.notes.map((n, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: Palette.ever400, marginTop: 7 }} />
                  <AppText variant="small" tone="muted" style={{ flex: 1, fontSize: 12.5, lineHeight: 19 }}>{n}</AppText>
                </View>
              ))}
            </View>
            {plant.about.source ? (
              <Pressable
                onPress={() => plant.about?.source?.url && Linking.openURL(plant.about.source.url)}
                disabled={!plant.about.source.url}
                accessibilityRole="link"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}
              >
                <AppText variant="meta" tone="subtle">Source:</AppText>
                <AppText variant="small" color={Palette.ever400} style={{ fontSize: 12.5 }}>{plant.about.source.label}</AppText>
              </Pressable>
            ) : null}
            <NeuPressable onPress={() => {}} elevation="raised-sm" radius={14} stretch style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, marginTop: 18 }}>
              <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 13.5 }}>See full Species page</AppText>
              <Icon name="chevronRight" size={16} color={Palette.ever400} />
            </NeuPressable>
          </View>
        ) : tab === 'timeline' ? (
          <View>
            {plant.timeline.map((entry, i) => (
              <View key={entry.id} style={{ flexDirection: 'row', gap: 14, paddingBottom: i === plant.timeline.length - 1 ? 0 : 22 }}>
                {i < plant.timeline.length - 1 ? (
                  <LinearGradient
                    pointerEvents="none"
                    colors={['#4daf82', 'rgba(77,175,130,0.35)']}
                    style={{ position: 'absolute', left: 26, top: 54, bottom: 0, width: 2 }}
                  />
                ) : null}
                <NeuSurface elevation="raised-sm" radius={14} style={{ width: 54, height: 54, overflow: 'hidden' }}>
                  {entry.photoUrl ? (
                    <Image source={{ uri: entry.photoUrl }} style={{ flex: 1 }} contentFit="cover" transition={150} />
                  ) : (
                    <LinearGradient colors={HERO_GRADIENTS[i % HERO_GRADIENTS.length]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="image" size={20} color="rgba(255,255,255,0.5)" />
                    </LinearGradient>
                  )}
                </NeuSurface>
                <View style={{ flex: 1, paddingTop: 3 }}>
                  <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13.5 }}>{entry.title}</AppText>
                  <View style={{ alignSelf: 'flex-start', marginTop: 3, backgroundColor: t.accentTint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <AppText variant="metaSm" color={Palette.ever500} style={{ fontSize: 10 }}>{entry.atLabel}</AppText>
                  </View>
                  {entry.note ? <AppText variant="small" tone="muted" style={{ fontSize: 12, lineHeight: 17, marginTop: 5 }}>{entry.note}</AppText> : null}
                </View>
              </View>
            ))}
          </View>
        ) : tab === 'journal' ? (
          <View>
            {plant.journal.map((j) => (
              <NeuSurface key={j.id} elevation="raised" radius={15} stretch style={{ paddingVertical: 13, paddingHorizontal: 14, marginBottom: 11 }}>
                <AppText variant="meta" tone="subtle" style={{ fontSize: 10.5, marginBottom: 5 }}>{j.atLabel}</AppText>
                <AppText variant="small" style={{ fontSize: 13, lineHeight: 19 }}>{j.note}</AppText>
              </NeuSurface>
            ))}
            {plant.journal.length === 0 ? (
              <AppText variant="small" tone="subtle" style={{ fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                No notes yet — add your first below.
              </AppText>
            ) : null}
            {/* Add a note — last item in the list */}
            <NeuPressable
              onPress={openNote}
              elevation="raised"
              radius={16}
              stretch
              accessibilityLabel="Add a note"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, marginTop: 12 }}
            >
              <AnimatedIcon name="plus" motion="pulse" size={18} color={Palette.ever400} strokeWidth={2.6} />
              <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Add a note</AppText>
            </NeuPressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Global bottom bar — FAB only, with a gentle recommendation underneath */}
      <TabBar
        standalone
        showTabs={false}
        onFabPress={() => router.push(`/(app)/capture?plantId=${plant.id}`)}
        caption={
          <AppText variant="small" tone="subtle" align="center" numberOfLines={1} style={{ fontSize: 12.5, lineHeight: 16 }}>
            Add a new photo or check in with{' '}
            <AppText variant="small" color={Palette.ever400} style={{ fontSize: 12.5, lineHeight: 16 }}>Dr. Plant</AppText>
          </AppText>
        }
      />

      {/* Options sheet — Edit / Add photos / Delete */}
      <Sheet visible={sheet === 'options'} onClose={() => setSheet(null)}>
        <AppText variant="display2" style={{ fontSize: 18, marginBottom: 14 }}>{plant.nickname ?? 'Plant'}</AppText>
        {confirmDelete ? (
          <View>
            <AppText variant="small" tone="muted" style={{ fontSize: 13.5, lineHeight: 20, marginBottom: 16 }}>
              Delete {plant.nickname ?? 'this plant'}? Its photos, care plan and tasks are removed too. This can’t be undone.
            </AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <NeuPressable onPress={() => setConfirmDelete(false)} elevation="raised" radius={14} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 50 }} accessibilityLabel="Cancel">
                <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 14.5 }}>Cancel</AppText>
              </NeuPressable>
              <NeuPressable onPress={onDelete} elevation="raised" radius={14} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50 }} accessibilityLabel="Confirm delete">
                {busy ? <ActivityIndicator color={Palette.danger} /> : <Icon name="trash" size={17} color={Palette.danger} />}
                <AppText variant="bodyBold" color={Palette.danger} style={{ fontSize: 14.5 }}>Delete</AppText>
              </NeuPressable>
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <SheetRow icon="pencil" label="Edit details" onPress={openEdit} />
            <SheetRow icon="camera" label="Add photos" onPress={pickAndAddPhotos} busy={busy} />
            <SheetRow icon="trash" label="Delete plant" danger onPress={() => setConfirmDelete(true)} />
          </View>
        )}
      </Sheet>

      {/* Edit sheet — nickname, scientific name, description, photos */}
      <Sheet visible={sheet === 'edit'} onClose={() => setSheet(null)}>
        <AppText variant="display2" style={{ fontSize: 18, marginBottom: 16 }}>Edit plant</AppText>
        <View style={{ gap: 14 }}>
          <TextField label="Nickname" value={form.nickname} onChangeText={(nickname) => setForm((f) => ({ ...f, nickname }))} placeholder="e.g. Mara" />
          <TextField label="Scientific name" value={form.scientificName} onChangeText={(scientificName) => setForm((f) => ({ ...f, scientificName }))} placeholder="e.g. Ficus lyrata" />
          <TextField label="Description" value={form.description} onChangeText={(description) => setForm((f) => ({ ...f, description }))} placeholder="A note about this plant…" multiline maxLength={500} />
          <SheetRow icon="camera" label="Add photos" onPress={pickAndAddPhotos} busy={busy} />
        </View>
        <NeuPressable
          onPress={onSave}
          elevation="raised"
          radius={16}
          stretch
          accessibilityLabel="Save changes"
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, marginTop: 18 }}
        >
          {busy ? <ActivityIndicator color={Palette.ever400} /> : <Icon name="check" size={18} color={Palette.ever400} strokeWidth={2.6} />}
          <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Save changes</AppText>
        </NeuPressable>
      </Sheet>

      {/* Add a journal note */}
      <Sheet visible={sheet === 'note'} onClose={() => setSheet(null)}>
        <AppText variant="display2" style={{ fontSize: 18, marginBottom: 16 }}>Add a note</AppText>
        <TextField
          label="Journal note"
          value={noteText}
          onChangeText={setNoteText}
          placeholder="How is your plant doing today?"
          multiline
          maxLength={500}
          autoFocus
        />
        <NeuPressable
          onPress={onSaveNote}
          disabled={!noteText.trim()}
          elevation="raised"
          radius={16}
          stretch
          accessibilityLabel="Save note"
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, marginTop: 18 }}
        >
          {busy ? <ActivityIndicator color={Palette.ever400} /> : <Icon name="check" size={18} color={Palette.ever400} strokeWidth={2.6} />}
          <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Save note</AppText>
        </NeuPressable>
      </Sheet>

      {/* Treatment steps + Dr. Plant diagnosis sheets */}
      {plant.treatment ? (
        <TreatmentSheets
          treatment={plant.treatment}
          photos={photos}
          showSteps={sheet === 'treatment'}
          showDiagnosis={sheet === 'diagnosis'}
          onClose={() => setSheet(null)}
          onShowDiagnosis={() => setSheet('diagnosis')}
          onBackToSteps={() => setSheet('treatment')}
          onToggle={(i) => { void toggleStep(plant.treatment!.id, i); }}
        />
      ) : null}
    </View>
  );
}

function SheetRow({ icon, label, onPress, danger, busy }: { icon: IconName; label: string; onPress: () => void; danger?: boolean; busy?: boolean }) {
  const t = useTheme();
  const color = danger ? Palette.danger : t.fg;
  return (
    <NeuPressable onPress={onPress} elevation="raised" radius={14} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, height: 56 }} accessibilityLabel={label}>
      <NeuSurface elevation="pressed" radius={11} style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}>
        {busy ? <ActivityIndicator color={danger ? Palette.danger : Palette.ever500} /> : <Icon name={icon} size={19} color={danger ? Palette.danger : Palette.ever500} />}
      </NeuSurface>
      <AppText variant="bodyBold" color={color} style={{ fontSize: 14.5 }}>{label}</AppText>
    </NeuPressable>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function LocChip({ icon, label }: { icon: IconName; label: string }) {
  const t = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: t.accentTint }}
    >
      <Icon name={icon} size={12} tone="accent" />
      <AppText variant="small" tone="muted" style={{ fontSize: 11 }}>{label}</AppText>
    </View>
  );
}
