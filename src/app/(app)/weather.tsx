import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { TabBar } from '@/components/tab-bar';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet } from '@/components/ui/sheet';
import { WeatherGlyph } from '@/components/ui/weather-glyph';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';
import { careTipFor, useForecast, useLocations, type Forecast, type LocationRef } from '@/data';

const shortDay = (label: string) => (label === 'Today' ? 'Today' : label === 'Tomorrow' ? 'Tmrw' : label.slice(0, 3));

/** A small labelled stat (humidity / wind / feels-like / rain chance). */
function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const t = useTheme();
  return (
    <NeuSurface elevation="pressed" radius={14} style={{ flex: 1, alignItems: 'center', paddingVertical: 11, gap: 3 }}>
      <Icon name={icon} size={16} color={Palette.ever500} />
      <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13 }}>{value}</AppText>
      <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 8.5 }}>{label}</AppText>
    </NeuSurface>
  );
}

/** One location's live forecast: current conditions + stats + today / tomorrow / day-after + a care tip. */
function WeatherCard({ location }: { location: LocationRef }) {
  const t = useTheme();
  const fc: Forecast | undefined = useForecast(location);
  const tip = fc ? careTipFor(fc) : null;

  return (
    <NeuSurface elevation="raised" radius={18} stretch style={{ padding: Spacing.lg, gap: Spacing.md }}>
      {/* current */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
          {fc ? <WeatherGlyph kind={fc.current.kind} size={48} /> : <ActivityIndicator color={Palette.ever400} />}
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold">{location.name}</AppText>
          <AppText variant="small" tone="subtle">{fc ? `${fc.current.condition} · ${location.climateLabel}` : location.climateLabel}</AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="display2" style={{ fontSize: 32 }}>{fc ? `${fc.current.temp}°` : '—'}</AppText>
          {fc ? <AppText variant="metaSm" tone="subtle" style={{ fontSize: 10 }}>Feels {fc.current.feelsLike}°</AppText> : null}
        </View>
      </View>

      {/* current stats */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Stat icon="rain" label="Humidity" value={fc ? `${fc.current.humidity}%` : '—'} />
        <Stat icon="wind" label="Wind" value={fc ? `${fc.current.wind} km/h` : '—'} />
        <Stat icon="droplet" label="Rain" value={fc ? `${fc.days[0]?.precipProb ?? 0}%` : '—'} />
        <Stat icon="sun" label="UV" value={fc ? `${fc.days[0]?.uvIndex ?? 0}` : '—'} />
      </View>

      {/* 3-day forecast */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {(fc?.days ?? [null, null, null]).map((d, i) => (
          <NeuSurface key={d?.date ?? i} elevation="pressed" radius={14} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, gap: 6 }}>
            <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9 }}>{d ? shortDay(d.label) : '·'}</AppText>
            <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
              {d ? <WeatherGlyph kind={d.kind} size={28} /> : <ActivityIndicator color={Palette.ever400} />}
            </View>
            <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13 }}>{d ? `${d.tempMax}°` : '—'}</AppText>
            <AppText variant="metaSm" tone="subtle" style={{ fontSize: 10 }}>{d ? `${d.tempMin}°` : ''}</AppText>
            {d?.precipProb != null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Icon name="droplet" size={9} color="#5b8fb0" />
                <AppText variant="metaSm" style={{ fontSize: 9, color: '#5b8fb0' }}>{d.precipProb}%</AppText>
              </View>
            ) : null}
          </NeuSurface>
        ))}
      </View>

      {/* garden care tip derived from the forecast */}
      {tip ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: t.accentTint, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Icon name={tip.icon} size={16} color={Palette.ever500} />
          <AppText variant="small" color={t.ever700} style={{ flex: 1, fontSize: 12.5, lineHeight: 17 }}>{tip.text}</AppText>
        </View>
      ) : null}
    </NeuSurface>
  );
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
      <AppText variant="body" color={selected ? Palette.ever400 : t.fg} style={{ flex: 1 }}>{label}</AppText>
      {selected ? <Icon name="check" size={18} color={Palette.ever400} /> : null}
    </Pressable>
  );
}

export default function WeatherScreen() {
  const locations = useLocations() ?? [];
  const [selected, setSelected] = useState<'all' | string>('all'); // 'all' or a location id
  const [pickerOpen, setPickerOpen] = useState(false);

  const shown = selected === 'all' ? locations : locations.filter((l) => l.id === selected);
  const selectedLabel = selected === 'all' ? 'All locations' : locations.find((l) => l.id === selected)?.name ?? 'All locations';

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Weather" />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Location dropdown */}
        <Pressable onPress={() => setPickerOpen(true)} accessibilityRole="button" accessibilityLabel="Choose a location">
          <NeuSurface elevation="raised-sm" radius="md" stretch style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 13, paddingHorizontal: 16 }}>
            <Icon name="pin" size={18} color={Palette.ever400} />
            <AppText variant="bodyBold" style={{ flex: 1 }}>{selectedLabel}</AppText>
            <Icon name="chevronDown" size={18} tone="subtle" />
          </NeuSurface>
        </Pressable>

        {locations.length === 0 ? (
          <NeuSurface elevation="pressed" radius={18} stretch style={{ padding: Spacing.xxl, alignItems: 'center', gap: Spacing.sm }}>
            <Icon name="pin" size={26} tone="subtle" />
            <AppText variant="small" tone="subtle" align="center">Add a location to see its forecast.</AppText>
          </NeuSurface>
        ) : (
          shown.map((loc) => <WeatherCard key={loc.id} location={loc} />)
        )}

        <AppText variant="metaSm" tone="subtle" align="center" style={{ marginTop: Spacing.xs }}>Weather by Open-Meteo</AppText>
      </ScrollView>

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <AppText variant="title" style={{ marginBottom: 4 }}>Show forecast for</AppText>
        <OptionRow label="All locations" selected={selected === 'all'} onPress={() => { setSelected('all'); setPickerOpen(false); }} />
        {locations.map((l) => (
          <View key={l.id} style={{ borderTopWidth: 1, borderTopColor: 'rgba(125,148,136,0.18)' }}>
            <OptionRow label={`${l.name} · ${l.climateLabel}`} selected={selected === l.id} onPress={() => { setSelected(l.id); setPickerOpen(false); }} />
          </View>
        ))}
      </Sheet>

      {/* Global bottom bar — weather button marked active */}
      <TabBar standalone weatherActive />
    </View>
  );
}
