/** PhotoCarousel — swipeable hero pager (Plant detail). `.hero` (188px) in evergreen-plant-detail.html. */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { coverForSeed, Palette } from '@/constants/tokens';

export type PhotoCarouselProps = {
  photos: { uri: string; id: string }[];
  seed?: string; // used to pick gradient placeholders when empty
  height?: number;
  onIndexChange?: (i: number) => void;
};

export function PhotoCarousel({ photos, seed = 'x', height = 188, onIndexChange }: PhotoCarouselProps) {
  const width = Dimensions.get('window').width;
  const [index, setIndex] = useState(0);
  // when no real photos, show 3 gradient slides so the swipe affordance reads
  const slides = photos.length > 0 ? photos : [0, 1, 2].map((n) => ({ id: `ph-${n}`, uri: '' }));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) {
      setIndex(i);
      onIndexChange?.(i);
    }
  };

  return (
    <View style={{ height }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll}>
        {slides.map((slide, i) => {
          const [from, to] = coverForSeed(`${seed}-${i}`);
          return (
            <View key={slide.id} style={{ width, height }}>
              {slide.uri ? (
                <Image source={{ uri: slide.uri }} style={{ width, height }} contentFit="cover" />
              ) : (
                <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
              )}
            </View>
          );
        })}
      </ScrollView>
      {slides.length > 1 ? (
        <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {slides.map((s, i) => (
            <View
              key={s.id}
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: i === index ? Palette.white : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
