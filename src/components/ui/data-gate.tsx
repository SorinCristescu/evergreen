/**
 * DataGate — the app-wide list loading pattern. While a Convex query is still resolving
 * (`loading`) — OR while the list's images are still downloading — it shows the Evergreen mark
 * blooming on an infinite loop, centered. Only once data AND images are ready does the loader fade
 * out and the content fade/slide in (so cards never appear before their photos).
 *
 * Wrap the WHOLE screen body (header + list) so the logo lands in the middle of the screen:
 *   const data = useSomething();            // undefined while loading
 *   <DataGate loading={data === undefined} imageUrls={urlsFromData}>
 *     <AppHeader … /> … <ScrollView … />
 *   </DataGate>
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';

import { BrandMark } from '@/components/domain/brand-mark';
import { AppText } from '@/components/ui/app-text';

// Never let image prefetch hold the loader open longer than this (network stalls, failures).
const IMAGE_WAIT_CEILING_MS = 6000;

export function LogoLoader({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      {/* the mark blooms open/closed forever (same petals as the splash) */}
      <BrandMark size={96} animate="loop" />
      {label ? <AppText variant="small" tone="subtle" style={{ fontSize: 12 }}>{label}</AppText> : null}
    </View>
  );
}

export type DataGateProps = {
  loading: boolean;
  children: React.ReactNode;
  /** image URLs to preload before revealing the content (so cards appear with their photos) */
  imageUrls?: string[];
  /** optional caption under the loader */
  label?: string;
};

export function DataGate({ loading, children, imageUrls, label }: DataGateProps) {
  const [imagesReady, setImagesReady] = useState(false);
  // stable dependency for the URL set
  const key = imageUrls && imageUrls.length ? imageUrls.join('|') : '';

  useEffect(() => {
    if (loading) {
      setImagesReady(false);
      return;
    }
    const urls = key ? key.split('|') : [];
    if (urls.length === 0) {
      setImagesReady(true);
      return;
    }
    let cancelled = false;
    const reveal = () => { if (!cancelled) setImagesReady(true); };
    Promise.all(urls.map((u) => Image.prefetch(u).catch(() => false))).then(reveal);
    const timer = setTimeout(reveal, IMAGE_WAIT_CEILING_MS); // safety: never hang
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loading, key]);

  const showLoader = loading || !imagesReady;

  return showLoader ? (
    <Animated.View key="loader" exiting={FadeOut.duration(260)} style={{ flex: 1 }}>
      <LogoLoader label={label} />
    </Animated.View>
  ) : (
    <Animated.View key="content" entering={FadeInDown.duration(450).easing(Easing.out(Easing.cubic))} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
}
