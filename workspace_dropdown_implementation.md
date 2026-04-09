# Workspace Dropdown Implementation (Admin Portal)

This document provides a detailed overview of the design, implementation, and functionality of the **Dynamic Workspace Manager** inside the Admin Portal. The workspace switcher allows users to navigate between workspaces such as **Documentation**, **Group Chats**, **Notes**, and **custom user-created workspaces**.

---

## 1. Architectural Overview

The Workspace Manager spans the full stack:

| Layer | File | Purpose |
|---|---|---|
| **Backend Route** | `backend/app/routes/workspaces.py` | FastAPI CRUD endpoints (GET, POST, PATCH) |
| **Database** | MongoDB `portal_workspaces` collection | Persistent workspace storage with unique slug index |
| **Seed Script** | `backend/scripts/seed_workspaces.py` | Seeds the default "Documentation" workspace |
| **Switcher UI** | `portal/src/components/WorkspaceSwitcher.tsx` | API-driven dropdown with inline rename |
| **Layout Shell** | `portal/src/components/WorkspaceLayout.tsx` | Shared visual shell (navbar + sidebar + content) |
| **Generic Sidebar** | `portal/src/components/WorkspaceSidebar.tsx` | Empty-state sidebar for non-docs workspaces |
| **Dynamic Route** | `portal/src/app/workspace/[slug]/page.tsx` | Renders any custom workspace by slug |

### How It Connects

```
WorkspaceSwitcher (dropdown in AdminNavbar)
    │
    ├── GET  /workspaces          → fetch all workspaces
    ├── POST /workspaces          → create "New Workspace"
    ├── PATCH /workspaces/:id     → rename workspace + regenerate slug
    │
    └── router.push()
         ├── slug === "docs"      → /docs (existing route, unchanged)
         └── other slugs          → /workspace/[slug] (new dynamic route)
```

---

## 2. Database Schema

**Collection:** `portal_workspaces`

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB auto-generated primary key |
| `name` | String | Display name (e.g. "Documentation", "My Research") |
| `slug` | String (unique) | URL-safe identifier, auto-generated from name |
| `order` | Integer | Display ordering in dropdown (0-indexed, ascending) |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last modification timestamp |

**Indexes:**
- Unique index on `slug` — enforced by the seed script

**Default Seed:**
```json
{ "name": "Documentation", "slug": "docs", "order": 0 }
```

---

## 3. API Endpoints

All endpoints require authentication via `Bearer` token (uses existing `current_user` dependency).

### `GET /workspaces`
Returns all workspaces ordered by `order` ASC.

**Response:** `200 OK`
```json
[
  { "id": "...", "name": "Documentation", "slug": "docs", "order": 0, "created_at": "...", "updated_at": "..." },
  { "id": "...", "name": "My Research", "slug": "my-research", "order": 1, "created_at": "...", "updated_at": "..." }
]
```

### `POST /workspaces`
Creates a new workspace. Auto-generates a unique slug from the name and appends to the end of the order list.

**Body:** `{ "name": "New Workspace" }`
**Response:** `200 OK` — returns the created workspace object

### `PATCH /workspaces/:id`
Renames a workspace and regenerates its slug. The "docs" workspace is **locked** and cannot be renamed (returns `403`).

**Body:** `{ "name": "Updated Name" }`
**Response:** `200 OK` — returns `{ id, name, slug, updated_at }`

**Slug Generation Rules:**
1. Lowercase the name
2. Strip non-alphanumeric characters (except spaces and hyphens)
3. Replace spaces with hyphens
4. Collapse consecutive hyphens
5. If slug already exists, append `-2`, `-3`, etc.

---

## 4. WorkspaceSwitcher Component — How It Works

### Data Flow (on mount)
1. Component mounts → calls `GET /workspaces`
2. While fetching, renders **skeleton loaders** (3 animated placeholder items matching dropdown item height)
3. On success, stores workspaces in local state and renders the dynamic list

### Active Workspace Detection
The active workspace is determined by reading `usePathname()`:

