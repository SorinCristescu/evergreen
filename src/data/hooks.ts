/**
 * Data-access hooks — the single seam between UI and data source.
 *
 * PHASE 3 (now): bodies call Convex `useQuery`/`useMutation`. Screens & components import these
 * hooks only and never change. `useQuery` returns `undefined` while loading; queries return `[]`
 * or `null` when there's no signed-in/provisioned user — we map `null → undefined` so the existing
 * `?? []` / `?? undefined` call-sites behave exactly as before.
 *
 * The only place the view-model `ID` (string) meets a Convex `Id<…>` is the casts below; screens
 * never see Convex types.
 */
import { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type {
  AccessGrant,
  AccessRole,
  CareTaskItem,
  Entitlement,
  GardeningLevel,
  ID,
  IssueType,
  LocationRef,
  Place,
  PlantDetail,
  PlantSummary,
  Post,
  Severity,
  SpaceRef,
  UserProfile,
} from './types';

/**
 * Upload a local file URI to a Convex `_storage` upload URL and return its storageId.
 *
 * Uses XMLHttpRequest rather than `fetch(uri).blob()`: on native, Expo's winter `fetch` builds a
 * Blob from an ArrayBuffer, which React Native's BlobManager rejects ("Creating blobs from
 * 'ArrayBuffer' … are not supported"). RN's own XHR produces a file-backed Blob that uploads
 * correctly, and works on web too.
 */
async function uploadFileToStorage(uploadUrl: string, fileUri: string, contentType: string): Promise<Id<'_storage'>> {
  // 1. Read the local file into a React-Native-native Blob.
  const blob: Blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Could not read file for upload'));
    xhr.open('GET', fileUri, true);
    xhr.send(null);
  });
  // 2. POST it to Convex storage; the response body is `{ storageId }`.
  const responseText: string = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(xhr.responseText)
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(blob);
  });
  return (JSON.parse(responseText) as { storageId: Id<'_storage'> }).storageId;
}

/** A Dr. Plant diagnosis ready to persist as a treatment (steps are plain recommendation strings). */
export type NewTreatment = {
  plantId: ID;
  diagnosis: string;
  issueType: IssueType;
  severity: Severity;
  steps: string[];
};

// ── Locations ─────────────────────────────────────────────────────────────────
export function useLocations(): LocationRef[] | undefined {
  return useQuery(api.locations.listLocations) ?? undefined;
}

export function useActiveLocation(): LocationRef | undefined {
  return useQuery(api.locations.activeLocation) ?? undefined;
}

/** undefined while loading; true when the signed-in user has no locations yet (needs onboarding). */
export function useNeedsOnboarding(): boolean | undefined {
  const locations = useQuery(api.locations.listLocations);
  return locations === undefined ? undefined : locations.length === 0;
}

export type OnboardingInput = {
  name: string;
  climateLabel: string;
  level: GardeningLevel;
  goals: string[];
  place: Place;
  spaceName: string;
  lat?: number; // real device coords from "Use my location"
  lon?: number;
};

/** Persist onboarding: create the first location + space. */
export function useCompleteOnboarding(): (input: OnboardingInput) => Promise<void> {
  const complete = useMutation(api.locations.completeOnboarding);
  return useCallback(async (input: OnboardingInput) => { await complete(input); }, [complete]);
}

/** Add an additional location + space (Profile › Locations › Add a location). Returns the new ids. */
export function useAddLocation(): (input: OnboardingInput) => Promise<{ locationId: ID; spaceId: ID }> {
  const add = useMutation(api.locations.addLocation);
  return useCallback(async (input: OnboardingInput) => {
    const r = await add(input);
    return { locationId: r.locationId as ID, spaceId: r.spaceId as ID };
  }, [add]);
}

/** Delete a location and everything in it (spaces, plants, care data). Irreversible. */
export function useDeleteLocation(): (locationId: ID) => Promise<void> {
  const del = useMutation(api.locations.deleteLocation);
  return useCallback(async (locationId: ID) => { await del({ locationId: locationId as Id<'locations'> }); }, [del]);
}

// ── Shared access (Permissions) ───────────────────────────────────────────────────
/** Grants the current user has handed out (people they've invited to their locations). */
export function useAccessGrants(): AccessGrant[] | undefined {
  return useQuery(api.access.listGrants) ?? undefined;
}

/** Invite someone (by email + role) to one or more of the owner's locations. */
export function useInviteAccess(): (input: { email: string; role: AccessRole; locationIds: ID[] }) => Promise<void> {
  const invite = useMutation(api.access.inviteAccess);
  return useCallback(
    async ({ email, role, locationIds }) => { await invite({ email, role, locationIds: locationIds as Id<'locations'>[] }); },
    [invite],
  );
}

