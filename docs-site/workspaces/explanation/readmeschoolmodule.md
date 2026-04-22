---
title: Ws:Explanation:Readmeschoolmodule
sidebar_label: Ws:Explanation:Readmeschoolmodule
id: readmeschoolmodule
---

````markdown
# src/modules/School/ — School Module

**Location:** `deltalabs-frontend/src/modules/School/`
**Domain:** School creation, management, marketplace, and offers

---

## What It Does

Manages the full **School Management** platform — the B2B side of DeltaLabs where
educators create and manage their own "schools" (branded learning environments),
publish them to the marketplace, and set up pricing offers.

This is the most complex module in the codebase.

---

## api/ → `index.ts`

All backend calls related to schools:

**School CRUD:**
- `fetchMySchools()` — lists schools owned by the current user.
- `fetchSchoolById(id)` — fetches one school's details.
- `createSchool(data)` — creates a new school.
- `updateSchool(id, data)` — updates school details.
- `archiveSchool(id)` — marks a school as archived.

**Marketplace:**
- `fetchMarketplaceListings(filters)` — public list of all published schools.
- `fetchListingById(id)` — one marketplace listing detail.

**Offers (Pricing Plans):**
- `fetchSchoolOffers(schoolId)` — lists offers for a school.
- `createOffer(schoolId, data)` — creates a new pricing offer.
- `updateOffer(schoolId, offerId, data)` — edits an offer.
- `deleteOffer(schoolId, offerId)` — removes an offer.

---

## hooks/

### `useSchoolActiveOrgId.ts`
A custom hook that tracks and persists which school is currently "active" in the
management workspace. Uses URL params + local state. Multiple views rely on this.

### `schoolQueryKeys.ts`
Query key factories:
```typescript
schoolQueryKeys.mySchools()        // → ['school', 'mine']
schoolQueryKeys.detail(id)         // → ['school', 'detail', id]
schoolQueryKeys.marketplace(opts)  // → ['school', 'marketplace', opts]
schoolQueryKeys.offers(schoolId)   // → ['school', 'offers', schoolId]
```

---

## context/ → `index.ts`

A module-scoped `SchoolContext` that stores the currently selected school and
makes it available to all nested school views without prop drilling.

---

## routing/

### `routing/guards/`
- `requireSchoolOwner` — redirects away if the current user doesn't own the target school.

### `routing/hooks/`
- Hooks for navigating between school sections (e.g. `useNavigateToSchoolOffers()`).

---

## types/

### `index.ts` / `marketplace.ts` / `offers.ts`
TypeScript interfaces for all school-related data:
- `School` — full school object (id, name, logo, owner, status, stats).
- `SchoolOffer` — a pricing plan (name, price, billing period, features list).
- `MarketplaceListing` — a public-facing school listing (subset of School + SEO data).
- `CreateSchoolPayload` — shape of the data for creating a school.
- `OfferTier` — enum of offer types (free, basic, pro).

---

## utils/ → `index.ts`

School-specific utility functions:
- `formatSchoolStatus(status)` — converts API status strings to user-friendly labels.
- `calculateSchoolCompletionScore(school)` — how "complete" a school profile is (%).
- `sortOffersByPrice(offers)` — sorts offers array.

---

## views/

| View | URL | Purpose |
|---|---|---|
| `SchoolHomeView.tsx` | `/features/school` | Lists the user's schools. Primary landing for school managers. |
| `SchoolCreatePageView.tsx` | `/features/school/create` | Renders the `SchoolCreateWizardModal` in full-page mode. |
| `SchoolArchiveView.tsx` | `/features/school/archive` | Lists archived schools with restore option. |
| `SchoolMarketplaceView.tsx` | `/features/school/marketplace` | **The largest view** — full marketplace browser with filters, search, pagination. |
| `SchoolMarketplaceListingView.tsx` | `/features/school/marketplace/:id` | Detail view of a single marketplace listing. |
| `SchoolOffersView.tsx` | `/features/school/offers` | Manage pricing offers for the selected school. |

---

## Mental Model

Think of School module as Shopify for education:
- **Dashboard** = your store home.
- **Marketplace** = the public storefront people browse.
- **Offers** = your pricing plans.
- **Archive** = closed stores.

The module encapsulates ALL of that — API, data shapes, hooks, views, navigation.
````
