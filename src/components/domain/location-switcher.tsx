/** LocationSwitcher — "Home ▾" header switcher + gated "Add location" (components.md Tier 2). */
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/tokens';
import type { ID, LocationRef } from '@/data';

export type LocationSwitcherProps = {
  locations: LocationRef[];
  activeLocationId: ID;
  onSelect: (id: ID) => void;
  onAddLocation: () => void; // → location-setup, or paywall when gated
  canAddLocation: boolean;
  compact?: boolean; // small pin + name pill (e.g. as a subtitle) instead of the big display title
};

export function LocationSwitcher({ locations, activeLocationId, onSelect, onAddLocation, canAddLocation, compact = false }: LocationSwitcherProps) {
  const [open, setOpen] = useState(false);
  const active = locations.find((l) => l.id === activeLocationId) ?? locations[0];
  const single = locations.length <= 1;

  return (
    <>
      <Pressable
        onPress={() => !single && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Location: ${active?.name}. ${single ? '' : 'Tap to switch'}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 5 : 7 }}
      >
        {compact ? <Icon name="pin" size={14} tone="accent" /> : null}
        <AppText variant={compact ? 'bodyBold' : 'display2'} tone={compact ? 'brand' : 'default'} style={compact ? { fontSize: 13 } : { letterSpacing: -0.4, fontSize: 16.8, lineHeight: 21 }}>
          {active?.name ?? 'Garden'}
        </AppText>
        {!single ? <Icon name="chevronDown" size={compact ? 14 : 18} tone="accent" /> : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(12,31,23,0.25)' }} onPress={() => setOpen(false)}>
          <View style={{ marginTop: 110, marginHorizontal: Spacing.xl }}>
            <NeuSurface radius="lg" style={{ padding: Spacing.sm, gap: 2 }}>
              {locations.map((loc) => {
                const isActive = loc.id === activeLocationId;
                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => {
                      setOpen(false);
                      if (!loc.locked) onSelect(loc.id);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: 12, opacity: loc.locked ? 0.5 : 1 }}
                  >
                    <Icon name={loc.locked ? 'lock' : 'pin'} size={18} tone={isActive ? 'accent' : 'muted'} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" tone={isActive ? 'brand' : 'default'}>
                        {loc.name}
                      </AppText>
                      <AppText variant="metaSm" tone="subtle" uppercase>
                        {loc.climateLabel} · {loc.plantCount} plants
                      </AppText>
                    </View>
                    {isActive ? <Icon name="check" size={18} tone="accent" /> : null}
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  setOpen(false);
                  onAddLocation();
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: 12 }}
              >
                <Icon name="plus" size={18} tone="muted" />
                <AppText variant="body" style={{ flex: 1 }}>
                  Add location
                </AppText>
                {!canAddLocation ? <Icon name="lock" size={14} color={Palette.terra} /> : null}
              </Pressable>
            </NeuSurface>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
