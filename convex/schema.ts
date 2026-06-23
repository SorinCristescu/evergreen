/**
 * Convex schema — mirrors docs/prd.md §7 and CONTEXT.md exactly.
 * The full table set is defined here (authoritative); Phase 3 only ships query/mutation
 * endpoints for the subset the 29 screens consume (users, locations, spaces, plants,
 * carePlans/careTasks, posts + community refs). The rest are seeded and reserved for later phases.
 */
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ── People ───────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(), // Clerk subject
    name: v.string(),
    handle: v.string(), // unique community handle
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    role: v.union(v.literal('user'), v.literal('moderator'), v.literal('admin')),
    entitlement: v.union(v.literal('free'), v.literal('plus')), // synced from RevenueCat
    aiIdsThisPeriod: v.number(), // free-tier cap counter
    aiIdsPeriodStart: v.number(),
    streakCount: v.number(),
    streakUpdatedAt: v.optional(v.number()),
    bestStreak: v.optional(v.number()),
    tasksDoneTotal: v.optional(v.number()),
    notificationPrefs: v.object({
      care: v.boolean(),
      community: v.boolean(),
      chat: v.boolean(),
      quietHours: v.optional(v.object({ start: v.number(), end: v.number() })),
    }),
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_handle', ['handle']),

  pushTokens: defineTable({
    userId: v.id('users'),
    token: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android')),
    lastSeenAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_token', ['token']),

  // ── Collection: Location → Place → Space → Plant ─────────
  locations: defineTable({
    userId: v.id('users'),
    name: v.string(), // "Home", "Holiday house", custom
    climate: v.object({ label: v.string(), lat: v.number(), lon: v.number() }),
    gardeningLevel: v.union(v.literal('beginner'), v.literal('intermediate'), v.literal('expert')),
    goals: v.array(v.string()), // keep-alive / grow / learn / share
    status: v.union(v.literal('active'), v.literal('locked')), // locked = over free cap after downgrade
    order: v.number(),
  }).index('by_user', ['userId']),

  spaces: defineTable({
    userId: v.id('users'),
    locationId: v.id('locations'),
    place: v.union(v.literal('indoor'), v.literal('outdoor'), v.literal('greenhouse')),
    name: v.string(),
    order: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_location', ['locationId']),

  species: defineTable({
    scientificName: v.string(),
    commonNames: v.array(v.string()),
    family: v.optional(v.string()),
    origin: v.optional(v.string()),
    funFacts: v.optional(v.array(v.string())),
    careProfile: v.object({
      light: v.union(v.literal('direct'), v.literal('indirect'), v.literal('shade')),
      waterDays: v.number(),
      humidityRange: v.optional(v.object({ min: v.number(), max: v.number() })),
      tempRange: v.optional(v.object({ min: v.number(), max: v.number() })),
      petSafe: v.optional(v.boolean()),
      airPurifying: v.optional(v.boolean()),
      difficulty: v.union(v.literal('easy'), v.literal('medium'), v.literal('hard')),
    }),
    source: v.union(v.literal('seed'), v.literal('ai')),
    verified: v.boolean(),
    externalIds: v.optional(v.object({ plantId: v.optional(v.string()) })),
  })
    .index('by_scientificName', ['scientificName'])
    .searchIndex('search_names', { searchField: 'scientificName' }),

  plants: defineTable({
    userId: v.id('users'),
    spaceId: v.id('spaces'),
    speciesId: v.optional(v.id('species')),
    nickname: v.optional(v.string()),
    description: v.optional(v.string()), // owner's free-text note shown in the About tab
    coverStorageId: v.optional(v.id('_storage')),
    potSizeCm: v.optional(v.number()),
    soilType: v.optional(v.string()),
    lastRepottedAt: v.optional(v.number()),
    tags: v.array(v.string()),
    status: v.union(v.literal('alive'), v.literal('archived'), v.literal('lost')),
  })
    .index('by_user', ['userId'])
    .index('by_space', ['spaceId']),

  plantPhotos: defineTable({
    plantId: v.id('plants'),
    userId: v.id('users'),
    storageId: v.optional(v.id('_storage')), // absent → a text-only journal note
    title: v.optional(v.string()), // milestone label for the Timeline (e.g. "Repotted")
    note: v.optional(v.string()),
    takenAt: v.number(),
  }).index('by_plant', ['plantId']),

  // ── Care ─────────────────────────────────────────────────
  carePlans: defineTable({
    plantId: v.id('plants'),
    userId: v.id('users'),
    generatedFrom: v.object({
      speciesId: v.optional(v.id('species')),
      locationId: v.id('locations'),
      climate: v.string(),
      place: v.string(),
      level: v.string(),
    }),
    baseWaterDays: v.number(),
    fertilizeDays: v.optional(v.number()),
    mistDays: v.optional(v.number()),
    rotateDays: v.optional(v.number()),
    seasonalMultiplier: v.number(),
    updatedAt: v.number(),
  })
    .index('by_plant', ['plantId'])
    .index('by_user', ['userId']),

  careTasks: defineTable({
    carePlanId: v.id('carePlans'),
    plantId: v.id('plants'),
    userId: v.id('users'),
    type: v.union(
      v.literal('water'),
      v.literal('fertilize'),
      v.literal('mist'),
      v.literal('prune'),
      v.literal('repot'),
      v.literal('clean'),
      v.literal('rotate'),
    ),
    dueAt: v.number(),
    status: v.union(v.literal('due'), v.literal('done'), v.literal('snoozed'), v.literal('skipped')),
    completedAt: v.optional(v.number()),
    weatherAdvisoryDismissed: v.optional(v.boolean()),
  })
    .index('by_user_due', ['userId', 'dueAt'])
    .index('by_plant', ['plantId'])
    .index('by_status_due', ['status', 'dueAt']),

  // ── AI activities ────────────────────────────────────────
  identifications: defineTable({
    userId: v.id('users'),
    storageId: v.id('_storage'),
    imageHash: v.string(),
    candidates: v.array(
      v.object({
        speciesId: v.optional(v.id('species')),
        scientificName: v.string(),
        confidence: v.number(),
      }),
    ),
    chosenSpeciesId: v.optional(v.id('species')),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_hash', ['imageHash']),

  treatments: defineTable({
    plantId: v.id('plants'),
    userId: v.id('users'),
    diagnosis: v.string(),
    issueType: v.union(v.literal('disease'), v.literal('pest'), v.literal('deficiency')),
    severity: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    steps: v.array(v.object({ text: v.string(), done: v.boolean() })),
    status: v.union(v.literal('active'), v.literal('resolved'), v.literal('abandoned')),
    createdAt: v.number(),
  })
    .index('by_plant', ['plantId'])
    .index('by_user', ['userId']),

  // ── Shared access ────────────────────────────────────────
  // An owner grants another person (by email) access to specific locations. Pending until the
  // invitee signs in and is matched by email (then status → active, granteeUserId set).
  accessGrants: defineTable({
    ownerId: v.id('users'),
    email: v.string(), // invitee email, lowercased
    role: v.union(v.literal('family'), v.literal('gardener'), v.literal('housekeeper')),
    locationIds: v.array(v.id('locations')),
    granteeUserId: v.optional(v.id('users')),
    status: v.union(v.literal('pending'), v.literal('active')),
    createdAt: v.number(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_email', ['email'])
    .index('by_grantee', ['granteeUserId']),

  // ── Community ────────────────────────────────────────────
  posts: defineTable({
    userId: v.id('users'),
    caption: v.string(),
    photoStorageIds: v.array(v.id('_storage')),
    taggedSpeciesId: v.optional(v.id('species')),
    taggedPlantId: v.optional(v.id('plants')),
    likeCount: v.number(),
    moderation: v.union(v.literal('ok'), v.literal('flagged'), v.literal('removed')),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_createdAt', ['createdAt']),

  comments: defineTable({
    postId: v.id('posts'),
    userId: v.id('users'),
    text: v.string(),
    moderation: v.union(v.literal('ok'), v.literal('flagged'), v.literal('removed')),
    createdAt: v.number(),
  }).index('by_post', ['postId']),

  follows: defineTable({ followerId: v.id('users'), followeeId: v.id('users') })
    .index('by_follower', ['followerId'])
    .index('by_followee', ['followeeId']),

  saves: defineTable({ userId: v.id('users'), postId: v.id('posts') }).index('by_user', ['userId']),

  messages: defineTable({
    conversationId: v.string(),
    senderId: v.id('users'),
    recipientId: v.id('users'),
    text: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    moderation: v.union(v.literal('ok'), v.literal('flagged'), v.literal('removed')),
    createdAt: v.number(),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_recipient', ['recipientId']),

  blocks: defineTable({ blockerId: v.id('users'), blockedId: v.id('users') }).index('by_blocker', ['blockerId']),

  swapListings: defineTable({
    userId: v.id('users'),
    title: v.string(),
    description: v.string(),
    photoStorageIds: v.array(v.id('_storage')),
    speciesId: v.optional(v.id('species')),
    status: v.union(v.literal('open'), v.literal('claimed'), v.literal('closed')),
    moderation: v.union(v.literal('ok'), v.literal('flagged'), v.literal('removed')),
    createdAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_user', ['userId']),

  challenges: defineTable({
    title: v.string(),
    description: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
  }).index('by_endsAt', ['endsAt']),

  // ── Cross-cutting ────────────────────────────────────────
  notifications: defineTable({
    userId: v.id('users'),
    kind: v.union(v.literal('care'), v.literal('community'), v.literal('chat'), v.literal('system')),
    title: v.string(),
    body: v.string(),
    entityRef: v.optional(v.string()),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  reports: defineTable({
    reporterId: v.id('users'),
    targetType: v.union(
      v.literal('post'),
      v.literal('comment'),
      v.literal('message'),
      v.literal('user'),
      v.literal('listing'),
    ),
    targetId: v.string(),
    reason: v.string(),
    status: v.union(v.literal('open'), v.literal('actioned'), v.literal('dismissed')),
    createdAt: v.number(),
  }).index('by_status', ['status']),

  wishlist: defineTable({ userId: v.id('users'), speciesId: v.id('species') }).index('by_user', ['userId']),
});
