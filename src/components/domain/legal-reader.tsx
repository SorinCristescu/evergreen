/** LegalReader — scroll-progress document reader for Terms/Privacy/Acknowledgements (Tier 4). */
import { useState } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ScrollProgressBar } from '@/components/ui/scroll-progress-bar';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type LegalSection = { heading: string; body: string; number?: string };
export type LegalReaderProps = {
  title: string;
  updatedLabel?: string;
  lead?: string;
  sections: LegalSection[];
  header?: React.ReactNode; // e.g. Privacy's data-at-a-glance card
  footer?: React.ReactNode;
};

export function LegalReader({ title, updatedLabel, lead, sections, header, footer }: LegalReaderProps) {
  const t = useTheme();
  const [progress, setProgress] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    setProgress(scrollable > 0 ? contentOffset.y / scrollable : 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={title} />
      <ScrollProgressBar progress={progress} />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: 14, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {updatedLabel ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              backgroundColor: t.accentTint,
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 999,
              marginBottom: 16,
            }}
          >
            <Icon name="history" size={12} strokeWidth={2} color={Palette.ever500} />
            <AppText variant="meta" color={Palette.ever500} uppercase style={{ fontSize: 10, letterSpacing: 0.6 }}>
              {updatedLabel}
            </AppText>
          </View>
        ) : null}

        {lead ? (
          <AppText variant="body" tone="muted" style={{ fontSize: 13.5, lineHeight: 21, marginBottom: 8 }}>
            {lead}
          </AppText>
        ) : null}

        {header}

        {sections.map((s) => (
          <View key={s.heading} style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9, marginBottom: 6 }}>
              {s.number ? (
                <AppText variant="meta" color={Palette.ever500} style={{ fontSize: 11 }}>{s.number}</AppText>
              ) : null}
              <AppText variant="subtitle" color={t.fg} style={{ fontSize: 14.5, flex: 1 }}>{s.heading}</AppText>
            </View>
            <AppText variant="body" tone="muted" style={{ fontSize: 12.5, lineHeight: 20 }}>
              {s.body}
            </AppText>
          </View>
        ))}

        {footer}
      </ScrollView>
    </View>
  );
}
