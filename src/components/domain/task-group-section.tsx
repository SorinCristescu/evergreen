/** TaskGroupSection — an urgency bucket on Today. `.grp` / `.grp-l` in evergreen-today.html. */
import { View } from 'react-native';

import { CareTaskRow } from '@/components/domain/care-task-row';
import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';
import type { CareTaskItem, ID, Urgency } from '@/data';

const LABEL: Record<Urgency, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  upcoming: 'Coming up',
};

export type TaskGroupSectionProps = {
  urgency: Urgency;
  tasks: CareTaskItem[];
  completed: Set<ID>;
  onComplete: (id: ID) => void;
};

export function TaskGroupSection({ urgency, tasks, completed, onComplete }: TaskGroupSectionProps) {
  const t = useTheme();
  const DOT: Record<Urgency, string> = {
    overdue: Palette.danger,
    today: Palette.ever500,
    upcoming: t.fgSubtle,
  };
  if (tasks.length === 0) return null;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: DOT[urgency] }} />
        <AppText
          variant="meta"
          uppercase
          color={urgency === 'overdue' ? Palette.danger : t.fgSubtle}
          style={{ fontSize: 10.5, letterSpacing: 1.4 }}
        >
          {LABEL[urgency]}
        </AppText>
        <AppText variant="meta" tone="subtle" style={{ marginLeft: 'auto' }}>
          {tasks.length}
        </AppText>
      </View>
      <View style={{ gap: 9 }}>
        {tasks.map((task) => (
          <CareTaskRow
            key={task.id}
            task={task}
            done={completed.has(task.id)}
            onComplete={() => onComplete(task.id)}
          />
        ))}
      </View>
    </View>
  );
}
