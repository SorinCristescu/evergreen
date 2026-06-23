# 1. Ship full scope (care + community + AI) in v1.0

Date: 2026-06-06

## Status

Accepted

## Context

Evergreen fuses three products with fundamentally different economics:

- **A care utility** (identify → care plan → reminders → diagnosis). Valuable to a single
  user on day one. Single-player. AI is the magic.
- **A community / social network** (feed, comments, follows, DMs, challenges, ratings, swap
  board). Worth roughly nothing until it reaches critical mass, and it carries an obligation
  to moderate user-generated content and police abuse.
- **An AI botanist** (vision identification, health diagnostics, generative care plans). Real
  per-call cost on every use.

The default product-strategy advice is to sequence these: ship the care utility first (useful
to a lone user), then layer community once there's an installed base to populate the feed.
This avoids a "dead on arrival" social experience and defers moderation cost.

The product owner explicitly chose, after two rounds of pushback, to ship **all three fully in
v1.0** rather than sequence them.

## Decision

v1.0 ships the complete care utility, the complete community stack (feed, comments, follows,
DMs, challenges, ratings, non-commercial swap board), and the AI layer — simultaneously.

A small number of *non-core* features are still deferred (light meter → v1.1; automated
weather-skip → advisory only; paid marketplace → v2; local-notification mirror → v1.1), but
the three pillars themselves are all in v1.0.

## Consequences

**Accepted costs (consequences of the decision, not reasons against it):**

- **Cold-start period.** The community half is empty at launch and will feel dead until there
  is a meaningful concurrent user base. Launch/marketing must drive enough simultaneous users,
  or seed content, to cross that threshold. Success metrics track this explicitly
  (posters %, posts per active user).
- **Moderation is a launch gate, not a nicety.** Because user-generated content ships in v1,
  Apple App Store Guideline 1.2 *requires* report, block, content filter, and a published
  abuse contact before approval. This is a hard dependency — see the moderation pipeline in
  the PRD (§6) and the baseline-compliance-plus-AI-prefilter scope.
- **Larger v1 surface → longer build and more vendor integrations** (plant-ID API, LLM,
  RevenueCat, image-moderation API, weather API) all on the critical path at once.
- **Reversibility is poor.** Pulling community back out post-launch is a worse experience than
  never shipping it; this is why it is recorded as an ADR.

**Why it can still be the right call:** if distribution can supply launch-day concurrency, the
combined product has a higher ceiling and a stronger retention loop (care brings users back
daily; community makes them stay) than a care-only utility competing directly with Planta.
