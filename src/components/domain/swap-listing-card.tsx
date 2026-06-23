/** SwapListingCard — a swap-board listing (non-commercial). `.scard` in evergreen-community.html. */
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { coverForSeed, Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type SwapListing = {
  id: string;
  tag: 'Offering' | 'Seeking';
  title: string;
  seek: string; // "Seeking: any trailing pothos" / "Offering: spider plant babies"
};

export type SwapListingCardProps = {
  listing: SwapListing;
  onMessage: () => void;
};

export function SwapListingCard({ listing, onMessage }: SwapListingCardProps) {
  const t = useTheme();
  const [from, to] = coverForSeed(listing.id);
  return (
    <NeuSurface radius={16} stretch style={{ overflow: 'hidden', flex: 1 }}>
      <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 96, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="leaf" size={22} color="rgba(255,255,255,0.5)" />
      </LinearGradient>
      <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 13, paddingBottom: 14 }}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: t.accentTint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10 }}>
          <AppText variant="metaSm" color={Palette.ever500} uppercase style={{ fontSize: 8.5, letterSpacing: 0.7 }}>{listing.tag}</AppText>
        </View>
        <AppText variant="bodyBold" color={t.fg} numberOfLines={2} style={{ fontSize: 13, lineHeight: 18 }}>{listing.title}</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 11, marginTop: 7, marginBottom: 14, lineHeight: 16 }}>{listing.seek}</AppText>
        <NeuPressable onPress={onMessage} elevation="raised-sm" radius={999} accessibilityLabel="Message to arrange" style={{ alignSelf: 'center', height: 34, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 'auto' }}>
          <AppText variant="bodyBold" color={t.ever700} style={{ fontSize: 10 }}>Message to arrange</AppText>
        </NeuPressable>
      </View>
    </NeuSurface>
  );
}
