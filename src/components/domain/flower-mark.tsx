/** FlowerMark — the Evergreen 8-petal flower glyph (matches the handoff `flowerSVG()`). */
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

const PETALS = ['#2c694e', '#377a5b', '#46866a', '#5fa17f', '#7cbf9b', '#9bd8b9', '#a9dfc6', '#8ed1b1'];

export function FlowerMark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <G>
        {PETALS.map((c, i) => (
          <Ellipse key={i} cx={120} cy={68} rx={32} ry={57} transform={`rotate(${i * 45} 120 120)`} fill={c} fillOpacity={0.86} />
        ))}
        <Circle cx={120} cy={120} r={20} fill="#0c1f17" />
        <Ellipse cx={113} cy={113} rx={6} ry={4.5} fill="rgba(154,215,184,0.30)" />
      </G>
    </Svg>
  );
}
