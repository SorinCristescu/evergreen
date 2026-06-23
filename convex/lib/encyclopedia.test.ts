import { describe, expect, it } from 'vitest';
import { parseINatTaxon, parseGbifDistributions, parseGbifMatch, parseGbifRanges } from './encyclopedia';

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

describe('parseINatTaxon — enriched', () => {
  const json = {
    results: [{
      preferred_common_name: 'Swiss cheese plant',
      wikipedia_summary: 'A <a href="#">species</a> of flowering plant.',
      wikipedia_url: 'https://en.wikipedia.org/wiki/Monstera_deliciosa',
      rank: 'species',
      observations_count: 12345,
      conservation_status: { status_name: 'Least Concern' },
      default_photo: { medium_url: 'https://x/med.jpg', attribution: '(c) someone' },
      taxon_photos: [{ photo: { medium_url: 'https://x/1.jpg', attribution: 'a' } }, { photo: { medium_url: 'https://x/2.jpg' } }],
    }],
  };
  it('extracts gallery, observations, conservation, wikipedia url, rank', () => {
    const e = parseINatTaxon(json);
    expect(e.commonName).toBe('Swiss cheese plant');
    expect(e.summary).toBe('A species of flowering plant.');
    expect(e.wikipediaUrl).toBe('https://en.wikipedia.org/wiki/Monstera_deliciosa');
    expect(e.rank).toBe('species');
    expect(e.observationsCount).toBe(12345);
    expect(e.conservationStatus).toBe('Least Concern');
    expect(e.photos?.length).toBe(2);
    expect(e.photos?.[0]).toEqual({ url: 'https://x/1.jpg', attribution: 'a' });
  });
  it('empty results → empty object', () => {
    expect(parseINatTaxon({ results: [] })).toEqual({});
  });
});

describe('parseGbifMatch', () => {
  it('builds family/genus + ordered lineage', () => {
    const m = parseGbifMatch({ usageKey: 1, kingdom: 'Plantae', phylum: 'Tracheophyta', class: 'Liliopsida', order: 'Alismatales', family: 'Araceae', genus: 'Monstera' });
    expect(m.family).toBe('Araceae');
    expect(m.genus).toBe('Monstera');
    expect(m.lineage?.map((l) => l.name)).toEqual(['Plantae', 'Tracheophyta', 'Liliopsida', 'Alismatales', 'Araceae', 'Monstera']);
    expect(m.lineage?.[0]).toEqual({ rank: 'Kingdom', name: 'Plantae' });
  });
  it('handles missing ranks', () => {
    const m = parseGbifMatch({ family: 'Araceae' });
    expect(m.lineage?.map((l) => l.name)).toEqual(['Araceae']);
    expect(m.genus).toBeUndefined();
  });
});

describe('parseGbifRanges', () => {
  const json = { results: [
    { country: 'Mexico', establishmentMeans: 'NATIVE' },
    { country: 'Mexico', establishmentMeans: 'NATIVE' },
    { country: 'Florida', establishmentMeans: 'INTRODUCED' },
  ]};
  it('splits native and introduced, deduped', () => {
    const r = parseGbifRanges(json);
    expect(r.native).toBe('Mexico');
    expect(r.introduced).toBe('Florida');
  });
});
