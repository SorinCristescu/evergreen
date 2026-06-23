import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraReticle } from '@/components/domain/camera-reticle';
import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { TextField } from '@/components/ui/text-field';
import { fontFamily } from '@/constants/fonts';
import { plantPhotoForSeed, Palette, Radius, ScreenTopExtra, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';
import { useCreatePlant, usePlantEditor, useTreatmentActions, type IssueType, type Severity } from '@/data';

type Mode = 'identify' | 'diagnose' | 'photo' | 'manual';

const HINTS: Record<Mode, [string, string]> = {
  identify: ['Center the whole plant', 'Hold steady — good light helps us identify it.'],
  diagnose: ['Frame the affected leaf', 'Get close to the spots or webbing so Dr. Plant can see.'],
  photo: ['Frame your plant', 'Add a photo to its timeline to track growth.'],
  manual: ['Frame your new plant', 'Snap a photo, then fill in the details yourself.'],
};

const MODE_LABELS: Record<Mode, string> = { identify: 'Identify', diagnose: 'Diagnose', photo: 'Add photo', manual: 'Add manually' };

/** Mocked AI identification result (no real Plant.id/Anthropic call in this build). */
const IDENTIFIED = { scientificName: 'Monstera deliciosa', common: 'Swiss cheese plant' };

/** A mock Dr. Plant diagnosis (no real API in this build) with a recommended treatment plan. */
type Diagnosis = {
  diagnosis: string;
  issueType: IssueType;
  severity: Severity;
  confidence: number;
  summary: string;
  steps: string[];
};

const MOCK_DIAGNOSES: Diagnosis[] = [
  {
    diagnosis: 'Spider mites',
    issueType: 'pest',
    severity: 'medium',
    confidence: 92,
    summary: 'Fine webbing and pale stippling on the leaves point to spider mites — common when the air is warm and dry.',
    steps: ['Isolate from your other plants', 'Wipe both sides of every leaf', 'Apply neem oil weekly', 'Raise the humidity around the plant', 'Re-check in 2 weeks'],
  },
  {
    diagnosis: 'Root rot',
    issueType: 'disease',
    severity: 'high',
    confidence: 88,
    summary: 'Yellowing lower leaves and soft, dark stems suggest overwatering has tipped into root rot.',
    steps: ['Stop watering right away', 'Unpot and trim away mushy roots', 'Repot in fresh, well-draining soil', 'Water only when the top 3cm is dry', 'Re-check in 2 weeks'],
  },
  {
    diagnosis: 'Nitrogen deficiency',
    issueType: 'deficiency',
    severity: 'low',
    confidence: 90,
    summary: 'Evenly pale, older leaves are a classic sign the plant is running low on nitrogen.',
    steps: ['Apply a balanced liquid feed', 'Move to brighter, indirect light', 'Feed every 2 weeks through the growing season', 'Re-check in 2 weeks'],
  },
];

const SEVERITY: Record<Severity, { label: string; color: string }> = {
  low: { label: 'Low severity', color: Palette.leaf },
  medium: { label: 'Medium severity', color: Palette.warning },
  high: { label: 'High severity', color: Palette.danger },
};

/** Round translucent chrome button (close / flip). */
function ChromeButton({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
      }}
    >
      {children}
    </Pressable>
  );
}

