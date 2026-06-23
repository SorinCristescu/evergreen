/** CityClimateSearch — onboarding climate step: search a city → live climate preview (Tier 4). */
import { View } from 'react-native';

import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Pill } from '@/components/ui/pill';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/tokens';

export type CityResult = { id: string; label: string };
export type ClimatePreview = { label: string };

export type CityClimateSearchProps = {
  query: string;
  onChangeQuery: (q: string) => void;
  results: CityResult[];
  onSelectCity: (city: CityResult) => void;
  selected?: CityResult;
  preview?: ClimatePreview;
  onUseDeviceLocation?: () => void;
};

export function CityClimateSearch({ query, onChangeQuery, results, onSelectCity, selected, preview }: CityClimateSearchProps) {
  return (
    <View style={{ gap: Spacing.md }}>
      <TextField value={query} onChangeText={onChangeQuery} placeholder="Search your city" leadingIcon="search" />
      {!selected && query.length > 1
        ? results.map((c) => (
            <NeuPressable key={c.id} onPress={() => onSelectCity(c)} radius={12} elevation="raised-sm" style={{ padding: Spacing.md }}>
              <AppText variant="body">{c.label}</AppText>
            </NeuPressable>
          ))
        : null}
      {selected && preview ? <Pill label={preview.label} tone="info" leadingIcon="sun" /> : null}
    </View>
  );
}