/** Remove a person's access. */
export function useRevokeAccess(): (grantId: ID) => Promise<void> {
  const revoke = useMutation(api.access.revokeAccess);
  return useCallback(async (grantId: ID) => { await revoke({ grantId: grantId as Id<'accessGrants'> }); }, [revoke]);
}

// ── Spaces & plants ─────────────────────────────────────────────────────────────
export function useSpaces(locationId?: ID): SpaceRef[] | undefined {
  return useQuery(api.spaces.listSpaces, { locationId: locationId as Id<'locations'> | undefined }) ?? undefined;
}

export function usePlants(locationId?: ID): PlantSummary[] | undefined {
  return useQuery(api.plants.listPlants, { locationId: locationId as Id<'locations'> | undefined }) ?? undefined;
}

/** Plants grouped by Space (for the Garden tab sections) — computed server-side. */
export function usePlantsBySpace(
  locationId?: ID,
): { space: SpaceRef; plants: PlantSummary[] }[] | undefined {
  return (
    useQuery(api.plants.plantsBySpace, { locationId: locationId as Id<'locations'> | undefined }) ?? undefined
  );
}

export function usePlantDetail(plantId: ID): PlantDetail | undefined {
  return useQuery(api.plants.plantDetail, { plantId: plantId as Id<'plants'> }) ?? undefined;
}

// ── Care tasks ──────────────────────────────────────────────────────────────────
export function useTodayTasks(locationId?: ID): CareTaskItem[] | undefined {
  return useQuery(api.careTasks.todayTasks, { locationId: locationId as Id<'locations'> | undefined }) ?? undefined;
}

/** True when an Overdue or Due-today task exists (drives the care-state landing router). */
export function useHasActionableToday(): boolean | undefined {
  return useQuery(api.careTasks.hasActionableToday);
}

// ── Community ────────────────────────────────────────────────────────────────────
export function useCommunityFeed(): Post[] | undefined {
  return useQuery(api.community.communityFeed) ?? undefined;
}

/** Create a community post: uploads each local photo to storage, then inserts the post. */
export function useCreatePost(): (caption: string, fileUris: string[], taggedPlantId?: ID) => Promise<void> {
  const uploadUrlMut = useMutation(api.community.generatePostUploadUrl);
  const createMut = useMutation(api.community.createPost);
  return useCallback(
    async (caption: string, fileUris: string[], taggedPlantId?: ID) => {
      const storageIds: Id<'_storage'>[] = [];
      for (const uri of fileUris) {
        const uploadUrl = await uploadUrlMut({});
        const storageId = await uploadFileToStorage(uploadUrl, uri, 'image/jpeg');
        storageIds.push(storageId);
      }
      await createMut({ caption, photoStorageIds: storageIds, taggedPlantId: taggedPlantId as Id<'plants'> | undefined });
    },
    [uploadUrlMut, createMut],
  );
}

/** Delete one of your own community posts. */
export function useDeletePost(): (postId: ID) => Promise<void> {
  const del = useMutation(api.community.deletePost);
  return useCallback(async (postId: ID) => { await del({ postId: postId as Id<'posts'> }); }, [del]);
}

// ── Profile / entitlement ───────────────────────────────────────────────────────
export function useProfile(): UserProfile | undefined {
  return useQuery(api.users.getCurrentUser) ?? undefined;
}

export function useEntitlement(): Entitlement | undefined {
  const profile = useQuery(api.users.getCurrentUser);
  return profile?.entitlement ?? undefined;
}

/** Upload + set the signed-in user's avatar (full Convex `_storage` pipeline). */
export function useAvatarUpload(): (fileUri: string, contentType?: string) => Promise<void> {
  const uploadUrlMut = useMutation(api.users.generateAvatarUploadUrl);
  const setAvatarMut = useMutation(api.users.setAvatar);
  return useCallback(
    async (fileUri: string, contentType = 'image/jpeg') => {
      const uploadUrl = await uploadUrlMut({});
      const storageId = await uploadFileToStorage(uploadUrl, fileUri, contentType);
      await setAvatarMut({ storageId });
    },
    [uploadUrlMut, setAvatarMut],
  );
}

// ── Mutations ─────────────────────────────────────────────────────────────────
type CareMutation = (taskId: ID) => void;

/**
 * `completed` is derived from server task status (reactive: after a mutation runs, `todayTasks`
 * re-emits and the set updates). `complete` toggles done↔due; snooze/skip call their mutations.
 */
