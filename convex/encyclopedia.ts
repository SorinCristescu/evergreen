import { action } from './_generated/server';
import { v } from 'convex/values';
import { parseINatTaxon, parseGbifMatch, parseGbifRanges, type EncyclopediaEntry } from './lib/encyclopedia';

/** Look up reference data for a species from iNaturalist (photo/summary) + GBIF (taxonomy/native range).
 *  Free, keyless. Each source is best-effort: a failure or empty result simply omits those fields. */
export const lookupSpecies = action({
  args: { scientificName: v.string() },
  handler: async (_ctx, { scientificName }): Promise<EncyclopediaEntry> => {
    const entry: EncyclopediaEntry = {};
    const name = encodeURIComponent(scientificName);

    // iNaturalist: representative photo + common name + wiki summary/link.
    try {
      const r = await fetch(`https://api.inaturalist.org/v1/taxa?q=${name}&rank=species&per_page=1`);
      if (r.ok) Object.assign(entry, parseINatTaxon(await r.json()));
    } catch {
      /* best-effort */
    }

    // GBIF: family/genus/lineage (reliable) + native/introduced range (best-effort).
    try {
      const m = await fetch(`https://api.gbif.org/v1/species/match?name=${name}`);
      if (m.ok) {
        const matchJson = await m.json();
        Object.assign(entry, parseGbifMatch(matchJson));
        const usageKey = (matchJson as { usageKey?: number }).usageKey;
        if (typeof usageKey === 'number') {
          try {
            const d = await fetch(`https://api.gbif.org/v1/species/${usageKey}/distributions?limit=100`);
            if (d.ok) {
              const ranges = parseGbifRanges(await d.json());
              if (ranges.native) entry.nativeRange = ranges.native;
              if (ranges.introduced) entry.introducedRange = ranges.introduced;
            }
          } catch {
            /* best-effort */
          }
        }
      }
    } catch {
      /* best-effort */
    }

    return entry;
  },
});