| Current URL | Matched Workspace |
|---|---|
| `/docs`, `/docs/some-page` | Workspace with `slug === "docs"` |
| `/workspace/my-research` | Workspace with `slug === "my-research"` |
| Any other path | Falls back to first workspace in list |

### Navigation
Clicking a workspace in the dropdown triggers:
```typescript
if (ws.slug === 'docs') router.push('/docs');
else router.push(`/workspace/${ws.slug}`);
```

### Adding a Workspace
Clicking **"+ Add Workspace"** at the bottom of the dropdown:
1. Sends `POST /workspaces` with `{ name: "New Workspace" }`
2. Refreshes the workspace list from the API
3. Navigates to `/workspace/[new-slug]`
4. Closes the dropdown

A loading spinner replaces the `+` icon during creation.

### Inline Rename (Double-Click)
Double-clicking a workspace name in the dropdown:
1. Replaces the text with an `<input>` pre-filled with the current name
2. The input is auto-focused and text is selected
3. **On Enter or blur:** calls `PATCH /workspaces/:id` with the new name
4. Uses **optimistic update** — the name changes instantly in the UI, and slug updates after the API responds
5. If the user is currently viewing that workspace, the route automatically redirects to the new slug
6. **Locked:** The "docs" workspace ignores double-click (cannot be renamed)
7. **On Escape:** cancels editing without saving

---

## 5. Dynamic Workspace Page (`/workspace/[slug]`)

This route handles all non-docs workspaces. It:

1. Reads the `[slug]` parameter from the URL
2. Fetches all workspaces from `GET /workspaces` and finds the matching one
3. If not found → renders a **404 state** with a link back to Documentation
4. If found → renders using `WorkspaceLayout` + `WorkspaceSidebar`

### Layout Structure
The page uses the exact same visual layout as the Documentation workspace:

```
┌──────────────────────────────────────────────────────┐
│  AdminNavbar (with WorkspaceSwitcher)                │
├─────────────┬────────────────────────────────────────┤
│  Workspace  │   Content Area                         │
│  Sidebar    │   ┌─────────────────────────────┐      │
│             │   │  Breadcrumb: Workspaces > X │      │
│  "No pages  │   │                             │      │
│   yet..."   │   │  [Workspace Name]           │      │
│             │   │  "This workspace is empty.  │      │
│             │   │   Start by creating a page  │      │
│             │   │   in the sidebar."          │      │
│             │   └─────────────────────────────┘      │
└─────────────┴────────────────────────────────────────┘
```

### Key Design Decisions
- `WorkspaceSidebar.tsx` is a **generic** component — it does NOT import or duplicate DocsSidebar's tree logic
- It matches DocsSidebar's visual dimensions: same width, resize handle, header structure, and CSS variables
- `WorkspaceLayout.tsx` extracts just the outer shell (navbar + sidebar slot + `<main>` area)
- The existing `/docs` route is **completely untouched**

---

## 6. Files Created / Modified

### Created
| File | Description |
|---|---|
| `backend/app/routes/workspaces.py` | GET, POST, PATCH endpoints for workspace CRUD |
| `backend/scripts/seed_workspaces.py` | Seeds default "Documentation" workspace in MongoDB |
| `portal/src/components/WorkspaceLayout.tsx` | Shared layout shell (navbar + sidebar + content) |
| `portal/src/components/WorkspaceSidebar.tsx` | Generic empty-state sidebar for new workspaces |
| `portal/src/app/workspace/[slug]/page.tsx` | Dynamic route for custom workspaces |

### Modified
| File | Change |
|---|---|
| `backend/app/main.py` | Added `workspaces` import + `app.include_router(workspaces.router, prefix='/workspaces')` |
| `portal/src/components/WorkspaceSwitcher.tsx` | Replaced hardcoded array with API-driven data layer + inline rename + add workspace |

### NOT Touched
- `AdminNavbar.tsx` — unchanged
- `/docs` route and all its internals — unchanged
- `DocsSidebar.tsx` — unchanged
- Auth, middleware, CSS variables — unchanged
