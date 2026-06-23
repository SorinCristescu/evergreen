/** CareTaskRow — one due task (Today + Plant detail). Matches `.trow` in evergreen-today.html. */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Radio } from '@/components/ui/radio';
import { coverForSeed, Palette } from '@/constants/tokens';
import type { CareTaskItem, CareTaskType } from '@/data';
import { useTheme } from '@/theme';

const VERB: Record<CareTaskType, string> = {
  water: 'Water',
  fertilize: 'Fertilize',
  mist: 'Mist',
  prune: 'Prune',
  repot: 'Repot',
  clean: 'Clean',
  rotate: 'Rotate',
};
const TASK_ICON: Record<CareTaskType, IconName> = {
  water: 'droplet',
  fertilize: 'fertilize',
  mist: 'mist',
  prune: 'scissors',
  repot: 'leaf',
  clean: 'leaf',
  rotate: 'rotate',
};

export type CareTaskRowProps = {
  task: CareTaskItem;
  done?: boolean;
  /** tapping anywhere on the row toggles completion (no navigation) */
  onComplete: () => void;
};

export function CareTaskRow({ task, done = false, onComplete }: CareTaskRowProps) {
  const t = useTheme();
  const [from, to] = coverForSeed(task.plant.id);
  const name = task.plant.nickname ?? task.plant.species?.commonName ?? 'Plant';
  const overdue = task.urgency === 'overdue';
  const iconColor = done ? t.fgSubtle : overdue ? Palette.danger : Palette.ever500;

  return (
    <Pressable
      onPress={onComplete}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${VERB[task.type]} ${name}, ${done ? 'done' : 'not done'}`}
      style={{ alignSelf: 'stretch' }}
    >
      <NeuSurface elevation={done ? 'pressed' : 'raised'} radius={15} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
        <NeuSurface elevation="raised-sm" radius={11} style={{ width: 42, height: 42, overflow: 'hidden' }}>
          {task.plant.coverUrl ? (
            <Image source={{ uri: task.plant.coverUrl }} style={{ flex: 1 }} contentFit="cover" transition={150} />
          ) : (
            <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="image" size={18} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          )}
        </NeuSurface>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={TASK_ICON[task.type]} size={14} color={iconColor} />
            <AppText
              variant="bodyBold"
              numberOfLines={1}
              style={[{ flexShrink: 1 }, done ? { textDecorationLine: 'line-through' } : null]}
              color={done ? t.fgSubtle : t.fg}
            >
              {VERB[task.type]} {name}
            </AppText>
          </View>
          <AppText variant="meta" tone="subtle" numberOfLines={1} style={{ fontSize: 10.5, marginTop: 2 }}>
            {task.dueLabel}
          </AppText>
        </View>
        <Radio selected={done} size={30} />
      </NeuSurface>
    </Pressable>
  );
}
