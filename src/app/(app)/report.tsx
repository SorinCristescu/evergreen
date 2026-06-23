import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ReportForm } from '@/components/domain/report-form';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Spacing } from '@/constants/tokens';
import type { ReportTargetType } from '@/data';
import { useTheme } from '@/theme';

function initialsFor(handle: string): string {
  const clean = handle.replace(/^@/, '').replace(/[._]/g, ' ');
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ReportScreen() {
  const t = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; id?: string; handle?: string; snippet?: string }>();
  const handle = params.handle ?? '@potted.pete';
  const target = {
    type: (params.type as ReportTargetType) ?? 'post',
    id: params.id ?? 'unknown',
    handle,
    snippet: params.snippet ?? '“Week 3 of the #BrightWindow challenge…”',
    initials: initialsFor(handle),
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader title="Report" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: Spacing.sm, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ReportForm target={target} onSubmit={() => router.back()} onCancel={() => router.back()} />
      </ScrollView>
    </View>
  );
}
