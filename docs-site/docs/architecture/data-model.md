---
title: Data Model & DB Relations
sidebar_label: Data Model & DB Relations
---

# Data Model & DB Relations

**Purpose:** Single place for how data fits together across Delta Labs — main entities, collections, and how they relate. Complements the [collection list in Full System Architecture](./full-system-architecture#52-mongodb-collections-reference--all-domains). Fill in as the system is defined; structure is flexible.

---

## How to use this doc

- **Entities** — one place per domain or per major entity; add fields and collections as you lock them in.
- **Relations** — who references whom (e.g. `user_id` → `users`, `course_id` → `courses`); cardinality (one-to-many, many-to-many) when useful.
- **Diagrams** — optional: add an ER or domain diagram later (e.g. in `img/` and link here).

Extend sections and add new domains/entities freely.

---

## Domains and main entities

*(For each domain, list main collections and key fields. Expand when you have the full picture.)*

### Identity

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

*See [Authorization](../security/authorization) for identity collections, roles, permissions, organizations, and user–org membership.*

### Catalog

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

### Learning

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

### Assessment

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

### Content

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

### Engagement

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

### Commerce

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

### Labs

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

### AI / operational

| Entity / collection | Key fields / notes | Relations |
|---------------------|--------------------|-----------|
| *To be filled.*     |                    |           |

---

## Cross-domain relations (overview)

*(High-level: User ↔ Course, Order ↔ Cart, Lab ↔ Booking, etc. Replace with real relations when defined.)*

| From | To | Relation type | Notes |
|------|----|----------------|-------|
| *To be filled.* | | | |

---

## Diagram (optional)

*When you have a stable model, add an ER or domain diagram (e.g. `img/data-model.svg` or similar) and link it here.*

---

*This doc is a starting point. Expand and refine as the full system is specified.*