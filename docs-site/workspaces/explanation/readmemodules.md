---
title: Ws:Explanation:Readmemodules
sidebar_label: Ws:Explanation:Readmemodules
id: readmemodules
---

````markdown
# src/modules/ — Feature Modules

**Location:** `deltalabs-frontend/src/modules/`
**Type:** Domain-Driven Feature Modules

---

## What It Does

This is the **heart of the application's business logic**. Every major feature of
DeltaLabs lives as a self-contained module in this folder.

## The Module Pattern

Every module follows the same internal structure:

```
ModuleName/
├── index.ts        ← Public API: re-exports everything the module exposes
├── api/            ← Functions that call the backend API (via apiClient)
├── hooks/          ← TanStack Query hooks (useQuery / useMutation wrappers)
├── views/          ← React page-level components (the actual screens)
├── types/          ← TypeScript interfaces for this module's data
├── context/        ← Module-scoped React Contexts (if needed)
├── routing/        ← Route guards and routing hooks
├── features/       ← Complex sub-features (nested components, sub-modules)
└── utils/          ← Pure utility functions specific to this module
```

**The key rule:** A module's internals are private. Other parts of the app
import ONLY through `index.ts`. This keeps modules encapsulated and their
internals easy to refactor.

---

## Module Directory

| Module | What It Manages |
|---|---|
| `Auth/` | Login, signup, password recovery, OTP verification |
| `Feed/` | The vertical snap-scroll video/content feed |
| `School/` | School creation, management, marketplace, offers |
| `Dashboard/` | The post-login dashboard page |
| `Course/` | Course viewing and enrollment |
| `Features/` | The features landing page content and feature flags |
| `Marketing/` | Marketing pages (landing page variations, campaigns) |
| `Dashboard/` | User dashboard home |
| `Planner/` | Study planner / schedule feature |
| `RentLab/` | Rent-a-lab hardware/simulation booking |
| `Certification/` | Certificates and credential management |
| `Chatroom/` | Real-time chat between learners/instructors |
| `Competition/` | Hackathons and coding competitions |
| `CourseSupport/` | Q&A and support threads within a course |
| `HelpSupport/` | General help centre and support tickets |
| `Library/` | Resource library (papers, links, files) |
| `Research/` | Research hub for academic content |
| `Specialization/` | Learning tracks / specialization paths |
| `System/` | Internal system utilities (health checks, admin tools) |
| `Tutorials/` | Step-by-step tutorials content |

---

## What Each Sub-folder Does (Universal Reference)

### `api/`
Contains plain async functions (NOT hooks) that call the backend API.
```typescript
// Example:
export async function fetchSchoolList(): Promise<School[]> {
  return apiClient.get('/schools/');
}
```
These functions have no React or TanStack Query involvement. They are pure
data-fetching / data-mutating functions.

### `hooks/`
Wraps the `api/` functions with TanStack Query's `useQuery` and `useMutation`
hooks. Components import hooks, not raw API functions.
```typescript
// Example:
export function useSchoolList() {
  return useQuery({ queryKey: schoolQueryKeys.list(), queryFn: fetchSchoolList });
}
```

### `views/`
Full page-level React components. These are what the router renders for a URL.
They import hooks, compose components, and render the complete page UI.
Think of views as the "screens" of the app.

### `types/`
TypeScript interfaces and types for this module's data models:
```typescript
interface School { id: string; name: string; ownerUserId: string; ... }
```

### `context/`
Module-scoped React Contexts — state that needs to be shared within the module
but doesn't need to go all the way up to global contexts.

### `routing/`
- `guards/` — functions or components that protect routes (redirect if no permission).
- `hooks/` — hooks that help with navigation within the module.

### `utils/`
Pure functions specific to this module (formatting, transformation, calculations).
No React, no API calls — just logic.

### `features/`
Complex UI sub-features that are too large for `components/` but don't fit neatly
into `views/`. Often contain their own nested component trees.

### `index.ts`
The module's **public interface**. Only things exported from here should be used
by code outside the module. Everything else is an internal implementation detail.
````
