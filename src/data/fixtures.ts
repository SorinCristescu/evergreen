/**
 * Mock fixtures for the UI-first phase. Replaced by Convex queries in phase 3 (hooks swap their
 * bodies; these fixtures and the screens stay put). Keep shapes identical to `./types`.
 */
import type {
  CareTaskItem,
  LocationRef,
  PlantDetail,
  PlantSummary,
  Post,
  SpaceRef,
  UserProfile,
} from './types';

export const LOCATIONS: LocationRef[] = [
  { id: 'loc_home', name: 'Home', climateLabel: 'Lisbon', tempLabel: '19° clear', plantCount: 7 },
  {
    id: 'loc_holiday',
    name: 'Holiday house',
    climateLabel: 'Sintra',
    tempLabel: '18°',
    plantCount: 3,
    locked: true, // free tier: 2nd location is gated
  },
];

export const SPACES: SpaceRef[] = [
  { id: 'sp_living', name: 'Living Room', place: 'indoor' },
  { id: 'sp_balcony', name: 'Balcony', place: 'outdoor' },
  { id: 'sp_office', name: 'Office', place: 'indoor' },
  { id: 'sp_greenhouse', name: 'Greenhouse', place: 'greenhouse' },
];

const sp = (id: string) => SPACES.find((s) => s.id === id)!;

export const PLANTS: PlantSummary[] = [
  {
    id: 'pl_fiddle',
    nickname: 'Fiddle',
    species: { id: 's1', scientificName: 'Ficus lyrata', commonName: 'Fiddle-leaf fig' },
    status: 'ok',
    statusLabel: 'Water in 2d',
    space: sp('sp_living'),
  },
  {
    id: 'pl_mara',
    nickname: 'Mara',
    species: { id: 's2', scientificName: 'Monstera deliciosa', commonName: 'Swiss cheese plant' },
    needsWater: true,
    status: 'warn',
    statusLabel: 'Needs water',
    space: sp('sp_living'),
  },
  {
    id: 'pl_pancake',
    nickname: 'Pancake',
    species: { id: 's3', scientificName: 'Pilea peperomioides', commonName: 'Chinese money plant' },
    status: 'good',
    statusLabel: 'Healthy',
    space: sp('sp_living'),
  },
  {
    id: 'pl_rosemary',
    nickname: 'Rosemary',
    species: { id: 's4', scientificName: 'Salvia rosmarinus', commonName: 'Rosemary' },
    status: 'ok',
    statusLabel: 'Water in 4d',
    space: sp('sp_balcony'),
  },
  {
    id: 'pl_basil',
    nickname: 'Basil',
    species: { id: 's5', scientificName: 'Ocimum basilicum', commonName: 'Basil' },
    needsWater: true,
    status: 'warn',
    statusLabel: 'Needs water',
    space: sp('sp_balcony'),
  },
  {
    id: 'pl_zee',
    nickname: 'Zee',
    species: { id: 's6', scientificName: 'Zamioculcas zamiifolia', commonName: 'ZZ plant' },
    status: 'good',
    statusLabel: 'Healthy',
    space: sp('sp_office'),
  },
  {
    id: 'pl_snake',
    nickname: 'Snake',
    species: { id: 's7', scientificName: 'Dracaena trifasciata', commonName: 'Snake plant' },
    status: 'ok',
    statusLabel: 'Water in 6d',
    space: sp('sp_office'),
  },
];

const plantById = (id: string) => PLANTS.find((p) => p.id === id)!;

export const TODAY_TASKS: CareTaskItem[] = [
  { id: 't1', type: 'water', status: 'due', urgency: 'overdue', dueLabel: 'Living Room · 1 day overdue', plant: plantById('pl_mara') },
  { id: 't2', type: 'water', status: 'due', urgency: 'overdue', dueLabel: 'Balcony · overdue', plant: plantById('pl_basil') },
  { id: 't3', type: 'mist', status: 'due', urgency: 'today', dueLabel: 'Living Room · today', plant: plantById('pl_fiddle') },
  { id: 't4', type: 'fertilize', status: 'due', urgency: 'today', dueLabel: 'Balcony · today', plant: plantById('pl_rosemary') },
  { id: 't5', type: 'rotate', status: 'due', urgency: 'upcoming', dueLabel: 'Living Room · tomorrow', plant: plantById('pl_pancake') },
  { id: 't6', type: 'water', status: 'due', urgency: 'upcoming', dueLabel: 'Office · in 2 days', plant: plantById('pl_snake') },
];