export default function CaptureScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plantId, mode: modeParam, spaceId } = useLocalSearchParams<{ plantId?: string; mode?: string; spaceId?: string }>();
  const { createTreatment } = useTreatmentActions();
  const createPlant = useCreatePlant();
  const { addPhoto } = usePlantEditor();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraLive = Platform.OS !== 'web' && !!permission?.granted;

  // From a plant → Add photo + Diagnose (we know the plant). From the garden → Identify + Add manually.
  const fromPlant = !!plantId;
  const modes: Mode[] = fromPlant ? ['photo', 'diagnose'] : ['identify', 'manual'];

  // Optional starting mode (e.g. onboarding step 6 opens straight on Identify or Add manually).
  const initialMode: Mode = fromPlant ? 'photo' : modeParam === 'manual' ? 'manual' : 'identify';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [phase, setPhase] = useState<'camera' | 'result'>('camera');
  const [dx, setDx] = useState<Diagnosis | null>(null);
  const [busy, setBusy] = useState(false);

  // New-plant form fields (Identify uses just the nickname; Add manually uses all three).
  const [nickname, setNickname] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [description, setDescription] = useState('');

  const [tip, hint] = HINTS[mode];
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/garden'));

  const addPlant = async (input: { nickname?: string; scientificName?: string; description?: string }) => {
    if (busy) return;
    setBusy(true);
    try {
      const newId = await createPlant({ ...input, spaceId }); // spaceId set when adding to a freshly-created location
      // If we captured/picked a photo, make it the new plant's cover (non-fatal if the upload fails).
      if (capturedUri) {
        try {
          await addPhoto(newId, capturedUri, 'image/jpeg', true);
        } catch {
          /* plant is created regardless */
        }
      }
      router.replace('/(app)/(tabs)/garden'); // land back in the garden with the new plant
    } finally {
      setBusy(false);
    }
  };

  // Route a freshly captured/picked image URI by the active mode.
  const handleCaptured = async (uri: string | null) => {
    if (uri) setCapturedUri(uri);
    if (mode === 'photo') {
      // "Add photo" from a plant → save it straight to that plant, then return.
      if (plantId && uri) {
        setBusy(true);
        try {
          await addPhoto(plantId, uri);
        } finally {
          setBusy(false);
        }
      }
      close();
      return;
    }
    if (mode === 'diagnose') {
      setDx(MOCK_DIAGNOSES[Math.floor(Math.random() * MOCK_DIAGNOSES.length)]);
    }
    setPhase('result');
  };

  // Shutter → grab a real frame from the live camera (no-op viewfinder on web).
  const capture = async () => {
    if (busy) return;
    let uri: string | null = null;
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
      uri = photo?.uri ?? null;
    } catch {
      uri = null;
    }
    await handleCaptured(uri);
  };

  // Gallery button → pick from the photo library, then run the same per-mode flow.
  const pickFromGallery = async () => {
    if (busy) return;
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled) return;
    await handleCaptured(result.assets[0]?.uri ?? null);
  };

  const acceptTreatment = async () => {
    if (!plantId || !dx || busy) return;
    setBusy(true);
    try {
      await createTreatment({
        plantId,
        diagnosis: dx.diagnosis,
        issueType: dx.issueType,
        severity: dx.severity,
        steps: dx.steps,
      });
      router.back(); // back to plant detail — Care reflects the new treatment reactively
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#060d09' }}>
      {/* Live viewfinder — the real camera once granted; static image as the web / pre-permission fallback */}
      {cameraLive ? (
        <CameraView ref={cameraRef} style={{ position: 'absolute', inset: 0 }} facing={facing} />
      ) : (
        <Image
          source={require('../../../assets/images/capture-viewfinder.jpg')}
          style={{ position: 'absolute', inset: 0 }}
          contentFit="cover"
        />
      )}
      {/* Scrim over the photo: green-tinted glow + darkened edges so the reticle and controls stay legible */}
      <LinearGradient
        colors={['rgba(22,53,37,0.35)', 'rgba(10,20,14,0.45)', 'rgba(6,13,9,0.82)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}
      />
      <LinearGradient
        colors={['rgba(77,175,130,0.28)', 'transparent']}
        start={{ x: 0.25, y: 0.2 }}
        end={{ x: 0.7, y: 0.75 }}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Top bar: close (left) + tip pill (right) */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + Spacing.xxxl + ScreenTopExtra,
          left: Spacing.md,
          right: Spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <ChromeButton onPress={close} label="Close">
          <Icon name="close" size={20} color={Palette.white} />
        </ChromeButton>
        <View
          style={{
            height: 30,
            paddingHorizontal: 12,
            borderRadius: 999,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          <AppText
            color={Palette.white}
            style={{ fontFamily: fontFamily('body', '500'), fontSize: 11.5 }}
          >
            {tip}
          </AppText>
        </View>
      </View>

      {/* Reticle + hint only while the camera is live (or the web mock) */}
      {cameraLive || Platform.OS === 'web' ? (
        <>
          {/* Reticle — four L-brackets with idle pulse */}
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 208,
              height: 208,
              marginLeft: -104,
              marginTop: -104,
            }}
          >
            <CameraReticle size={208} />
          </View>

          {/* Hint below reticle */}
          <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, marginTop: 124, alignItems: 'center' }}>
            <AppText
              align="center"
              color="rgba(255,255,255,0.92)"
              style={{ fontFamily: fontFamily('body', '400'), fontSize: 12.5, lineHeight: 18, width: 220 }}
            >
              {hint}
            </AppText>
          </View>
        </>
      ) : null}

      {/* Permission gate — shown on native until camera access is granted */}
      {Platform.OS !== 'web' && !permission?.granted ? (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 }}>
          <Icon name="camera" size={42} color="rgba(255,255,255,0.92)" />
          <AppText
            align="center"
            color="rgba(255,255,255,0.92)"
            style={{ fontFamily: fontFamily('body', '500'), fontSize: 15, lineHeight: 22 }}
          >
            {permission && !permission.canAskAgain
              ? 'Camera access is off. Enable it in Settings to photograph your plants.'
              : 'Allow camera access to photograph and identify your plants.'}
          </AppText>
          <NeuPressable
            onPress={() => (permission && !permission.canAskAgain ? Linking.openSettings() : requestPermission())}
            radius={Radius.md}
            elevation="raised"
            backgroundColor={t.ever100}
            accessibilityLabel={permission && !permission.canAskAgain ? 'Open Settings' : 'Enable camera'}
            style={{ height: 48, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>
              {permission && !permission.canAskAgain ? 'Open Settings' : 'Enable camera'}
            </AppText>
          </NeuPressable>
        </View>
      ) : null}

      {/* Bottom controls */}
      {phase === 'camera' ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom + Spacing.xl,
            alignItems: 'center',
            gap: Spacing.lg,
          }}
        >
          {/* mode row */}
          <View
            style={{
              flexDirection: 'row',
              gap: 7,
              padding: 5,
              borderRadius: 999,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            {modes.map((m) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={{
                    height: 30,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    justifyContent: 'center',
                    backgroundColor: active ? t.canvas : 'transparent',
                  }}
                >
                  <AppText
                    color={active ? Palette.ever400 : 'rgba(255,255,255,0.7)'}
                    style={{ fontFamily: fontFamily('body', '600'), fontSize: 12.5 }}
                  >
                    {MODE_LABELS[m]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* shutter row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 44 }}>
            {/* gallery thumb */}
            <Pressable
              onPress={pickFromGallery}
              accessibilityRole="button"
              accessibilityLabel="Pick from gallery"
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.5)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#3a8c66', '#1c4d39']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', inset: 0 }}
              />
              <Icon name="image" size={20} color={Palette.white} />
            </Pressable>

            {/* shutter */}
            <Pressable
              onPress={capture}
              accessibilityRole="button"
              accessibilityLabel="Capture"
              style={{
                width: 70,
                height: 70,
                borderRadius: 999,
                borderWidth: 4,
                borderColor: 'rgba(255,255,255,0.9)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: Palette.white }} />
            </Pressable>

            {/* flip camera */}
            <ChromeButton onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} label="Flip camera">
              <Icon name="flip" size={20} color={Palette.white} />
            </ChromeButton>
          </View>
        </View>
      ) : null}

      {/* Result sheet — tap the dimmed backdrop (outside the sheet) to dismiss back to the camera */}
      {phase === 'result' ? (
        <View style={{ position: 'absolute', inset: 0, justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={() => setPhase('camera')}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
          />
          <View style={{ maxHeight: '86%' }}>
          <NeuSurface
            radius={26}
            style={{ paddingTop: Spacing.md, paddingHorizontal: 18, paddingBottom: insets.bottom + Spacing.xl }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 5,
                borderRadius: 999,
                backgroundColor: 'rgba(22,39,30,0.18)',
                marginBottom: 14,
              }}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
              {mode === 'diagnose' && dx ? (
                /* ── Dr. Plant diagnosis ─────────────────────────────────────── */
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 14 }}>
                    {capturedUri ? (
                      <Image source={{ uri: capturedUri }} style={{ width: 58, height: 58, borderRadius: 14 }} contentFit="cover" transition={150} />
                    ) : (
                      <View style={{ width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentTint }}>
                        <Icon name="warning" size={24} color={Palette.ever400} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <AppText variant="meta" tone="subtle" uppercase>Dr. Plant diagnosis</AppText>
                      <AppText variant="title" style={{ marginTop: 2 }}>{dx.diagnosis}</AppText>
                    </View>
                  </View>

                  {/* severity + confidence pills */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 13 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(22,39,30,0.06)' }}>
                      <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: SEVERITY[dx.severity].color }} />
                      <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 11.5 }} color={SEVERITY[dx.severity].color}>
                        {SEVERITY[dx.severity].label}
                      </AppText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(62,124,79,0.14)' }}>
                      <Icon name="star" size={13} color={Palette.leaf} filled />
                      <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 11.5 }} color={Palette.leaf}>
                        {dx.confidence}% confident
                      </AppText>
                    </View>
                  </View>

                  <AppText variant="small" style={{ fontSize: 13.5, lineHeight: 21, marginBottom: 16 }}>{dx.summary}</AppText>

                  <AppText variant="meta" tone="subtle" uppercase style={{ marginBottom: 10 }}>Recommended treatment</AppText>
                  <View style={{ gap: 10, marginBottom: 18 }}>
                    {dx.steps.map((step, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentTint }}>
                          <AppText style={{ fontFamily: fontFamily('mono', '600'), fontSize: 12 }} color={Palette.ever400}>{i + 1}</AppText>
                        </View>
                        <AppText variant="small" style={{ flex: 1, fontSize: 13, lineHeight: 18 }}>{step}</AppText>
                      </View>
                    ))}
                  </View>

                  <NeuPressable
                    onPress={acceptTreatment}
                    disabled={busy}
                    radius={Radius.md}
                    elevation="raised"
                    stretch
                    backgroundColor={t.ever100}
                    accessibilityLabel="Add treatment"
                    style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: busy ? 0.5 : 1 }}
                  >
                    {busy ? (
                      <ActivityIndicator color={Palette.ever400} />
                    ) : (
                      <>
                        <Icon name="plus" size={18} color={Palette.ever400} />
                        <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Add treatment</AppText>
                      </>
                    )}
                  </NeuPressable>
                  <Pressable onPress={() => setPhase('camera')} style={{ alignItems: 'center', paddingVertical: Spacing.sm, marginTop: 2 }}>
                    <AppText variant="small" color={Palette.ever400}>Retake photo</AppText>
                  </Pressable>
                </>
              ) : mode === 'manual' ? (
                /* ── Add manually: full form ─────────────────────────────────── */
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 }}>
                    <Image source={capturedUri ? { uri: capturedUri } : plantPhotoForSeed('manual-add')} style={{ width: 58, height: 58, borderRadius: 14 }} contentFit="cover" transition={150} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="meta" tone="subtle" uppercase>New plant</AppText>
                      <AppText variant="title" style={{ marginTop: 2 }}>Add the details</AppText>
                    </View>
                  </View>
                  <View style={{ gap: 14, marginBottom: 18 }}>
                    <TextField label="Nickname" value={nickname} onChangeText={setNickname} placeholder="e.g. Mara" autoFocus />
                    <TextField label="Scientific name" value={scientificName} onChangeText={setScientificName} placeholder="e.g. Ficus lyrata" />
                    <TextField label="Description" value={description} onChangeText={setDescription} placeholder="A note about this plant…" multiline maxLength={500} />
                  </View>
                  {(() => {
                    const disabled = busy || (!nickname.trim() && !scientificName.trim());
                    return (
                      <NeuPressable
                        onPress={() => addPlant({ nickname, scientificName, description })}
                        disabled={disabled}
                        radius={Radius.md}
                        elevation="raised"
                        stretch
                        backgroundColor={t.ever100}
                        accessibilityLabel="Add to Garden"
                        style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: disabled ? 0.5 : 1 }}
                      >
                        {busy ? (
                          <ActivityIndicator color={Palette.ever400} />
                        ) : (
                          <>
                            <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Add to Garden</AppText>
                            <Icon name="arrowUpRight" size={18} color={Palette.ever400} />
                          </>
                        )}
                      </NeuPressable>
                    );
                  })()}
                  <Pressable onPress={() => setPhase('camera')} style={{ alignItems: 'center', paddingVertical: Spacing.sm, marginTop: 2 }}>
                    <AppText variant="small" color={Palette.ever400}>Retake photo</AppText>
                  </Pressable>
                </>
              ) : (
                /* ── AI identification result ─────────────────────────────────── */
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 14 }}>
                    <Image source={capturedUri ? { uri: capturedUri } : plantPhotoForSeed(IDENTIFIED.scientificName)} style={{ width: 58, height: 58, borderRadius: 14 }} contentFit="cover" transition={150} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="meta" tone="subtle" uppercase>We found a match</AppText>
                      <AppText variant="title" style={{ marginTop: 2 }}>{IDENTIFIED.scientificName}</AppText>
                      <AppText variant="small" tone="muted" style={{ marginTop: 1 }}>{IDENTIFIED.common}</AppText>
                    </View>
                  </View>

                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      height: 26,
                      paddingHorizontal: 11,
                      borderRadius: 999,
                      backgroundColor: 'rgba(62,124,79,0.14)',
                      marginBottom: 13,
                    }}
                  >
                    <Icon name="star" size={13} color={Palette.leaf} filled />
                    <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 11.5 }} color={Palette.leaf}>
                      96% confident
                    </AppText>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <NeuSurface elevation="pressed" radius={14} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 }}>
                      <Icon name="sun" size={17} tone="accent" />
                      <View>
                        <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9 }} tone="subtle" uppercase>Light</AppText>
                        <AppText variant="bodyBold" style={{ fontSize: 12.5, marginTop: 1 }}>Bright indirect</AppText>
                      </View>
                    </NeuSurface>
                    <NeuSurface elevation="pressed" radius={14} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 }}>
                      <Icon name="droplet" size={17} tone="accent" />
                      <View>
                        <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 9 }} tone="subtle" uppercase>Water</AppText>
                        <AppText variant="bodyBold" style={{ fontSize: 12.5, marginTop: 1 }}>Every 7 days</AppText>
                      </View>
                    </NeuSurface>
                  </View>

                  {/* nickname for the plant we're about to add */}
                  <View style={{ marginBottom: 14 }}>
                    <TextField label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="Give it a name…" />
                  </View>

                  <NeuPressable
                    onPress={() => addPlant({ nickname, scientificName: IDENTIFIED.scientificName })}
                    disabled={busy}
                    radius={Radius.md}
                    elevation="raised"
                    stretch
                    backgroundColor={t.ever100}
                    accessibilityLabel="Add to Garden"
                    style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: busy ? 0.5 : 1 }}
                  >
                    {busy ? (
                      <ActivityIndicator color={Palette.ever400} />
                    ) : (
                      <>
                        <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>Add to Garden</AppText>
                        <Icon name="arrowUpRight" size={18} color={Palette.ever400} />
                      </>
                    )}
                  </NeuPressable>
                  <Pressable onPress={() => setPhase('camera')} style={{ alignItems: 'center', paddingVertical: Spacing.sm, marginTop: 2 }}>
                    <AppText variant="small" color={Palette.ever400}>Not quite right? See other matches</AppText>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </NeuSurface>
          </View>
        </View>
      ) : null}
    </View>
  );
}
