/**
 * Custom bottom tab bar — neumorphic, with the center camera FAB (the diagram's signature).
 * Replaces Expo Router's NativeTabs (which can't host the floating FAB).
 * Order: [Today] [Garden] (📷 FAB) [Community] [Profile].
 *
 * Also usable standalone (outside the Tabs navigator) on a pushed detail screen — pass
 * `standalone` so it navigates via the router and highlights no tab, and `showFab={false}`
 * for a flat four-tab row (e.g. stacked beneath a screen's own pinned action bar).
 */
import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComposeSheet } from '@/components/domain/compose-sheet';
import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { fontFamily } from '@/constants/fonts';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

const TAB_META: Record<string, { icon: IconName; label: string }> = {
  today: { icon: 'checklist', label: 'Today' },
  garden: { icon: 'leaf', label: 'Garden' },
  community: { icon: 'people', label: 'Community' },
  profile: { icon: 'user', label: 'Profile' },
};

const TAB_ORDER = ['today', 'garden', 'community', 'profile'];

// Literal hrefs for standalone navigation (outside the navigator there's no route to `navigate`).
const TAB_HREF: Record<string, Href> = {
  today: '/(app)/(tabs)/today',
  garden: '/(app)/(tabs)/garden',
  community: '/(app)/(tabs)/community',
  profile: '/(app)/(tabs)/profile',
};

type TabRoute = { key: string; name: string };
export type TabBarProps = {
  state?: { index: number; routes: TabRoute[] };
  navigation?: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  /** Rendered outside the Tabs navigator (e.g. a pushed detail screen) — navigates via the router. */
  standalone?: boolean;
  /** Show the center camera FAB. Defaults to true; pass false for a flat four-tab row. */
  showFab?: boolean;
  /** Show the four tab icon buttons. Defaults to true; pass false for a FAB-only bar. */
  showTabs?: boolean;
  /** Caption shown centered under the FAB in a FAB-only bar (e.g. a recommendation on a detail screen). */
  caption?: ReactNode;
  /** Override the FAB action (defaults to opening the capture screen / compose sheet). */
  onFabPress?: () => void;
  /** Render the center weather button as the active item (used on the Weather screen itself). */
  weatherActive?: boolean;
};

