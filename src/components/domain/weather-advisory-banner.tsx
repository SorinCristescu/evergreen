/** WeatherAdvisoryBanner — advisory "rain expected — skip outdoor?" (never auto-skips). `.weather`. */
import { View } from 'react-native';

import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { AnimatedSun } from '@/components/ui/animated-sun';
import { WeatherGlyph } from '@/components/ui/weather-glyph';
import type { WeatherKind } from '@/data';

export type WeatherAdvisoryBannerProps = {
  kind?: WeatherKind; // live condition → animated glyph; falls back to the sun
  temp: string; // "19°"
  condition: string; // "Clear in Lisbon"
  advisoryStrong: string; // "Rain expected 3pm"
  advisory: string; // "— outdoor watering can wait."
};

export function WeatherAdvisoryBanner({ kind, temp, condition, advisoryStrong, advisory }: WeatherAdvisoryBannerProps) {
  return (
    <NeuSurface elevation="raised" radius={18} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 13, paddingHorizontal: 16 }}>
      {/* 92px lane matches the hero card's ring box (76 + 8×2 padding) so both cards' text starts at the same x */}
      <View style={{ width: 92, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
        <NeuSurface elevation="pressed" radius={20} style={{ width: 69, height: 69, alignItems: 'center', justifyContent: 'center' }}>
          {kind ? <WeatherGlyph kind={kind} size={48} /> : <AnimatedSun size={48} />}
        </NeuSurface>
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <AppText variant="bodyBold" numberOfLines={1}>
            {temp}
          </AppText>
          <AppText variant="meta" tone="subtle" numberOfLines={1} style={{ flexShrink: 1, fontSize: 10.5 }}>
            {condition}
          </AppText>
        </View>
        <AppText variant="meta" tone="subtle" style={{ fontSize: 10.5, marginTop: 2 }}>
          {advisoryStrong} {advisory}
        </AppText>
      </View>
    </NeuSurface>
  );
}
