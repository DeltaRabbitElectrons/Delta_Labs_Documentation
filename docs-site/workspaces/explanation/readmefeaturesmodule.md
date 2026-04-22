---
title: Ws:Explanation:Readmefeaturesmodule
sidebar_label: Ws:Explanation:Readmefeaturesmodule
id: readmefeaturesmodule
---

```markdown
# src/modules/Features/ — Features Module

**Location:** `deltalabs-frontend/src/modules/Features/`
**Domain:** Platform feature showcase and feature flag management

---

## What It Does

Two responsibilities:

1. **Feature Showcase Page** — powers the `/features` page which shows all
   platform capabilities (School, RentLab, Research, etc.) with descriptions,
   icons, and navigation links.

2. **Feature Flag API** — fetches from the backend which features are enabled
   for the current user/tenant. Used to conditionally show/hide parts of the UI.

---

## api/ → `index.ts`

- `fetchAvailableFeatures()` — GET the list of features and their enabled status
  for the current user account.
- Returns data like: `[{ id: "school", enabled: true }, { id: "rentlab", enabled: false }]`

---

## views/

### `FeaturesPageView.tsx`
The `/features` page. Renders a grid of feature cards, each showing:
- The feature's icon and name.
- A short description.
- A "Go to [Feature]" link if it's enabled, or an "Upgrade" prompt if not.

---

## hooks/ → (`Features/hooks/`)

- `useAvailableFeatures()` — wraps `fetchAvailableFeatures` with `useQuery`.
  Cached so it doesn't refetch on every navigation.

---

## Mental Model

The Features module is the "App Store" within DeltaLabs. It shows you what's
available on the platform and either gives you access or asks you to upgrade.
The feature flag system is the lock/unlock mechanism.
```
