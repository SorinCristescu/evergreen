/** Pure, Convex-free parsers for the encyclopedia-confirm lookups (iNaturalist + GBIF). Unit-tested. */

export type EncyclopediaEntry = {
  imageUrl?: string;
  commonName?: string;
  summary?: string;
  nativeRange?: string;
  family?: string;
  genus?: string;
  sourceUrl?: string;
  photoAttribution?: string;
};

/** iNaturalist wiki summaries can contain anchor tags; strip to plain text. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

type INatPhoto = { medium_url?: string; attribution?: string };
type INatTaxon = { preferred_common_name?: string; wikipedia_summary?: string | null; wikipedia_url?: string; default_photo?: INatPhoto };

export function parseINatTaxon(json: unknown): Partial<EncyclopediaEntry> {
  const r = (json as { results?: INatTaxon[] } | null)?.results?.[0];
  if (!r) return {};
  const out: Partial<EncyclopediaEntry> = {};
  if (typeof r.preferred_common_name === 'string') out.commonName = r.preferred_common_name;
  if (typeof r.wikipedia_summary === 'string' && r.wikipedia_summary.trim()) out.summary = stripHtml(r.wikipedia_summary);
  if (typeof r.wikipedia_url === 'string') out.sourceUrl = r.wikipedia_url;
  const photo = r.default_photo;
  if (photo && typeof photo.medium_url === 'string') out.imageUrl = photo.medium_url;
  if (photo && typeof photo.attribution === 'string') out.photoAttribution = photo.attribution;
  return out;
}

type GbifDist = { country?: string | null; locality?: string | null; establishmentMeans?: string | null };

export function parseGbifDistributions(json: unknown): string | undefined {
  const results = (json as { results?: GbifDist[] } | null)?.results ?? [];
  const places: string[] = [];
  for (const r of results) {
    if (r?.establishmentMeans !== 'NATIVE') continue;
    const place = (typeof r.locality === 'string' && r.locality) || (typeof r.country === 'string' && r.country) || undefined;
    if (place && !places.includes(place)) places.push(place);
  }
  return places.length ? places.slice(0, 4).join(', ') : undefined;
}
