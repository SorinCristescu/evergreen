import { describe, expect, it } from 'vitest';
import { fnv1aHex, parsePlantIdResult, petSafetyFromToxicity } from './plantId';

describe('fnv1aHex', () => {
  it('is stable and hex for the same bytes', () => {
    const a = fnv1aHex(new Uint8Array([1, 2, 3, 4]));
    const b = fnv1aHex(new Uint8Array([1, 2, 3, 4]));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]+$/);
  });
  it('differs for different bytes', () => {
    expect(fnv1aHex(new Uint8Array([1, 2, 3]))).not.toBe(fnv1aHex(new Uint8Array([1, 2, 4])));
  });
});

describe('parsePlantIdResult', () => {
  const base = {
    result: {
      is_plant: { binary: true, probability: 0.99 },
      classification: {
        suggestions: [
          {
            name: 'Monstera deliciosa',
            probability: 0.96,
            details: {
              common_names: ['Swiss cheese plant'],
              watering: { min: 2, max: 2 },
              best_light_condition: 'Thrives in bright, indirect light.',
            },
          },
          { name: 'Philodendron hederaceum', probability: 0.21, details: { common_names: [] } },
        ],
      },
    },
  };

  it('extracts is_plant and ranked candidates', () => {
    const r = parsePlantIdResult(base);
    expect(r.isPlant).toBe(true);
    expect(r.candidates).toHaveLength(2);
    expect(r.candidates[0].scientificName).toBe('Monstera deliciosa');
    expect(r.candidates[0].commonName).toBe('Swiss cheese plant');
    expect(r.candidates[0].confidence).toBeCloseTo(0.96);
  });

  it('maps watering=2 to ~7 waterDays and indirect light', () => {
    const cp = parsePlantIdResult(base).candidates[0].careProfile;
    expect(cp.waterDays).toBe(7);
    expect(cp.light).toBe('indirect');
    expect(cp.difficulty).toBe('medium');
  });

  it('defaults care profile when details are missing', () => {
    const cp = parsePlantIdResult(base).candidates[1].careProfile;
    expect(cp.waterDays).toBe(7);
    expect(cp.light).toBe('indirect');
  });

  it('flags not-a-plant', () => {
    const r = parsePlantIdResult({ result: { is_plant: { binary: false, probability: 0.02 }, classification: { suggestions: [] } } });
    expect(r.isPlant).toBe(false);
    expect(r.candidates).toEqual([]);
  });

  it('detects direct and shade light from text', () => {
    const mk = (text: string) => ({ result: { is_plant: { binary: true }, classification: { suggestions: [{ name: 'X', probability: 0.5, details: { best_light_condition: text } }] } } });
    expect(parsePlantIdResult(mk('Needs full direct sun all day')).candidates[0].careProfile.light).toBe('direct');
    expect(parsePlantIdResult(mk('Tolerates deep shade and low light')).candidates[0].careProfile.light).toBe('shade');
  });
});

describe('parsePlantIdResult — rich details', () => {
  const rich = {
    result: {
      is_plant: { binary: true },
      classification: {
        suggestions: [
          {
            name: 'Monstera deliciosa',
            probability: 0.96,
            details: {
              common_names: ['Swiss cheese plant'],
              best_light_condition: 'Bright, indirect light.',
              best_soil_type: 'Well-draining, peat-based potting mix.',
              toxicity: 'Toxic to cats and dogs if ingested.',
              taxonomy: { genus: 'Monstera', family: 'Araceae', order: 'Alismatales', class: 'Liliopsida', phylum: 'Tracheophyta', kingdom: 'Plantae' },
              description: { value: 'A species native to southern Mexico.', citation: 'https://en.wikipedia.org/wiki/Monstera_deliciosa', license_name: 'CC BY-SA 3.0', license_url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
            },
          },
        ],
      },
    },
  };

  it('parses family, taxonomy, description, soil/light/toxicity text', () => {
    const c = parsePlantIdResult(rich).candidates[0];
    expect(c.family).toBe('Araceae');
    expect(c.taxonomy?.genus).toBe('Monstera');
    expect(c.taxonomy?.kingdom).toBe('Plantae');
    expect(c.description?.value).toBe('A species native to southern Mexico.');
    expect(c.description?.licenseName).toBe('CC BY-SA 3.0');
    expect(c.description?.licenseUrl).toBe('https://creativecommons.org/licenses/by-sa/3.0/');
    expect(c.lightText).toBe('Bright, indirect light.');
    expect(c.soilText).toBe('Well-draining, peat-based potting mix.');
    expect(c.toxicity).toBe('Toxic to cats and dogs if ingested.');
  });

  it('degrades to undefined when details are missing (no throw)', () => {
    const c = parsePlantIdResult({ result: { is_plant: { binary: true }, classification: { suggestions: [{ name: 'X', probability: 0.5 }] } } }).candidates[0];
    expect(c.family).toBeUndefined();
    expect(c.taxonomy).toBeUndefined();
    expect(c.description).toBeUndefined();
    expect(c.lightText).toBeUndefined();
    expect(c.soilText).toBeUndefined();
    expect(c.toxicity).toBeUndefined();
  });
});

describe('petSafetyFromToxicity', () => {
  it('returns Yes for explicit non-toxic', () => {
    expect(petSafetyFromToxicity('This plant is non-toxic to pets.')).toBe('Yes');
    expect(petSafetyFromToxicity('Not toxic to cats or dogs.')).toBe('Yes');
  });
  it('returns Caution for toxic / poisonous', () => {
    expect(petSafetyFromToxicity('Toxic to cats and dogs.')).toBe('Caution');
    expect(petSafetyFromToxicity('Poisonous if ingested.')).toBe('Caution');
  });
  it('returns undefined when unclear or empty', () => {
    expect(petSafetyFromToxicity('')).toBeUndefined();
    expect(petSafetyFromToxicity(undefined)).toBeUndefined();
    expect(petSafetyFromToxicity('Keep out of direct sun.')).toBeUndefined();
  });
});
