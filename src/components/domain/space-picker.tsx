/** Location + space chip picker. Self-contained: manages location internally, reports the chosen space via onChange.
 *  Defaults to the active location's first space (or initialSpaceId when it belongs to the active location). */
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/app-text';
import { useActiveLocation, useLocations, useSpaces, type ID } from '@/data';

export function SpacePicker({ initialSpaceId, onChange }: { initialSpaceId?: ID; onChange: (spaceId: ID | undefined) => void }) {
  const locations = useLocations();
  const activeLocation = useActiveLocation();
  const [locationId, setLocationId] = useState<ID | undefined>(undefined);
  const effectiveLocationId = locationId ?? activeLocation?.id ?? locations?.[0]?.id;
  const spaces = useSpaces(effectiveLocationId);
  const [spaceId, setSpaceId] = useState<ID | undefined>(initialSpaceId);

  // Once spaces load, ensure a valid selection (first space) and report it up.
  useEffect(() => {
    if (spaces && !spaces.some((s) => s.id === spaceId)) {
      const next = spaces[0]?.id;
      setSpaceId(next);
      onChange(next);
    }
  }, [spaces, spaceId, onChange]);

  const selectLocation = (id: ID) => { setLocationId(id); setSpaceId(undefined); };
  const selectSpace = (id: ID) => { setSpaceId(id); onChange(id); };

  return (
    <View style={{ gap: 10 }}>
      {locations && locations.length > 1 ? (
        <View style={{ gap: 6 }}>
          <AppText variant="meta" tone="subtle" uppercase>Location</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {locations.map((l) => (
              <Chip key={l.id} label={l.name} selected={effectiveLocationId === l.id} onPress={() => selectLocation(l.id)} />
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ gap: 6 }}>
        <AppText variant="meta" tone="subtle" uppercase>Place / space</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(spaces ?? []).map((s) => (
            <Chip key={s.id} label={s.name} selected={spaceId === s.id} onPress={() => selectSpace(s.id)} />
          ))}
        </View>
      </View>
    </View>
  );
}