export function useCareTaskActions(): {
  completed: Set<ID>;
  complete: CareMutation;
  snooze: CareMutation;
  skip: CareMutation;
} {
  const tasks = useTodayTasks();
  const completeMut = useMutation(api.careTasks.completeTask);
  const snoozeMut = useMutation(api.careTasks.snoozeTask);
  const skipMut = useMutation(api.careTasks.skipTask);

  const completed = useMemo(
    () => new Set((tasks ?? []).filter((t) => t.status === 'done').map((t) => t.id)),
    [tasks],
  );
  const complete = useCallback<CareMutation>((id) => { void completeMut({ taskId: id as Id<'careTasks'> }); }, [completeMut]);
  const snooze = useCallback<CareMutation>((id) => { void snoozeMut({ taskId: id as Id<'careTasks'> }); }, [snoozeMut]);
  const skip = useCallback<CareMutation>((id) => { void skipMut({ taskId: id as Id<'careTasks'> }); }, [skipMut]);

  return { completed, complete, snooze, skip };
}

// ── Plant editing ───────────────────────────────────────────────────────────────
export type PlantEdit = { nickname?: string; description?: string; scientificName?: string };

/** Fields for a brand-new plant added from the Garden capture flow (Identify or Add manually).
 *  `spaceId` is optional — omit to let the server pick the active location's first space. */
export type NewPlant = { nickname?: string; scientificName?: string; description?: string; spaceId?: ID };

/** Create a plant in the garden; returns the new plant id (for navigation). */
export function useCreatePlant(): (input: NewPlant) => Promise<ID> {
  const createMut = useMutation(api.plants.createPlant);
  return useCallback(
    async ({ nickname, scientificName, description, spaceId }: NewPlant) =>
      (await createMut({ nickname, scientificName, description, spaceId: spaceId as Id<'spaces'> | undefined })) as ID,
    [createMut],
  );
}

/**
 * Owner edits for a plant: update fields, delete, and upload a photo. `addPhoto` runs the full
 * Convex `_storage` pipeline (get upload URL → POST the local file → attach), so screens just pass
 * an image URI from the picker. All Convex `Id<…>` casts stay inside this hook.
 */
export function usePlantEditor(): {
  updatePlant: (plantId: ID, edit: PlantEdit) => Promise<void>;
  deletePlant: (plantId: ID) => Promise<void>;
  addPhoto: (plantId: ID, fileUri: string, contentType?: string, setCover?: boolean) => Promise<void>;
  addNote: (plantId: ID, note: string) => Promise<void>;
} {
  const updateMut = useMutation(api.plants.updatePlant);
  const deleteMut = useMutation(api.plants.deletePlant);
  const uploadUrlMut = useMutation(api.plants.generatePlantUploadUrl);
  const addPhotoMut = useMutation(api.plants.addPlantPhoto);
  const addNoteMut = useMutation(api.plants.addJournalNote);

  const updatePlant = useCallback(
    async (plantId: ID, edit: PlantEdit) => {
      await updateMut({ plantId: plantId as Id<'plants'>, ...edit });
    },
    [updateMut],
  );
  const deletePlant = useCallback(
    async (plantId: ID) => { await deleteMut({ plantId: plantId as Id<'plants'> }); },
    [deleteMut],
  );
  const addPhoto = useCallback(
    async (plantId: ID, fileUri: string, contentType = 'image/jpeg', setCover?: boolean) => {
      const uploadUrl = await uploadUrlMut({});
      const storageId = await uploadFileToStorage(uploadUrl, fileUri, contentType);
      await addPhotoMut({ plantId: plantId as Id<'plants'>, storageId, setCover });
    },
    [uploadUrlMut, addPhotoMut],
  );

  const addNote = useCallback(
    async (plantId: ID, note: string) => { await addNoteMut({ plantId: plantId as Id<'plants'>, note }); },
    [addNoteMut],
  );

  return { updatePlant, deletePlant, addPhoto, addNote };
}

// ── Treatments ────────────────────────────────────────────────────────────────
/**
 * Treatment actions (reactive: the plant detail query re-emits on change):
 * - `toggleStep` checks / unchecks a step on the active treatment.
 * - `createTreatment` accepts a Dr. Plant diagnosis and makes it the plant's active treatment.
 */
export function useTreatmentActions(): {
  toggleStep: (treatmentId: ID, stepIndex: number) => Promise<void>;
  createTreatment: (input: NewTreatment) => Promise<void>;
} {
  const toggleMut = useMutation(api.treatments.toggleStep);
  const createMut = useMutation(api.treatments.createTreatment);
  const toggleStep = useCallback(
    async (treatmentId: ID, stepIndex: number) => {
      await toggleMut({ treatmentId: treatmentId as Id<'treatments'>, stepIndex });
    },
    [toggleMut],
  );
  const createTreatment = useCallback(
    async ({ plantId, diagnosis, issueType, severity, steps }: NewTreatment) => {
      await createMut({ plantId: plantId as Id<'plants'>, diagnosis, issueType, severity, steps });
    },
    [createMut],
  );
  return { toggleStep, createTreatment };
}
