---
title: Ws:Explanation:Readmeschool
sidebar_label: Ws:Explanation:Readmeschool
id: readmeschool
---

```markdown
# src/components/features/school/ — School UI Components

**Location:** `deltalabs-frontend/src/components/features/school/`
**Type:** Feature-Specific UI Components (School Domain)

---

## Overview

These are the **shared UI components** for the School management workspace.
They are used by the School module's views (`SchoolHomeView`, `SchoolMarketplaceView`,
etc.) and represent the reusable "vocabulary" of school-related UI.

---

## Standalone Components

| Component | Purpose |
|---|---|
| `SchoolBodySearch.tsx` | An in-page search bar for filtering school or listing results within a view body. |
| `SchoolSectionHeading.tsx` | A styled section title with optional subtitle and action button (e.g. "My Schools" + "Create new"). |

---

## Style Utilities

| File | Purpose |
|---|---|
| `schoolFeatureChipClasses.ts` | CSS class strings for the status/category "chips" (pill badges) used on school cards and tables. |

---

## layout/ Sub-folder (Workspace Shell)

Components that form the structural frame of the School workspace — persistent
across all school sub-pages.

| Component | Purpose |
|---|---|
| `SchoolManagementShell.tsx` | The outer layout container for the entire school workspace: icon rail on the left, header at the top, content area. |
| `SchoolIconRail.tsx` | The vertical icon rail (mini sidebar) with icon links to each school section (Home, Marketplace, Offers, Archive). |
| `SchoolWorkspaceHeader.tsx` | The header bar at the top of the school workspace showing the current section title and breadcrumbs. |

---

## master/ Sub-folder (Complex Modals & Drawers)

Large, complex UI pieces — modals and drawers that overlay the workspace.

| Component | Purpose |
|---|---|
| `SchoolCreateWizardModal.tsx` | **The school creation wizard.** A multi-step modal guiding the user through setting up a new school (name, logo, description, categories, pricing). The largest component in this folder. |
| `SchoolEntityCard.tsx` | A card displaying a school's summary (logo, name, stats, status). Used in the school list and marketplace. |
| `SchoolDetailsDrawer.tsx` | A slide-in right drawer showing the full details of a selected school. |
| `SchoolOfferDetailsDrawer.tsx` | A slide-in drawer showing the details of a specific offer/plan for a school. |
| `SchoolOffersTable.tsx` | A data table listing all offers for a school with edit/delete actions. |
| `SchoolAmendOfferModal.tsx` | A modal for creating or editing a school offer (pricing plan). |
| `SchoolConfirmActionModal.tsx` | A generic confirmation dialog ("Are you sure you want to archive this school?"). |
| `SchoolStatStrip.tsx` | A horizontal strip of key stats for a school (total students, revenue, active courses). |
| `SchoolStatePanel.tsx` | An overlay panel shown when the school list is empty, loading, or has an error. |

---

## index.ts

Re-exports all school components for clean imports.

---

## Mental Model

These components are the furniture inside the school management office.
The `layout/` components are the walls and doors.
The `master/` components are the big conference tables and whiteboards you bring out
for specific operations (creating a school, reviewing an offer).
```
