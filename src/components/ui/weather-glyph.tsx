/** WeatherGlyph — maps a forecast condition family to its animated icon:
 *  sun → spinning sun · cloud → sun behind a drifting cloud · rain → cloud with falling drops ·
 *  snow → cloud with drifting flakes. */
import { AnimatedRain } from '@/components/ui/animated-rain';
import { AnimatedSnow } from '@/components/ui/animated-snow';
import { AnimatedSun } from '@/components/ui/animated-sun';
import { AnimatedSunCloud } from '@/components/ui/animated-sun-cloud';
import { Palette } from '@/constants/tokens';
import type { WeatherKind } from '@/data';

export function WeatherGlyph({ kind, size = 24 }: { kind: WeatherKind; size?: number }) {
  switch (kind) {
    case 'sun':
      return <AnimatedSun size={size} color={Palette.sun} />;
    case 'rain':
      return <AnimatedRain size={size} color="#5b8fb0" strokeWidth={2} />;
    case 'snow':
      return <AnimatedSnow size={size} />;
    case 'cloud':
    default:
      return <AnimatedSunCloud size={size} />;
  }
}
