# Context — Evergreen

> Glossary for the Evergreen domain. This file is **language only** — no implementation
> details, no schema, no decisions. When prose and code disagree on what a word means,
> this file wins. Update it the moment a term is sharpened.

---

## Core entities

### Species
The canonical archetype of a kind of plant — e.g. *Monstera deliciosa*. Holds the shared,
user-independent facts: scientific name, common names, family, origin, and the baseline care
profile (light, water cadence, humidity, temperature ranges). One Species is referenced by
many **Plants**. The **Encyclopedia** browses Species. A Species record is either *seeded*
from a curated dataset or *AI-generated and cached*; its `verified` status records which.

> A Species is **not** something a user owns. You cannot water a Species. You water a Plant.

### Plant
A single living plant that a specific user owns — e.g. *"Monty," the monstera on my
windowsill*. A Plant references **at most one** Species and adds instance-specific reality: its
photos, its journal, its pot size, the **Space** it lives in, its nickname, and its own
care history. Two users owning the same Species own two different Plants.

> A Plant may be **unidentified** — referencing *no* Species — when the AI is unsure and the
> user chooses "Add without identifying." Such a Plant still gets a (conservative-default)
> **CarePlan** and can be identified later. Identifying it links it to a Species.

> The word "plant" in conversation almost always means this instance, not the Species.
> When ambiguity is possible, say **Species** or **Plant** explicitly.

### CarePlan
The personalized care schedule for one **Plant**. Generated from that Plant's Species
baseline, adjusted for its **Location**'s climate (and that Location's gardening **Level** and
**Goals**), its **Place**/**Space**, pot size, and soil. A CarePlan is owned by exactly one
Plant and emits **CareTasks**. It answers "how *this* user should care for *this* plant," as
distinct from the Species, which answers "what this kind of plant is."

### CareTask
A single dated, actionable unit of care emitted by a **CarePlan** — water, fertilize, mist,
prune, repot, clean leaves, rotate. A CareTask has a due time, a status (due / done /
snoozed / skipped), and feeds reminders and **streaks**.

### Location
A geographical place where a user keeps plants — effectively a **city** with its own
**climate** and a user-chosen name/label (e.g. "Home," "Holiday house," "Studio"). A Location
owns the climate **and** the gardening **Level** and **Goals** that personalize every
**CarePlan** for the plants kept there (the same person may be an expert at home and a beginner
at the holiday house). A free user has exactly **one** Location; **Evergreen+** unlocks **many**
(home, holiday house, office…), each independently configured. A user's first Location is
created during onboarding; further Locations are added from the Profile and re-run the same
location setup.

> A Location contains **Places**, which contain **Spaces**, which contain **Plants**:
> User → Location → Place → Space → Plant.

### Place
One of the three **fixed environments** within a **Location** — *Indoor*, *Outdoor*, or
*Greenhouse*. A Place is not user-named; it is a fixed category that groups **Spaces** and
carries the broad light/exposure assumptions a **CarePlan** depends on. *Indoor* holds rooms;
*Outdoor* holds open-air areas; *Greenhouse* is standalone.

### Space
A specific **room or area** within a **Place** where a **Plant** actually sits — e.g.
*Living Room* or *Bedroom* (Indoor); *Balcony*, *Terrace*, *Courtyard* or *Backyard* (Outdoor);
or a greenhouse bench (Greenhouse). Spaces are **user-built**: chosen from predefined options or
created via an "Other" custom input during the add-plant flow. A Plant lives in exactly one
Space and can be **moved** to another Space at any time. An Indoor Space is always a room — a
balcony/terrace/courtyard is never Indoor; those belong to Outdoor.

> **"Garden"** is *not* a domain entity — it is the **name of the tab/screen** that shows the
> active Location's contents (its Places, Spaces, and Plants). Earlier drafts used "Garden" for a
> room and "Space" for the environment; **both of those meanings are retired** (the environment
> is now **Place**; the room is now **Space**).

---

## Activities

### Identification
The act (and stored record) of the AI naming a **Species** from a user-supplied photo,
with a confidence score and ranked alternative matches. An Identification may *result in*
adding a **Plant**, but is itself just the recognition event and its history.

### Treatment
An ongoing remediation for a sick **Plant**, opened from a **Dr. Plant** diagnosis. Holds the
diagnosis (disease / pest / deficiency), a severity, a step-by-step plan, the user's progress
through those steps, and improvement photos over time. Distinct from a CarePlan: a CarePlan is
routine upkeep; a Treatment is recovery from a specific problem.

### Dr. Plant
The product name for the diagnostics experience: the user photographs an affected plant and
receives a diagnosis + **Treatment** plan. "Dr. Plant" is the user-facing feature; the stored
outcome is a Treatment.

---

## People

### Gardener / User
The human account holder. **User** is the canonical term for the identity/auth record (one
Clerk identity → one User). **Gardener** is the same person in their community-facing role
(profile, posts, follows). Same entity, two lenses — prefer **User** in technical/schema
contexts and **Gardener** in community/marketing contexts.

---

## Community

### Post
A **Gardener**'s public share — photo(s) + caption, optionally tagged to a Species or Plant.
Lives in the community feed; can be liked, commented on, and saved.

### Swap Listing
A non-commercial offer of a cutting or plant given away to other **Gardeners**. In v1 there is
**no money** involved — a Swap Listing is a gift offer, not a sale. (The concept is
deliberately shaped so a future paid-marketplace listing can extend it without redefining it.)

---

## Commercial

### Evergreen+
The premium subscription tier. A **User** with an active Evergreen+ entitlement unlocks
**multiple Locations**, unlimited Plants and Identifications, **Dr. Plant**, the light meter,
advanced **CarePlans**, and full community posting. The free tier is capped (a **single
Location**, limited Plants, limited Identifications, read-only community).
