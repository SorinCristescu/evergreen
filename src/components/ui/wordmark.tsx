/** Wordmark — the lowercase "evergreen" logotype: "ever" in foreground + "green" in Evergreen-400. */
import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type WordmarkProps = {
  size?: number;
  /** colour for the "ever" half — defaults to the foreground; pass a light colour on dark surfaces */
  everColor?: string;
  plus?: boolean;
};

export function Wordmark({ size = 30, everColor, plus = false }: WordmarkProps) {
  const t = useTheme();
  const ever = everColor ?? t.fg;
  return (
    <AppText variant="display1" style={{ fontSize: size, lineHeight: size * 1.1 }}>
      <AppText variant="display1" color={ever} style={{ fontSize: size }}>ever</AppText>
      <AppText variant="display1" color={Palette.ever400} style={{ fontSize: size }}>green</AppText>
      {plus ? <AppText variant="display1" color={ever} style={{ fontSize: size }}>+</AppText> : null}
    </AppText>
  );
}
