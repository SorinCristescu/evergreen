import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { LocationSwitcher } from '@/components/domain/location-switcher';
import { PlantCard } from '@/components/domain/plant-card';
import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { AnimatedSun } from '@/components/ui/animated-sun';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { DataGate } from '@/components/ui/data-gate';
import { IconButton } from '@/components/ui/icon-button';
import { Palette, Spacing } from '@/constants/tokens';
import { useEntitlement, useLocations, usePlantsBySpace, useSelectedLocation, type Place } from '@/data';
import { useTheme } from '@/theme';

const PLACE_FILTERS: { key: Place | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'indoor', label: 'Indoor' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'greenhouse', label: 'Greenhouse' },
];

export default function GardenScreen() {
  const t = useTheme();
  const router = useRouter();
  const locationsData = useLocations();
  const locations = locationsData ?? [];
  const entitlement = useEntitlement();
  const { selectedId, setSelectedId } = useSelectedLocation();
  const firstActive = locations.find((l) => !l.locked) ?? locations[0];
  const active = locations.find((l) => l.id === selectedId) ?? firstActive;
  const groupsData = usePlantsBySpace(active?.id);
  const groups = groupsData ?? [];
  const loading = locationsData === undefined || groupsData === undefined;
  const [filter, setFilter] = useState<Place | 'all'>('all');

  const visible = filter === 'all' ? groups : groups.filter((g) => g.space.place === filter);
  // preload every card's cover so the grid only appears once its photos are ready
  const coverUrls = groups.flatMap((g) => g.plants.map((p) => p.coverUrl).filter((u): u is string => !!u));

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <DataGate loading={loading} imageUrls={coverUrls}>
      <AppHeader
        leading={
          active ? (
            <LocationSwitcher
              locations={locations}
              activeLocationId={active.id}
              onSelect={setSelectedId}
              onAddLocation={() => {
                if (entitlement === 'plus') router.push('/(auth)/onboarding?add=1');
              }}
              canAddLocation={entitlement === 'plus'}
            />
          ) : null
        }
        subtitle={
          active ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <AnimatedSun size={20} />
              <AppText variant="meta" tone="muted">
                {active.climateLabel} · {active.tempLabel} · {active.plantCount} plants
              </AppText>
            </View>
          ) : null
        }
        trailing={
          <>
            <IconButton icon="search" accessibilityLabel="Search species" onPress={() => {}} />
            <IconButton icon="bell" accessibilityLabel="Notifications" badgeCount={2} onPress={() => router.push('/(app)/notifications')} />
          </>
        }
      />

      {/* Sticky place filters (do not scroll with the list) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: 8, paddingVertical: Spacing.md }}
      >
        {PLACE_FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {/* Only the card list + Manage Spaces scroll */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 140 }}
      >
        {visible.length === 0 ? (
          <NeuSurface
            elevation="pressed"
            radius={16}
            stretch
            style={{ paddingVertical: 26, paddingHorizontal: 18, alignItems: 'center', marginTop: 16 }}
          >
            <View style={{ opacity: 0.7, marginBottom: 8 }}>
              <Icon name="greenhouse" size={28} tone="accent" />
            </View>
            <AppText variant="bodyBold" color={t.ever700}>
              Nothing here yet
            </AppText>
            <AppText variant="small" tone="muted" align="center" style={{ marginTop: 3 }}>
              No plants in this Place — add one with the camera.
            </AppText>
          </NeuSurface>
        ) : (
          visible.map((group) => (
            <View key={group.space.id} style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 11 }}>
                <AppText variant="subtitle">{group.space.name}</AppText>
                <AppText variant="meta" tone="subtle" uppercase style={{ fontSize: 10.5, letterSpacing: 0.9 }}>
                  {group.space.place}
                </AppText>
                <AppText variant="meta" tone="subtle" style={{ marginLeft: 'auto' }}>
                  {group.plants.length}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {group.plants.map((plant) => (
                  <View key={plant.id} style={{ width: '47.5%' }}>
                    <PlantCard plant={plant} onPress={() => router.push(`/(app)/plant/${plant.id}`)} />
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        <NeuPressable
          onPress={() => {
            /* Phase 4: → Manage Spaces */
          }}
          elevation="raised-sm"
          radius={14}
          stretch
          accessibilityLabel="Manage Spaces"
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, marginTop: 30 }}
        >
          <AnimatedIcon name="grid" size={18} color={Palette.ever400} motion="pulse" />
          <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 13.5 }}>
            Manage Spaces
          </AppText>
        </NeuPressable>
      </ScrollView>
      </DataGate>
    </View>
  );
}

