# 2. Split the AI layer: specialist plant-ID API for vision, LLM for reasoning

Date: 2026-06-06

## Status

Accepted

## Context

The original brief proposed using a single general-purpose vision model ("GPT-4o or Claude")
for everything AI: species identification, disease/pest diagnosis, and care-plan generation.

These are two different kinds of task:

1. **Fine-grained visual recognition** — distinguishing *Monstera deliciosa* from *Monstera
   adansonii* from a look-alike *Philodendron*. This is exactly the long-tail, fine-grained
   classification problem that general vision LLMs are weakest at: they are plausible but
   frequently and *confidently* wrong on near-identical species. Getting this wrong directly
   breaks the app's core promise.
2. **Reasoning over known facts** — writing a personalized care plan, explaining a diagnosis
   in plain language, generating fun facts, and filling missing Species records. General LLMs
   (Claude) are strong here.

Purpose-built plant identification services (Plant.id, Pl@ntNet) are trained specifically for
task (1) and materially outperform general vision models on species accuracy, and Plant.id
additionally offers a plant **health assessment** endpoint for disease/pest detection.

## Decision

Split the AI layer by job:

- **Identification + health/disease assessment → a specialist plant-ID API** (Plant.id or
  Pl@ntNet; final vendor is an open question pending pricing/coverage evaluation).
- **Reasoning → Claude** (care-plan generation, diagnosis explanation, fun facts, and
  AI-generation of missing Species records for the encyclopedia).

## Consequences

- **Higher accuracy on the wedge.** The make-or-break "did it correctly name my plant?" moment
  is handled by a model built for it, protecting trust and activation.
- **Two vendors, two cost lines, two failure modes.** Architecture must handle either service
  being slow/down independently (e.g. identification can succeed while care-plan generation
  retries). Cost is governed by the freemium identification cap (see PRD §8, §11).
- **Clear seam for swapping vendors.** Because identification is isolated behind its own
  Convex action, switching Plant.id ↔ Pl@ntNet (or adding a fallback) is a localized change.
- **Disease detection inherits the specialist's limits.** Plant.id health assessment covers
  common problems; novel or ambiguous cases fall back to the LLM for an explanatory,
  lower-confidence response with a "consult a human" nudge rather than a false-confident
  diagnosis.
- Reversible-ish: collapsing back to a single model later is possible but would regress
  identification quality, hence recording the trade-off here.
