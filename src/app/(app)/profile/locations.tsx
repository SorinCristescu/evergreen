import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { NavRow } from '@/components/ui/nav-row';
import { Pill } from '@/components/ui/pill';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet } from '@/components/ui/sheet';
import { Palette, Spacing } from '@/constants/tokens';
import { useDeleteLocation, useEntitlement, useLocations, type LocationRef } from '@/data';
import { useTheme } from '@/theme';

export default function LocationsScreen() {
  const t = useTheme();
  const router = useRouter();
  const locations = useLocations() ?? [];
  const entitlement = useEntitlement();
  const canAdd = entitlement === 'plus';
  const deleteLocation = useDeleteLocation();
  const [confirm, setConfirm] = useState<LocationRef | null>(null);
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    try {
      await deleteLocation(confirm.id);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Locations" />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md, paddingBottom: 120 }}>
        {locations.map((loc) => (
          <NeuSurface key={loc.id} elevation="raised-sm" radius="md" style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">{loc.name}</AppText>
              <AppText variant="small" tone="subtle">{loc.climateLabel} · {loc.plantCount} plants</AppText>
            </View>
            {loc.locked ? <Pill label="Locked" tone="warning" leadingIcon="lock" /> : <Pill label="Active" tone="success" />}
            <IconButton icon="trash" tone="danger" accessibilityLabel={`Delete ${loc.name}`} onPress={() => setConfirm(loc)} />
          </NeuSurface>
        ))}
        <NavRow
          label={canAdd ? 'Add a location' : 'Add a location (Evergreen+)'}
          leadingIcon="plus"
          accent
          onPress={canAdd ? () => router.push('/(auth)/onboarding?add=1') : undefined}
        />
        {!canAdd ? (
          <AppText variant="small" tone="subtle">Free includes one location. Evergreen+ unlocks home, holiday house, and more — each with its own climate.</AppText>
        ) : null}
      </ScrollView>

      <Sheet visible={!!confirm} onClose={() => (busy ? undefined : setConfirm(null))}>
        <AppText variant="display2" style={{ fontSize: 18, marginBottom: 8 }}>Delete {confirm?.name}?</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 13.5, lineHeight: 20, marginBottom: 16 }}>
          Its spaces, {confirm?.plantCount ?? 0} plant{confirm?.plantCount === 1 ? '' : 's'} and all their care data are removed. This can’t be undone.
        </AppText>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <NeuPressable onPress={() => setConfirm(null)} elevation="raised" radius={14} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 50 }} accessibilityLabel="Cancel">
            <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 14.5 }}>Cancel</AppText>
          </NeuPressable>
          <NeuPressable onPress={onDelete} elevation="raised" radius={14} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50 }} accessibilityLabel="Confirm delete">
            {busy ? <ActivityIndicator color={Palette.danger} /> : <Icon name="trash" size={17} color={Palette.danger} />}
            <AppText variant="bodyBold" color={Palette.danger} style={{ fontSize: 14.5 }}>Delete</AppText>
          </NeuPressable>
        </View>
      </Sheet>
    </View>
  );
}
