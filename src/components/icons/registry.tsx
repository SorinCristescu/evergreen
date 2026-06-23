/**
 * Icon registry — the handoff's inline stroke SVGs ported to react-native-svg.
 * Each entry renders the inner elements of a 24×24 viewBox. Stroke icons inherit `stroke`;
 * `filled` icons (heart, bookmark, star) swap to `fill`.
 *
 * Core set covers the chrome the 29 screens use. Extend by extracting remaining exact paths
 * from `docs/design/evergreen-mobile-app-design/evergreen-*.html` (the `I = {…}` SVG maps).
 */
import { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type IconRenderProps = { stroke: string; fill: string; strokeWidth: number; filled: boolean };
type IconNode = (p: IconRenderProps) => React.ReactNode;

const s = (p: IconRenderProps) => ({
  stroke: p.stroke,
  strokeWidth: p.strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

export const ICONS: Record<string, IconNode> = {
  search: (p) => (
    <>
      <Circle cx={11} cy={11} r={7} {...s(p)} />
      <Line x1={20} y1={20} x2={16.8} y2={16.8} {...s(p)} />
    </>
  ),
  bell: (p) => (
    <>
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...s(p)} />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" {...s(p)} />
    </>
  ),
  heart: (p) =>
    p.filled ? (
      <Path d="M12 20s-7-4.4-9.2-8.2A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 9.2 5.3C19 15.6 12 20 12 20Z" fill={p.fill} />
    ) : (
      <Path d="M12 20s-7-4.4-9.2-8.2A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 9.2 5.3C19 15.6 12 20 12 20Z" {...s(p)} />
    ),
  bookmark: (p) =>
    p.filled ? (
      <Path d="M6 4h12v17l-6-4-6 4Z" fill={p.fill} />
    ) : (
      <Path d="M6 4h12v17l-6-4-6 4Z" {...s(p)} />
    ),
  star: (p) =>
    p.filled ? (
      <Path
        d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17.8 6.4 20.3l1.2-6.2L3 9.8l6.3-.8L12 3Z"
        fill={p.fill}
      />
    ) : (
      <Path
        d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17.8 6.4 20.3l1.2-6.2L3 9.8l6.3-.8L12 3Z"
        {...s(p)}
      />
    ),
  spark: (p) => <Path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z" fill={p.fill} />,
  leaf: (p) => (
    <>
      <Path d="M21 4c-8 0-14 5-14 12a6 6 0 0 0 12 0c1-5 1-8 2-12Z" {...s(p)} />
      <Path d="M7 21c0-6 3-10 8-13" {...s(p)} />
    </>
  ),
  droplet: (p) => (
    <Path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" {...s(p)} />
  ),
  camera: (p) => (
    <>
      <Path d="M4 8a2 2 0 0 1 2-2h1.2a2 2 0 0 0 1.7-1l.5-.8a2 2 0 0 1 1.7-1h1.4a2 2 0 0 1 1.7 1l.5.8a2 2 0 0 0 1.7 1H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" {...s(p)} />
      <Circle cx={12} cy={13} r={3.4} {...s(p)} />
    </>
  ),
  plus: (p) => (
    <>
      <Line x1={12} y1={5} x2={12} y2={19} {...s(p)} />
      <Line x1={5} y1={12} x2={19} y2={12} {...s(p)} />
    </>
  ),
  pencil: (p) => (
    <Path d="M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4" {...s(p)} />
  ),
  more: (p) => (
    <>
      <Circle cx={12} cy={5} r={1.6} fill={p.stroke} stroke="none" />
      <Circle cx={12} cy={12} r={1.6} fill={p.stroke} stroke="none" />
      <Circle cx={12} cy={19} r={1.6} fill={p.stroke} stroke="none" />
    </>
  ),
  check: (p) => <Polyline points="4 12 10 18 20 6" {...s(p)} />,
  checkDouble: (p) => (
    <>
      <Path d="M2 13l4 4 7-9" {...s(p)} />
      <Path d="M11 16l1.5 1.5L21 8" {...s(p)} />
    </>
  ),
  chevronRight: (p) => <Polyline points="9 6 15 12 9 18" {...s(p)} />,
  chevronDown: (p) => <Polyline points="6 9 12 15 18 9" {...s(p)} />,
  back: (p) => <Polyline points="15 18 9 12 15 6" {...s(p)} />,
  close: (p) => (
    <>
      <Line x1={6} y1={6} x2={18} y2={18} {...s(p)} />
      <Line x1={18} y1={6} x2={6} y2={18} {...s(p)} />
    </>
  ),
  lock: (p) => (
    <>
      <Path d="M7 11V8a5 5 0 0 1 10 0v3" {...s(p)} />
      <Path d="M5 11h14v9H5z" {...s(p)} />
    </>
  ),
  settings: (p) => (
    <>
      <Circle cx={12} cy={12} r={3} {...s(p)} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...s(p)} />
    </>
  ),
  download: (p) => (
    <>
      <Line x1={12} y1={4} x2={12} y2={15} {...s(p)} />
      <Polyline points="7 10 12 15 17 10" {...s(p)} />
      <Line x1={5} y1={20} x2={19} y2={20} {...s(p)} />
    </>
  ),
  home: (p) => (
    <Path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8Z" {...s(p)} />
  ),
  greenhouse: (p) => (
    <>
      <Path d="M4 21V9l8-5 8 5v12" {...s(p)} />
      <Path d="M12 4v17M4 12h16" {...s(p)} />
    </>
  ),
  calendar: (p) => (
    <>
      <Path d="M4 6h16v14H4z" {...s(p)} />
      <Line x1={4} y1={10} x2={20} y2={10} {...s(p)} />
      <Line x1={9} y1={3} x2={9} y2={7} {...s(p)} />
      <Line x1={15} y1={3} x2={15} y2={7} {...s(p)} />
    </>
  ),
  people: (p) => (
    <>
      <Circle cx={9} cy={8} r={3} {...s(p)} />
      <Path d="M3.5 20a5.5 5.5 0 0 1 11 0" {...s(p)} />
      <Path d="M16 6.2a3 3 0 0 1 0 5.6M18.5 20a5.5 5.5 0 0 0-3-4.9" {...s(p)} />
    </>
  ),
  user: (p) => (
    <>
      <Circle cx={12} cy={8} r={4} {...s(p)} />
      <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...s(p)} />
    </>
  ),
  checklist: (p) => (
    <>
      <Path d="M9 6h11M9 12h11M9 18h7" {...s(p)} />
      <Path d="M3.5 6l1 1 1.5-2M3.5 12l1 1 1.5-2M3.5 18l1 1 1.5-2" {...s(p)} />
    </>
  ),
  comment: (p) => (
    <Path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.6A8.4 8.4 0 1 1 21 11.5Z" {...s(p)} />
  ),
  send: (p) => (
    <Path d="M21 3 3 11l7 2 2 7 9-17Z" {...s(p)} />
  ),
  pin: (p) => (
    <>
      <Path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" {...s(p)} />
      <Circle cx={12} cy={10} r={2.5} {...s(p)} />
    </>
  ),
  sun: (p) => (
    <>
      <Circle cx={12} cy={12} r={4} {...s(p)} />
      <Path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1 1M17.4 17.4l1 1M18.4 5.6l-1 1M6.6 17.4l-1 1" {...s(p)} />
    </>
  ),
  // partly-cloudy: a small sun in the upper-left with a cloud overlapping the lower-right
  weather: (p) => (
    <>
      <Circle cx={8} cy={8} r={3} {...s(p)} />
      <Path d="M8 2.5V4M2.5 8H4M4.2 4.2l1.1 1.1M11.8 4.2l-1.1 1.1M4.2 11.8l1.1-1.1" {...s(p)} />
      <Path d="M9.5 19a3.4 3.4 0 0 1 .3-6.8 4.6 4.6 0 0 1 8.7 1.2A2.9 2.9 0 0 1 17.2 19Z" {...s(p)} />
    </>
  ),
  // wind: three flowing gusts, each curling off at the end (Feather-style)
  wind: (p) => (
    <Path d="M9.6 4.6A2 2 0 1 1 11 8H3M12.6 19.4A2 2 0 1 0 14 16H3M17.7 7.7A2.5 2.5 0 1 1 19.5 12H3" {...s(p)} />
  ),
  warning: (p) => (
    <>
      <Path d="M12 3 2 20h20L12 3Z" {...s(p)} />
      <Line x1={12} y1={10} x2={12} y2={14} {...s(p)} />
      <Circle cx={12} cy={17} r={1} fill={p.stroke} stroke="none" />
    </>
  ),
  trash: (p) => (
    <>
      <Path d="M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13" {...s(p)} />
    </>
  ),
  share: (p) => (
    <>
      <Circle cx={6} cy={12} r={2.5} {...s(p)} />
      <Circle cx={18} cy={6} r={2.5} {...s(p)} />
      <Circle cx={18} cy={18} r={2.5} {...s(p)} />
      <Line x1={8.2} y1={11} x2={15.8} y2={7} {...s(p)} />
      <Line x1={8.2} y1={13} x2={15.8} y2={17} {...s(p)} />
    </>
  ),
  scissors: (p) => (
    <>
      <Circle cx={6} cy={6} r={2.5} {...s(p)} />
      <Circle cx={6} cy={18} r={2.5} {...s(p)} />
      <Line x1={8} y1={7.5} x2={20} y2={17} {...s(p)} />
      <Line x1={8} y1={16.5} x2={20} y2={7} {...s(p)} />
    </>
  ),
  trophy: (p) => (
    <>
      <Path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" {...s(p)} />
      <Path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 13v4" {...s(p)} />
    </>
  ),
  image: (p) => (
    <>
      <Rect x={3} y={4} width={18} height={16} rx={2.5} {...s(p)} />
      <Circle cx={8.5} cy={9.5} r={1.6} {...s(p)} />
      <Path d="m4 17 4.5-4.5 4 4L16 13l4 4" {...s(p)} />
    </>
  ),
  grid: (p) => (
    <>
      <Rect x={3} y={3} width={7} height={7} rx={1.5} {...s(p)} />
      <Rect x={14} y={3} width={7} height={7} rx={1.5} {...s(p)} />
      <Rect x={3} y={14} width={7} height={7} rx={1.5} {...s(p)} />
      <Path d="M17.5 14v7M14 17.5h7" {...s(p)} />
    </>
  ),
  flame: (p) =>
    p.filled ? (
      <Path d="M12 2c1 3-1 4-2 6-1 1.6-2 3-2 5a6 6 0 0 0 12 0c0-2.4-1.4-4.4-2.6-5.6.2 1.6-.6 2.6-1.4 2.6 0-2-1-4-4-8Z" fill={p.fill} />
    ) : (
      <Path d="M12 2c1 3-1 4-2 6-1 1.6-2 3-2 5a6 6 0 0 0 12 0c0-2.4-1.4-4.4-2.6-5.6.2 1.6-.6 2.6-1.4 2.6 0-2-1-4-4-8Z" {...s(p)} />
    ),
  mist: (p) => (
    <>
      <Path d="M5 16h14M7 20h10M9 8c0-2 1.5-3 3-3s3 1 3 3" {...s(p)} />
      <Path d="M4 12h.01M8 12h.01M12 12h.01M16 12h.01M20 12h.01" {...s(p)} />
    </>
  ),
  rain: (p) => (
    <>
      <Path d="M7 13a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17.5 13Z" {...s(p)} />
      <Path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" {...s(p)} />
    </>
  ),
  fertilize: (p) => (
    <>
      <Path d="M21 4c-8 0-14 5-14 12a6 6 0 0 0 12 0c1-5 1-8 2-12Z" {...s(p)} />
      <Path d="M7 21c0-6 3-10 8-13" {...s(p)} />
    </>
  ),
  rotate: (p) => (
    <>
      <Path d="M21 12a9 9 0 1 1-3-6.7" {...s(p)} />
      <Polyline points="21 4 21 8 17 8" {...s(p)} />
    </>
  ),
  scan: (p) => (
    <>
      <Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" {...s(p)} />
      <Circle cx={12} cy={12} r={3} {...s(p)} />
    </>
  ),
  flip: (p) => (
    <>
      <Path d="M3 7h13l-2-2M21 17H8l2 2" {...s(p)} />
      <Path d="M21 7v4M3 17v-4" {...s(p)} />
    </>
  ),
  arrowUp: (p) => (
    <Path d="M12 19V5M5 12l7-7 7 7" {...s(p)} />
  ),
  arrowUpRight: (p) => (
    <>
      <Line x1={7} y1={17} x2={17} y2={7} {...s(p)} />
      <Polyline points="8 7 17 7 17 16" {...s(p)} />
    </>
  ),
  arrowRight: (p) => (
    <>
      <Line x1={5} y1={12} x2={19} y2={12} {...s(p)} />
      <Polyline points="13 6 19 12 13 18" {...s(p)} />
    </>
  ),
  sprout: (p) => (
    <>
      <Path d="M12 20v-7" {...s(p)} />
      <Path d="M12 13c0-2.5-2-4.5-5-4.5 0 3 2 4.5 5 4.5Z" {...s(p)} />
      <Path d="M12 13c0-2.8 2.2-5 5-5 0 3.2-2.2 5-5 5Z" {...s(p)} />
    </>
  ),
  plant: (p) => (
    <>
      <Path d="M12 21v-9" {...s(p)} />
      <Path d="M12 12C9 12 6.5 9.8 6.5 6.5 9.8 6.5 12 8.8 12 12Z" {...s(p)} />
      <Path d="M12 12c0-3.6 2.6-6.3 6-6.3 0 3.7-2.6 6.3-6 6.3Z" {...s(p)} />
      <Path d="M7.5 21h9" {...s(p)} />
    </>
  ),
  tree: (p) => (
    <>
      <Path d="M12 22v-5" {...s(p)} />
      <Path d="M12 17a6 6 0 0 0 5-9.4A5 5 0 0 0 7.8 6 5 5 0 0 0 7 16a6 6 0 0 0 5 1Z" {...s(p)} />
      <Path d="m10 13 2-2 2 2" {...s(p)} />
    </>
  ),
  trend: (p) => (
    <>
      <Polyline points="3 17 9 11 13 15 21 7" {...s(p)} />
      <Polyline points="16 7 21 7 21 12" {...s(p)} />
    </>
  ),
  book: (p) => (
    <>
      <Path d="M12 7c-2-1.4-5-1.4-7-.4v11c2-1 5-1 7 .4" {...s(p)} />
      <Path d="M12 7c2-1.4 5-1.4 7-.4v11c-2-1-5-1-7 .4" {...s(p)} />
      <Path d="M12 7v11" {...s(p)} />
    </>
  ),
  database: (p) => (
    <>
      <Path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z" {...s(p)} />
      <Path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" {...s(p)} />
      <Path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" {...s(p)} />
    </>
  ),
  shield: (p) => (
    <Path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" {...s(p)} />
  ),
  ban: (p) => (
    <>
      <Circle cx={12} cy={12} r={9} {...s(p)} />
      <Line x1={5.6} y1={5.6} x2={18.4} y2={18.4} {...s(p)} />
    </>
  ),
  link: (p) => (
    <Path d="M9 15 15 9M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1" {...s(p)} />
  ),
  mute: (p) => (
    <>
      <Path d="M11 5 6 9H3v6h3l5 4Z" {...s(p)} />
      <Path d="m16 9 5 5M21 9l-5 5" {...s(p)} />
    </>
  ),
  flag: (p) => (
    <Path d="M4 21V4h12l-1.5 4L16 12H4" {...s(p)} />
  ),
  history: (p) => (
    <>
      <Path d="M3 12a9 9 0 1 0 3-6.7" {...s(p)} />
      <Polyline points="3 4 3 8 7 8" {...s(p)} />
      <Path d="M12 8v4l3 2" {...s(p)} />
    </>
  ),
  moon: (p) => (
    <Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" {...s(p)} />
  ),
  info: (p) => (
    <>
      <Circle cx={12} cy={12} r={9} {...s(p)} />
      <Line x1={12} y1={11} x2={12} y2={16} {...s(p)} />
      <Circle cx={12} cy={8} r={0.6} fill={p.stroke} stroke="none" />
    </>
  ),
  mail: (p) => (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2.5} {...s(p)} />
      <Path d="m4 7 8 6 8-6" {...s(p)} />
    </>
  ),
  apple: (p) => (
    <Path
      d="M17.05 12.04c-.03-2.6 2.12-3.84 2.22-3.9-1.21-1.78-3.09-2.02-3.76-2.05-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.02-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.56 0 2.01.84 3.38.81 1.39-.02 2.28-1.27 3.13-2.52.98-1.45 1.39-2.85 1.41-2.92-.03-.01-2.71-1.04-2.74-4.12M14.62 4.45c.72-.86 1.2-2.07 1.07-3.27-1.03.04-2.28.69-3.01 1.55-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.31-.58 3.02-1.43"
      fill={p.stroke}
      stroke="none"
    />
  ),
  doc: (p) => (
    <>
      <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" {...s(p)} />
      <Path d="M14 3v5h5M9 13h6M9 17h6" {...s(p)} />
    </>
  ),
  chart: (p) => (
    <Path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7" {...s(p)} />
  ),
};

export type IconName = keyof typeof ICONS;
