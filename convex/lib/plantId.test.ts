import { describe, expect, it } from 'vitest';
import { fnv1aHex, parsePlantIdResult } from './plantId';

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