export function TabBar({ state, navigation, standalone = false, showFab = true, showTabs = true, caption, onFabPress, weatherActive = false }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [composeOpen, setComposeOpen] = useState(false);

  // Inside the navigator, hide the bar on pushed/detail screens (capture, messages, settings…) —
  // only the four main tabs show it. Standalone callers opt in explicitly, so never bail there.
  const activeName = standalone ? undefined : state?.routes[state.index]?.name;
  if (!standalone && !TAB_ORDER.includes(activeName ?? '')) return null;

  // Unselected tabs read dimmer in dark mode so the active green stands out.
  const inactiveColor = theme.scheme === 'dark' ? '#4f685b' : theme.fgSubtle;

  // Keep a floor of breathing room below the labels even where there's no safe-area inset (web),
  // so they're never crammed against / clipped by the screen's bottom edge.
  const bottomInset = Math.max(insets.bottom, 12);

  // The center button varies by tab: Garden adds a plant (camera) and Community composes a post —
  // both as the raised FAB; Today / Profile open the Weather screen as a plain tab-style icon
  // button (no FAB, no animation). A standalone caller can override the FAB via onFabPress.
  type CenterButton =
    | { kind: 'fab'; icon: IconName; motion: 'zoom' | 'spin'; label: string; a11y: string; onPress: () => void }
    | { kind: 'tab'; icon: IconName; label: string; a11y: string; active?: boolean; onPress: () => void };
  const center: CenterButton | null = !showFab
    ? null
    : onFabPress
      ? { kind: 'fab', icon: 'camera', motion: 'zoom', label: '', a11y: 'Capture', onPress: onFabPress }
      : weatherActive
        ? { kind: 'tab', icon: 'weather', label: 'Weather', a11y: 'Weather', active: true, onPress: () => {} }
        : activeName === 'community'
          ? { kind: 'fab', icon: 'plus', motion: 'zoom', label: 'Post', a11y: 'Create a post', onPress: () => setComposeOpen(true) }
          : activeName === 'today' || activeName === 'profile'
            ? { kind: 'tab', icon: 'weather', label: 'Weather', a11y: 'Open the weather forecast', onPress: () => router.push('/(app)/weather') }
            : activeName === 'garden'
              ? { kind: 'fab', icon: 'camera', motion: 'zoom', label: 'Add plant', a11y: 'Capture — identify or add a plant', onPress: () => router.push('/(app)/capture') }
              : null;
  const fab = center?.kind === 'fab' ? center : null;
  const centerTab = center?.kind === 'tab' ? center : null;

  const flatRow = !showFab;
  // FAB-only bar carrying a recommendation line instead of tab buttons (detail screens).
  const captionOnly = !showTabs && !!caption;

  const tabs = TAB_ORDER.map((name) => {
    const routeIndex = standalone ? -1 : state!.routes.findIndex((r) => r.name === name);
    return { name, routeIndex, ...TAB_META[name] };
  }).filter((t) => standalone || t.routeIndex >= 0);

  const renderTab = (t: (typeof tabs)[number]) => {
    const focused = !standalone && state!.index === t.routeIndex;
    const onPress = () => {
      if (standalone) {
        router.navigate(TAB_HREF[t.name]);
        return;
      }
      const route = state!.routes[t.routeIndex];
      const event = navigation!.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation!.navigate(route.name);
    };
    return (
      <Pressable
        key={t.name}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t.label}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: Spacing.sm }}
      >
        <Icon name={t.icon} size={25} color={focused ? Palette.ever400 : inactiveColor} />
        <Text
          style={{
            fontFamily: fontFamily('body', focused ? '600' : '500'),
            fontSize: 8.8,
            color: focused ? Palette.ever400 : inactiveColor,
          }}
        >
          {t.label}
        </Text>
      </Pressable>
    );
  };

  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <NeuSurface radius={22} elevation="raised" stretch style={{ flexDirection: 'row', alignItems: 'center', justifyContent: captionOnly ? 'center' : 'flex-start', paddingHorizontal: 14, paddingTop: captionOnly ? 30 : Math.round(bottomInset / 2), height: 62 + bottomInset, paddingBottom: captionOnly ? bottomInset : Math.round(bottomInset / 2), borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        {showTabs ? (
          flatRow ? (
            tabs.map(renderTab)
          ) : (
            <>
              {left.map(renderTab)}
              {centerTab ? (
                // Weather: a plain tab-style icon button (static icon + label, like the other tabs)
                <Pressable
                  onPress={centerTab.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={centerTab.a11y}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: Spacing.sm }}
                >
                  <Icon name={centerTab.icon} size={25} color={centerTab.active ? Palette.ever400 : inactiveColor} />
                  <Text style={{ fontFamily: fontFamily('body', centerTab.active ? '600' : '500'), fontSize: 8.8, color: centerTab.active ? Palette.ever400 : inactiveColor }}>{centerTab.label}</Text>
                </Pressable>
              ) : (
                // FAB center slot — a label aligned with the tab labels (icon-height spacer stands
                // in for a tab's icon so the text drops to the same baseline as the other labels).
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: Spacing.sm }}>
                  <View style={{ height: 25 }} />
                  {fab && fab.label ? (
                    <Text numberOfLines={1} style={{ fontFamily: fontFamily('body', '500'), fontSize: 8.8, color: inactiveColor }}>
                      {fab.label}
                    </Text>
                  ) : null}
                </View>
              )}
              {right.map(renderTab)}
            </>
          )
        ) : caption ? (
          // Sits in the band below the FAB (paddingTop clears the FAB overhang).
          <View pointerEvents="none" style={{ paddingHorizontal: 24 }}>{caption}</View>
        ) : null}
      </NeuSurface>

      {/* Raised FAB — camera (Add plant) on Garden, compose (Post) on Community. Today/Profile use
          the flat weather tab button above instead, so no FAB renders there. */}
      {fab ? (
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: -37, alignItems: 'center' }}>
        <NeuPressable
          onPress={fab.onPress}
          radius="full"
          elevation="raised"
          backgroundColor={theme.ever100}
          accessibilityLabel={fab.a11y}
          style={{ width: 74, height: 74, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
        >
          {/* tiny optical nudge: the camera glyph is top-heavy (viewfinder bump), so it reads a
              touch high in the circle — drop it ~2px to sit visually centered */}
          <View style={{ transform: [{ translateY: fab.icon === 'camera' ? 2 : 0 }] }}>
            <AnimatedIcon name={fab.icon} size={34} color={Palette.ever400} motion={fab.motion} />
          </View>
        </NeuPressable>
      </View>
      ) : null}

      <ComposeSheet visible={composeOpen} onClose={() => setComposeOpen(false)} />
    </View>
  );
}
