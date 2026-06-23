/** Pure, Convex-free parsers for the encyclopedia-confirm lookups (iNaturalist + GBIF). Unit-tested. */

export type EncyclopediaPhoto = { url: string; attribution?: string };

export type EncyclopediaEntry = {
  imageUrl?: string;
  photos?: EncyclopediaPhoto[];
  commonName?: string;
  summary?: string;
  nativeRange?: string;
  introducedRange?: string;
  family?: string;
  genus?: string;
  lineage?: { rank: string; name: string }[];
  rank?: string;
  observationsCount?: number;
  conservationStatus?: string;
  wikipediaUrl?: string;
  sourceUrl?: string;
  photoAttribution?: string;
};

/** iNaturalist wiki summaries can contain anchor tags; strip to plain text. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

type INatPhoto = { medium_url?: string; large_url?: string; url?: string; attribution?: string };
type INatTaxon = {
  preferred_common_name?: string;
  wikipedia_summary?: string | null;
  wikipedia_url?: string;
  rank?: string;
  observations_count?: number;
  conservation_status?: { status_name?: string; status?: string } | null;
  default_photo?: INatPhoto;
  taxon_photos?: { photo?: INatPhoto }[];
};

export function parseINatTaxon(json: unknown): Partial<EncyclopediaEntry> {
  const r = (json as { results?: INatTaxon[] } | null)?.results?.[0];
  if (!r) return {};
  const out: Partial<EncyclopediaEntry> = {};
  if (typeof r.preferred_common_name === 'string') out.commonName = r.preferred_common_name;
  if (typeof r.wikipedia_summary === 'string' && r.wikipedia_summary.trim()) out.summary = stripHtml(r.wikipedia_summary);
  if (typeof r.wikipedia_url === 'string') { out.wikipediaUrl = r.wikipedia_url; out.sourceUrl = r.wikipedia_url; }
  if (typeof r.rank === 'string') out.rank = r.rank;
  if (typeof r.observations_count === 'number') out.observationsCount = r.observations_count;
  const cons = r.conservation_status?.status_name || r.conservation_status?.status;
  if (typeof cons === 'string' && cons.trim()) out.conservationStatus = cons;
  const photo = r.default_photo;
  if (photo && typeof photo.medium_url === 'string') out.imageUrl = photo.medium_url;
  if (photo && typeof photo.attribution === 'string') out.photoAttribution = photo.attribution;
  const photos: EncyclopediaPhoto[] = [];
  for (const tp of r.taxon_photos ?? []) {
    const p = tp?.photo;
    const url = p?.medium_url || p?.large_url || p?.url;
    if (typeof url === 'string') photos.push({ url, attribution: typeof p?.attribution === 'string' ? p.attribution : undefined });
    if (photos.length >= 8) break;
  }
  if (photos.length) out.photos = photos;
  return out;
}

type GbifMatch = { usageKey?: number; kingdom?: string; phylum?: string; class?: string; order?: string; family?: string; genus?: string };

export function parseGbifMatch(json: unknown): { family?: string; genus?: string; lineage?: { rank: string; name: string }[] } {
  const m = (json as GbifMatch | null) ?? {};
  const ranks: [string, unknown][] = [
    ['Kingdom', m.kingdom], ['Phylum', m.phylum], ['Class', m.class], ['Order', m.order], ['Family', m.family], ['Genus', m.genus],
  ];
  const lineage = ranks.filter(([, v]) => typeof v === 'string' && v).map(([rank, v]) => ({ rank, name: v as string }));
  return {
    family: typeof m.family === 'string' ? m.family : undefined,
    genus: typeof m.genus === 'string' ? m.genus : undefined,
    lineage: lineage.length ? lineage : undefined,
  };
}

type GbifDist = { country?: string | null; locality?: string | null; establishmentMeans?: string | null };

export function parseGbifRanges(json: unknown): { native?: string; introduced?: string } {
  const results = (json as { results?: GbifDist[] } | null)?.results ?? [];
  const collect = (means: string) => {
    const places: string[] = [];
    for (const r of results) {
      if (r?.establishmentMeans !== means) continue;
      const place = (typeof r.locality === 'string' && r.locality) || (typeof r.country === 'string' && r.country) || undefined;
      if (place && !places.includes(place)) places.push(place);
    }
    return places.length ? places.slice(0, 6).join(', ') : undefined;
  };
  return { native: collect('NATIVE'), introduced: collect('INTRODUCED') };
}

/** Back-compat: native range only (used by the identify-flow compare). */
export function parseGbifDistributions(json: unknown): string | undefined {
  return parseGbifRanges(json).native;
}
