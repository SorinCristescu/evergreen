/**
 * SelectedLocation — the location chosen in the header switcher, shared across Today and Garden so
 * the two stay in sync (pick a location on one, it's selected on the other). Defaults to the first
 * unlocked location once the list loads, and self-heals if the selected location disappears.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useLocations } from './hooks';
import type { ID, LocationRef } from './types';

type SelectedLocationCtx = { selectedId?: ID; setSelectedId: (id: ID) => void };
const Ctx = createContext<SelectedLocationCtx | null>(null);

export function SelectedLocationProvider({ children }: { children: ReactNode }) {
  const locations = useLocations() ?? [];
  const [selectedId, setSelectedId] = useState<ID | undefined>(undefined);

  useEffect(() => {
    if (locations.length === 0) return;
    const stillExists = selectedId && locations.some((l) => l.id === selectedId);
    if (!stillExists) setSelectedId((locations.find((l) => !l.locked) ?? locations[0]).id);
  }, [locations, selectedId]);

  return <Ctx.Provider value={{ selectedId, setSelectedId }}>{children}</Ctx.Provider>;
}

/** Shared selected location. Resolves the live `LocationRef` and the full list for the switcher. */
export function useSelectedLocation(): {
  selected?: LocationRef;
  selectedId?: ID;
  setSelectedId: (id: ID) => void;
  locations: LocationRef[];
} {
  const ctx = useContext(Ctx);
  const locations = useLocations() ?? [];
  const selected = locations.find((l) => l.id === ctx?.selectedId) ?? locations.find((l) => !l.locked) ?? locations[0];
  return { selected, selectedId: selected?.id, setSelectedId: ctx?.setSelectedId ?? (() => {}), locations };
}
