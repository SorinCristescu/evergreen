/** Pure, Convex-free helpers for the Plant.id (Kindwise) v3 identification flow. Unit-tested. */

export type CareProfile = {
  light: 'direct' | 'indirect' | 'shade';
  waterDays: number;
  difficulty: 'easy' | 'medium' | 'hard';
  humidityRange?: { min: number; max: number };
};

export type RawCandidate = {
  scientificName: string;
  commonName?: string;
  confidence: number; // 0..1
  careProfile: CareProfile;
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

type Suggestion = {
  name?: string;
  probability?: number;
  details?: { common_names?: string[]; watering?: { min?: number; max?: number }; best_light_condition?: string };
};

/** Parse a Plant.id v3 identification response into is_plant + ranked, care-mapped candidates. */
export function parsePlantIdResult(json: unknown): { isPlant: boolean; candidates: RawCandidate[] } {
  const result = (json as { result?: { is_plant?: { binary?: boolean }; classification?: { suggestions?: Suggestion[] } } })?.result;
  const isPlant = result?.is_plant?.binary !== false;
  const suggestions = result?.classification?.suggestions ?? [];
  const candidates: RawCandidate[] = suggestions
    .filter((s): s is Suggestion & { name: string } => typeof s.name === 'string' && s.name.length > 0)
    .map((s) => ({
      scientificName: s.name,
      commonName: s.details?.common_names?.[0],
      confidence: typeof s.probability === 'number' ? s.probability : 0,
      careProfile: {
        light: lightFromText(s.details?.best_light_condition),
        waterDays: wateringToDays(s.details?.watering),
        difficulty: 'medium',
        humidityRange: { min: 40, max: 60 },
      },
    }));
  return { isPlant: isPlant && candidates.length > 0, candidates };
}
