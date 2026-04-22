---
title: Ws:Explanation:Readmenav
sidebar_label: Ws:Explanation:Readmenav
id: readmenav
---

````markdown
# src/components/navigation/ — Application Shell & Navigation

**Location:** `deltalabs-frontend/src/components/navigation/`
**Type:** Layout / Shell Components

---

## Overview

These components form the **persistent UI frame** of the application — the parts
that stay on screen while the page content changes. Think of them as the building
that pages live inside.

---

## AppShell.tsx

The master authenticated layout container. It composes:
- The sidebar (or icon rail for collapsed state).
- The `TopNav` at the top.
- A `<main>` scrollable area where the current page renders (`children`).

Every authenticated page is wrapped by this. It handles the collapsible sidebar
state and adjusts the main content width accordingly.

---

## TopNav.tsx

The full top navigation bar. It orchestrates three zones:
1. **Left:** Logo and (on mobile) a hamburger menu.
2. **Centre:** The global search bar.
3. **Right:** `TopNavUtilityActions` (notifications, help, profile).

---

## TopNavAuthActions.tsx

The **login** and **sign up** buttons rendered in the top nav on public pages.
On authenticated pages this area is replaced by the profile dropdown.

---

## TopNavCategoryTabs.tsx

A horizontal strip of category tabs below the main nav bar.
Allows users to jump between high-level content categories (e.g. Courses, Labs, Research).
Reads and writes `FeatureTabs_Context`.

---

## TopNavUtilityActions.tsx

The right-hand cluster of the top nav:
- **Notifications bell** — shows unread count badge, opens notification panel.
- **Documentation link** — quick link to docs.
- **Profile dropdown** — avatar, display name, links to settings/profile, logout button.

This is one of the largest navigation components because the profile dropdown
contains a significant amount of UI.

---

## FeatureBrowserTabBar.tsx

The horizontal tab bar that appears when browsing features/content categories.
Each tab represents a major platform feature (Feed, School, Labs, etc.).
Synced with `FeatureTabs_Context` so the active tab persists across re-renders.

---

## PublicHeader.tsx

A stripped-down header for public pages (landing, login, signup). Contains:
- The DeltaLabs logo.
- Navigation links.
- `TopNavAuthActions` (login/signup buttons).

No sidebar. No search. Just the essentials.

---

## PublicLayoutShell.tsx

The full layout wrapper for public pages. Renders:
- `PublicHeader` at the top.
- `{children}` (the actual page content).
- A footer with links and copyright.

---

## ThemeToggle.tsx

A button (usually a sun/moon icon) that calls `toggleTheme()` from `Theme_Context`.
Can be placed anywhere in the UI — currently used in the top nav utility area.

---

## LandingFeaturesIconSwitch.tsx

A small animated component on the landing page that cycles through icons of the
platform's key features to visually showcase them in the hero section.

---

## index.ts

Re-exports all navigation components for clean imports:
```typescript
import { AppShell, TopNav, ThemeToggle } from '@/components/navigation';
```
````
