/** StarRating — 1–5 star input (Rate screen). The tapped star sits in a highlighted box. */
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Palette } from '@/constants/tokens';

export type StarRatingProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: number;
};

// Selection ring around the tapped star (matches the handoff screenshots).
const SELECT_BORDER = '#4f7fd6';

export function StarRating({ value, onChange, max = 5, size = 40 }: StarRatingProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1;
        const filled = n <= value;
        const selected = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
            style={{
              padding: 6,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selected ? SELECT_BORDER : 'transparent',
              backgroundColor: selected ? 'rgba(79,127,214,0.08)' : 'transparent',
            }}
          >
            <Icon name="star" size={size} filled={filled} color={filled ? Palette.sun : 'rgba(22,39,30,0.18)'} />
          </Pressable>
        );
      })}
    </View>
  );
}
