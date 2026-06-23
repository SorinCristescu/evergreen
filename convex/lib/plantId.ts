/** Pure, Convex-free helpers for the Plant.id (Kindwise) v3 identification flow. Unit-tested. */

export type CareProfile = {
  light: 'direct' | 'indirect' | 'shade';
  waterDays: number;
  difficulty: 'easy' | 'medium' | 'hard';
  humidityRange?: { min: number; max: number };
};

export type Taxonomy = {
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
};

export type SpeciesDescription = {
  value: string;
  citation?: string;
  licenseName?: string;
  licenseUrl?: string;
};

export type RawCandidate = {
  scientificName: string;
  commonName?: string;
  confidence: number; // 0..1
  careProfile: CareProfile;
  family?: string;
  taxonomy?: Taxonomy;
  description?: SpeciesDescription;
  lightText?: string;
  soilText?: string;
  toxicity?: string;
};

/** FNV-1a 32-bit hash → hex. Stable image fingerprint for the identifications cache. */
export function fnv1aHex(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Plant.id `watering` is a 1(dry)–3(wet) scale; map to a watering interval in days. */
function wateringToDays(watering: unknown): number {
  const max = (watering as { max?: number } | undefined)?.max;
  if (max === 3) return 3;
  if (max === 1) return 14;
  return 7; // 2 or unknown
}

/** Plant.id `best_light_condition` is free text; bucket into our enum. */
function lightFromText(text: unknown): CareProfile['light'] {
  const t = typeof text === 'string' ? text.toLowerCase() : '';
  if (t.includes('shade') || t.includes('low light')) return 'shade';
  // Check 'indirect' before 'direct' because "indirect" contains the substring "direct"
  if (t.includes('indirect')) return 'indirect';
  if (t.includes('direct') || t.includes('full sun')) return 'direct';
  return 'indirect';
}

type SuggestionDetails = {
  common_names?: string[];
  watering?: { min?: number; max?: number };
  best_light_condition?: string;
  best_soil_type?: string;
  toxicity?: string;
  taxonomy?: { kingdom?: string; phylum?: string; class?: string; order?: string; family?: string; genus?: string };
  description?: { value?: string; citation?: string; license_name?: string; license_url?: string };
};

type Suggestion = {
  name?: string;
  probability?: number;
  details?: SuggestionDetails;
};

function strOrUndef(x: unknown): string | undefined {
  return typeof x === 'string' && x.trim().length ? x.trim() : undefined;
}

function parseTaxonomy(tax: SuggestionDetails['taxonomy']): Taxonomy | undefined {
  if (!tax || typeof tax !== 'object') return undefined;
  const t: Taxonomy = {
    kingdom: strOrUndef(tax.kingdom),
    phylum: strOrUndef(tax.phylum),
    class: strOrUndef(tax.class),
    order: strOrUndef(tax.order),
    family: strOrUndef(tax.family),
    genus: strOrUndef(tax.genus),
  };
  return Object.values(t).some(Boolean) ? t : undefined;
}

function parseDescription(d: SuggestionDetails['description']): SpeciesDescription | undefined {
  const value = strOrUndef(d?.value);
  if (!value) return undefined;
  return { value, citation: strOrUndef(d?.citation), licenseName: strOrUndef(d?.license_name), licenseUrl: strOrUndef(d?.license_url) };
}

/** Derive a pet-safety label from Plant.id free-text toxicity. undefined when unclear (don't guess). */
export function petSafetyFromToxicity(text: unknown): 'Yes' | 'Caution' | undefined {
  const t = typeof text === 'string' ? text.toLowerCase() : '';
  if (!t) return undefined;
  // Negative first — "non-toxic" contains the substring "toxic".
  if (t.includes('non-toxic') || t.includes('nontoxic') || t.includes('non toxic') || t.includes('not toxic')) return 'Yes';
  if (t.includes('toxic') || t.includes('poison')) return 'Caution';
  return undefined;
}

/** Parse a Plant.id v3 identification response into is_plant + ranked, care-mapped candidates. */
export function parsePlantIdResult(json: unknown): { isPlant: boolean; candidates: RawCandidate[] } {
  const result = (json as { result?: { is_plant?: { binary?: boolean }; classification?: { suggestions?: Suggestion[] } } })?.result;
  const isPlant = result?.is_plant?.binary !== false;
  const suggestions = result?.classification?.suggestions ?? [];
  const candidates: RawCandidate[] = suggestions
    .filter((s): s is Suggestion & { name: string } => typeof s.name === 'string' && s.name.length > 0)
    .map((s) => {
      const taxonomy = parseTaxonomy(s.details?.taxonomy);
      return {
        scientificName: s.name,
        commonName: s.details?.common_names?.[0],
        confidence: typeof s.probability === 'number' ? s.probability : 0,
        careProfile: {
          light: lightFromText(s.details?.best_light_condition),
          waterDays: wateringToDays(s.details?.watering),
          difficulty: 'medium',
          humidityRange: { min: 40, max: 60 },
        },
        family: taxonomy?.family,
        taxonomy,
        description: parseDescription(s.details?.description),
        lightText: strOrUndef(s.details?.best_light_condition),
        soilText: strOrUndef(s.details?.best_soil_type),
        toxicity: strOrUndef(s.details?.toxicity),
      };
    });
  return { isPlant: isPlant && candidates.length > 0, candidates };
}
