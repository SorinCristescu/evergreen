/** Radio / Checkbox — the app-wide selection control.
 * A recessed (pressed) neumorphic circular well; when selected it shows an
 * evergreen-400 check that gently breathes (fade + zoom). Used by every
 * selectable card, list row and reason picker so selection feels identical everywhere. */
import { NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Palette } from '@/constants/tokens';

export function Radio({ selected, size = 28 }: { selected: boolean; size?: number }) {
  return (
    <NeuSurface elevation="pressed" radius={999} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {selected ? (
        <AnimatedIcon name="check" size={Math.round(size * 0.58)} strokeWidth={4} color={Palette.ever400} motion="appear" />
      ) : null}
    </NeuSurface>
  );
}