export const PLANT_DETAILS: Record<string, PlantDetail> = {
  pl_mara: {
    ...plantById('pl_mara'),
    photoUrls: [],
    potSizeCm: 18,
    soilType: 'Aroid mix',
    careTasks: [
      { id: 'mt1', type: 'water', status: 'due', urgency: 'overdue', dueLabel: 'Due now', plant: plantById('pl_mara') },
      { id: 'mt2', type: 'fertilize', status: 'due', urgency: 'upcoming', dueLabel: 'In 5 days', plant: plantById('pl_mara') },
      { id: 'mt3', type: 'mist', status: 'due', urgency: 'upcoming', dueLabel: 'In 2 days', plant: plantById('pl_mara') },
      { id: 'mt4', type: 'rotate', status: 'due', urgency: 'upcoming', dueLabel: 'In 1 week', plant: plantById('pl_mara') },
    ],
    careGuide: { light: 'Bright indirect', water: 'Every 7 days', humidity: '50%+' },
    about: {
      lead: 'The Swiss cheese plant (Monstera deliciosa) is a climbing aroid from the rainforests of southern Mexico to Panama. Its iconic split, fenestrated leaves develop as it matures and reaches for light.',
      facts: [
        { label: 'Origin', value: 'Central America' },
        { label: 'Family', value: 'Araceae' },
        { label: 'Mature size', value: '2–3 m indoors' },
        { label: 'Toxicity', value: 'Mild to pets' },
      ],
      notes: [
        'Loves bright, indirect light — fenestrations need it to form.',
        'Give it something to climb; a moss pole encourages bigger leaves.',
        'Mildly toxic if chewed (calcium oxalates) — keep curious pets away.',
      ],
    },
    treatment: {
      id: 'tr1',
      diagnosis: 'Spider mites',
      issueType: 'pest',
      severity: 'medium',
      currentStep: 2,
      totalSteps: 5,
      status: 'active',
      steps: [
        { id: 'st1', text: 'Isolate from other plants', done: true },
        { id: 'st2', text: 'Wipe leaves, both sides', done: true },
        { id: 'st3', text: 'Apply neem oil weekly', done: false },
        { id: 'st4', text: 'Raise humidity around the plant', done: false },
        { id: 'st5', text: 'Re-check in 2 weeks', done: false },
      ],
    },
    journal: [
      { id: 'j1', note: 'Misted twice this week — the new leaf loves the extra humidity near the window.', atLabel: 'Today' },
      { id: 'j2', note: 'Undersides looked dusty, found fine webbing. Treating before it spreads to the others.', atLabel: '5 days ago' },
    ],
    timeline: [
      { id: 'tl1', atLabel: 'Today · 9:12', title: 'New leaf unfurling', note: 'A fresh fenestrated leaf opened up.' },
      { id: 'tl2', atLabel: '3 days ago', title: 'Started treatment', note: 'Spider mites spotted — began neem routine.' },
      { id: 'tl3', atLabel: '3 weeks ago', title: 'Repotted', note: 'Moved up to a 20cm pot, fresh aroid mix.' },
      { id: 'tl4', atLabel: '2 months ago', title: 'Added to Living Room', note: 'Identified at 96% confidence.' },
    ],
  },
};

export const FEED: Post[] = [
  {
    id: 'post1',
    author: { id: 'u2', handle: 'fernfiend', name: 'Fern Fiend' },
    photoUrls: [],
    caption: 'New leaf unfurled this morning — third one this month. Patience pays off.',
    likeCount: 142,
    commentCount: 18,
    liked: false,
    saved: false,
    following: true,
    createdAtLabel: 'Lisbon · 2h',
  },
  {
    id: 'post2',
    author: { id: 'u3', handle: 'leaf.lydia', name: 'Leaf Lydia' },
    photoUrls: [],
    caption: 'Finally rooted my Pilea babies. Swapping a few — DM if you’re local.',
    likeCount: 88,
    commentCount: 24,
    liked: true,
    saved: false,
    createdAtLabel: 'Porto · 5h',
  },
  {
    id: 'post3',
    author: { id: 'u4', handle: 'potted.pete', name: 'Potted Pete' },
    photoUrls: [],
    caption: 'Week 3 of the #BrightWindow challenge. The calathea is loving it.',
    likeCount: 203,
    commentCount: 31,
    liked: false,
    saved: true,
    createdAtLabel: 'Madrid · 1d',
  },
];

export const PROFILE: UserProfile = {
  id: 'u1',
  handle: 'sorin.grows',
  name: 'Sorin C.',
  email: 'sorin.t.cristescu@gmail.com',
  entitlement: 'free',
  streak: 12,
  stats: { plants: 7, streak: 12, tasksDone: 248, bestStreak: 21 },
};
