/**
 * Domain types for the data seam — mirror `docs/design/components.md` shared types and the
 * Convex schema (prd.md §7). Screens & components import ONLY from `@/data`; phase 3 swaps the
 * hook bodies to Convex without touching these types or the screens.
 */

export type ID = string;

export type Place = 'indoor' | 'outdoor' | 'greenhouse';
export type CareTaskType =
  | 'water'
  | 'fertilize'
  | 'mist'
  | 'prune'
  | 'repot'
  | 'clean'
  | 'rotate';
export type CareTaskStatus = 'due' | 'done' | 'snoozed' | 'skipped';
export type Urgency = 'overdue' | 'today' | 'upcoming';
export type PlantStatus = 'alive' | 'archived' | 'lost';
export type Entitlement = 'free' | 'plus';
export type GardeningLevel = 'beginner' | 'intermediate' | 'expert';
export type IssueType = 'disease' | 'pest' | 'deficiency';
export type Severity = 'low' | 'medium' | 'high';
export type ModerationState = 'ok' | 'flagged' | 'removed';
export type ReportTargetType = 'post' | 'comment' | 'message' | 'user' | 'listing';

export type SpaceRef = { id: ID; name: string; place: Place };
export type LocationRef = {
  id: ID;
  name: string;
  climateLabel: string;
  tempLabel?: string;
  plantCount: number;
  locked?: boolean;
  lat?: number; // for the weather forecast (0/undefined → geocode by climateLabel)
  lon?: number;
  sharedByName?: string; // set when this location belongs to someone else who granted you access
};

export type AccessRole = 'family' | 'gardener' | 'housekeeper';

/** An access grant the current user has handed out (Profile › Permissions › Shared access). */
export type AccessGrant = {
  id: ID;
  email: string;
  role: AccessRole;
  status: 'pending' | 'active';
  locationCount: number;
  granteeName?: string; // the invitee's display name, once they've signed in
};
export type SpeciesRef = { id: ID; scientificName: string; commonName?: string };
export type GardenerRef = { id: ID; handle: string; name: string; avatarUrl?: string };

/** Garden card status: warn = needs water (amber), ok = scheduled (green drop), good = healthy. */
export type PlantCardStatus = 'warn' | 'ok' | 'good';
export type PlantSummary = {
  id: ID;
  nickname?: string;
  coverUrl?: string;
  species?: SpeciesRef; // absent → unidentified
  needsWater?: boolean;
  status?: PlantCardStatus;
  statusLabel?: string; // e.g. "Water in 2d", "Needs water", "Healthy"
  space: SpaceRef;
};

export type CareTaskItem = {
  id: ID;
  type: CareTaskType;
  status: CareTaskStatus;
  urgency: Urgency;
  dueLabel: string;
  plant: PlantSummary;
};

export type Treatment = {
  id: ID;
  diagnosis: string;
  issueType: IssueType;
  severity: Severity;
  currentStep: number;
  totalSteps: number;
  steps: { id: ID; text: string; done: boolean }[];
  status: 'active' | 'resolved' | 'abandoned';
};

export type PlantDetail = PlantSummary & {
  description?: string; // owner's free-text note (raw, for the edit form)
  photoUrls: string[];
  potSizeCm?: number;
  soilType?: string;
  careTasks: CareTaskItem[];
  treatment?: Treatment;
  journal: { id: ID; note: string; atLabel: string }[];
  timeline: { id: ID; photoUrl?: string; atLabel: string; title?: string; note?: string }[];
  careGuide?: { light: string; water: string; humidity: string };
  about?: {
    lead: string;
    facts: { label: string; value: string }[];
    notes: string[];
    source?: { label: string; url?: string };
  };
};

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

export type IdentificationCandidate = { species: SpeciesRef; confidence: number };

export type IdentifiedCandidate = {
  speciesId: ID;
  scientificName: string;
  commonName?: string;
  confidence: number; // 0..1
  careProfile: {
    light: 'direct' | 'indirect' | 'shade';
    waterDays: number;
    difficulty: 'easy' | 'medium' | 'hard';
    humidityRange?: { min: number; max: number };
  };
};
export type IdentificationResult = { notAPlant: boolean; candidates: IdentifiedCandidate[] };

export type Post = {
  id: ID;
  author: GardenerRef;
  photoUrls: string[];
  caption: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
  following?: boolean; // author is followed (drives the Following feed)
  taggedSpecies?: SpeciesRef;
  taggedPlant?: { id: ID; label: string }; // a plant from the author's garden, linked from the post
  createdAtLabel: string;
};

export type UserProfile = {
  id: ID;
  handle: string;
  name: string;
  email: string;
  avatarUrl?: string;
  entitlement: Entitlement;
  streak: number;
  stats: { plants: number; streak: number; tasksDone: number; bestStreak?: number };
};
