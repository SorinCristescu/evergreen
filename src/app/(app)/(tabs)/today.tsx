import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { LocationSwitcher } from '@/components/domain/location-switcher';
import { TaskGroupSection } from '@/components/domain/task-group-section';
import { WeatherAdvisoryBanner } from '@/components/domain/weather-advisory-banner';
import { NeuSurface } from '@/components/neu-surface';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { DataGate } from '@/components/ui/data-gate';
import { Icon } from '@/components/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Palette, Spacing } from '@/constants/tokens';
import { useCareTaskActions, useEntitlement, useForecast, useProfile, useSelectedLocation, useTodayTasks, type Urgency } from '@/data';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel(): string {
  const d = new Date();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${month} ${d.getDate()}`; // e.g. "Tuesday, June 9"
}

const WORDS = ['zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const overdueWord = (n: number) => (n <= 9 ? WORDS[n] : String(n));

export default function TodayScreen() {
  const router = useRouter();
  // Selected location is shared with the Garden screen (pick one, both stay in sync).
  const { selected: activeLocation, selectedId, setSelectedId, locations } = useSelectedLocation();
  const entitlement = useEntitlement();
  const tasksData = useTodayTasks(selectedId);
  const tasks = tasksData ?? [];
  const loading = tasksData === undefined;
  const profile = useProfile();
  const firstName = profile?.name?.trim().split(/\s+/)[0];
  const { completed, complete } = useCareTaskActions();
  // Live weather for the selected location — shares the Weather screen's cached forecast.
  const forecast = useForecast(activeLocation);
  const todayWx = forecast?.days[0];
  const rainy = !!todayWx && (todayWx.kind === 'rain' || (todayWx.precipProb ?? 0) >= 50);

  const total = tasks.length;
  const doneCount = tasks.filter((t) => completed.has(t.id)).length;
  const remaining = total - doneCount;
  const overdueCount = tasks.filter((t) => t.urgency === 'overdue').length;
  const progress = total ? doneCount / total : 1;
  const allDone = total > 0 && doneCount === total;

  const groups: Urgency[] = ['overdue', 'today', 'upcoming'];
  // preload each task's plant thumbnail before revealing the list
  const coverUrls = tasks.map((task) => task.plant.coverUrl).filter((u): u is string => !!u);

  return (
    <View style={{ flex: 1 }}>
      <DataGate loading={loading} imageUrls={coverUrls}>
      <AppHeader
        leading={
          <View>
            <AppText variant="display2" style={{ fontSize: 16.8, lineHeight: 21 }}>{firstName ? `${greeting()}, ${firstName}` : greeting()}</AppText>
            <AppText variant="meta" tone="subtle" style={{ marginTop: 3 }}>
              {todayLabel()}
            </AppText>
          </View>
        }
        subtitle={
          activeLocation ? (
            <LocationSwitcher
              compact
              locations={locations}
              activeLocationId={activeLocation.id}
              onSelect={setSelectedId}
              onAddLocation={() => {
                if (entitlement === 'plus') router.push('/(auth)/onboarding?add=1');
              }}
              canAddLocation={entitlement === 'plus'}
            />
          ) : null
        }
        trailing={<IconButton icon="bell" accessibilityLabel="Notifications" badgeCount={2} onPress={() => router.push('/(app)/notifications')} />}
      />

      {/* Sticky header: the hero today card + weather advisory stay fixed while the list scrolls */}
      <View style={{ paddingHorizontal: Spacing.xl, paddingTop: 5, paddingBottom: Spacing.lg, gap: Spacing.lg }}>
        {/* Weather advisory (outdoor) */}
        <WeatherAdvisoryBanner
          kind={forecast?.current.kind}
          temp={forecast ? `${forecast.current.temp}°` : '—'}
          condition={forecast ? `${forecast.current.condition}${activeLocation ? ` in ${activeLocation.climateLabel}` : ''}` : activeLocation ? activeLocation.climateLabel : 'Loading weather…'}
          advisoryStrong={rainy ? 'Rain likely today' : 'Clear enough today'}
          advisory={rainy ? '— outdoor watering can wait.' : '— a good day to water outdoors.'}
        />

        {/* Hero today card */}
        <NeuSurface elevation="raised" radius={20} stretch style={{ flexDirection: 'row', alignItems: 'center', gap: 15, padding: Spacing.lg }}>
          <NeuSurface elevation="pressed" radius={999} style={{ padding: 8, alignItems: 'center', justifyContent: 'center' }}>
            <ProgressRing progress={progress} size={76} label={`${doneCount}/${total}`} caption="Today" />
          </NeuSurface>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <AppText variant="meta" tone="subtle" style={{ fontSize: 10.5 }}>
              {allDone ? "You're all caught up" : `${remaining} task${remaining === 1 ? '' : 's'} to tend`}
            </AppText>
            {!allDone && overdueCount > 0 ? (
              <AppText variant="meta" tone="subtle" style={{ marginTop: 2, fontSize: 10.5 }}>
                {overdueWord(overdueCount)} {overdueCount === 1 ? 'is' : 'are'} overdue — a quick pass and you&apos;re set.
              </AppText>
            ) : null}
          </View>
        </NeuSurface>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: 140, gap: Spacing.lg }} showsVerticalScrollIndicator={false}>
        {allDone ? (
          <NeuSurface elevation="pressed" radius={18} stretch style={{ padding: Spacing.xxl, alignItems: 'center', gap: Spacing.sm }}>
            <Icon name="check" size={32} color={Palette.ever400} />
            <AppText variant="subtitle">All caught up for today</AppText>
            <AppText variant="small" tone="subtle" align="center">Your streak is safe. We&apos;ll nudge you tomorrow.</AppText>
          </NeuSurface>
        ) : (
          <View style={{ gap: Spacing.lg }}>
            {groups.map((urgency) => (
              <TaskGroupSection
                key={urgency}
                urgency={urgency}
                tasks={tasks.filter((t) => t.urgency === urgency)}
                completed={completed}
                onComplete={complete}
              />
            ))}
          </View>
        )}
      </ScrollView>
      </DataGate>
    </View>
  );
}
