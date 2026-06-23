import { describe, expect, it } from 'vitest';
import { parseINatTaxon, parseGbifDistributions } from './encyclopedia';

describe('parseINatTaxon', () => {
  const inat = {
    results: [
      {
        name: 'Monstera deliciosa',
        preferred_common_name: 'Swiss Cheese Plant',
        wikipedia_url: 'http://en.wikipedia.org/wiki/Monstera_deliciosa',
        wikipedia_summary: 'A species <a href="x">native</a> to southern Mexico.',
        default_photo: { medium_url: 'https://static.inaturalist.org/photos/1/medium.jpeg', attribution: '(c) Someone' },
      },
    ],
  };
  it('extracts common name, photo, attribution, wiki link', () => {
    const e = parseINatTaxon(inat);
    expect(e.commonName).toBe('Swiss Cheese Plant');
    expect(e.imageUrl).toBe('https://static.inaturalist.org/photos/1/medium.jpeg');
    expect(e.photoAttribution).toBe('(c) Someone');
    expect(e.sourceUrl).toBe('http://en.wikipedia.org/wiki/Monstera_deliciosa');
  });
  it('strips HTML from the summary', () => {
    expect(parseINatTaxon(inat).summary).toBe('A species native to southern Mexico.');
  });
  it('handles null summary and empty results without throwing', () => {
    expect(parseINatTaxon({ results: [{ name: 'X', wikipedia_summary: null }] }).summary).toBeUndefined();
    expect(parseINatTaxon({ results: [] })).toEqual({});
    expect(parseINatTaxon({})).toEqual({});
    expect(parseINatTaxon(null)).toEqual({});
  });
});

describe('parseGbifDistributions', () => {
  it('returns only NATIVE places, deduped and capped, locality preferred', () => {
    const json = {
      results: [
        { country: null, locality: 'Southern Mexico', establishmentMeans: 'NATIVE' },
        { country: 'GT', locality: null, establishmentMeans: 'NATIVE' },
        { country: null, locality: 'Southern Mexico', establishmentMeans: 'NATIVE' }, // dup
        { country: null, locality: 'East Africa', establishmentMeans: 'INTRODUCED' }, // excluded
      ],
    };
    expect(parseGbifDistributions(json)).toBe('Southern Mexico, GT');
  });
  it('returns undefined when no NATIVE records', () => {
    expect(parseGbifDistributions({ results: [{ locality: 'Caribbean', establishmentMeans: 'INTRODUCED' }] })).toBeUndefined();
    expect(parseGbifDistributions({ results: [] })).toBeUndefined();
    expect(parseGbifDistributions(null)).toBeUndefined();
  });
});
