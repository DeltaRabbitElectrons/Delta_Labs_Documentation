---
title: Ws:Explanation:Readmec
sidebar_label: Ws:Explanation:Readmec
id: readmec
---

````
# src/components/ — Shared UI Components

**Location:** `deltalabs-frontend/src/components/`
**Type:** Reusable React Component Library

---

## What It Does

Contains every **shared, reusable UI component** in the application. Components here
are used by multiple pages or modules — they are not specific to one feature.

## Sub-folder Structure

```
src/components/
├── navigation/     ← App shell, top nav, sidebars, layout wrappers
├── system/         ← App-wide system UI (loading bars, global overlays)
├── theme/          ← Primitive UI design-system components (Button, Input, Card, etc.)
└── features/       ← Feature-specific shared components (auth forms, feed cards, school UI)
    ├── auth/       ← Auth form primitives shared by login/signup/recover pages
    ├── feed/       ← Feed video player primitives and interaction components
    └── school/     ← School management UI primitives (cards, modals, tables)
```

---

## navigation/

The **application shell** components — the persistent chrome that surrounds every
authenticated page.

| Component | Purpose |
|---|---|
| `AppShell.tsx` | The outer authenticated layout: sidebar + top nav + main content area. |
| `TopNav.tsx` | The full top navigation bar (search, logo, utility actions). |
| `TopNavAuthActions.tsx` | The login/signup buttons shown in the top nav on public pages. |
| `TopNavCategoryTabs.tsx` | The horizontal category tab strip below the top nav. |
| `TopNavUtilityActions.tsx` | Right side of nav: notifications, docs link, profile dropdown. |
| `FeatureBrowserTabBar.tsx` | The horizontal tab bar for switching between major feature areas. |
| `PublicHeader.tsx` | Minimal header used on public (unauthenticated) pages. |
| `PublicLayoutShell.tsx` | Full shell for public pages: `PublicHeader` + content + footer. |
| `ThemeToggle.tsx` | The light/dark mode toggle button. |
| `LandingFeaturesIconSwitch.tsx` | Icon switcher animation used on the landing page hero. |

---

## system/

Small but globally important UI components.

| Component | Purpose |
|---|---|
| `GlobalAuthPendingBar.tsx` | A top-of-screen loading bar shown while an auth operation (login/logout) is in progress. |

---

## theme/

The **design system primitive components** — the raw building blocks all other UI is
built from. These are the lowest-level, most reusable UI pieces.

| Component | Purpose |
|---|---|
| `Button.tsx` | The standard button with all variants (primary, secondary, ghost, destructive). |
| `ButtonLink.tsx` | A button that renders as a `<Link>` (navigates without a full page reload). |
| `Input.tsx` | Single-line text input field. |
| `Textarea.tsx` | Multi-line text input field. |
| `Select.tsx` | Dropdown selection field. |
| `SearchInput.tsx` | Input field with a search icon and clear button. |
| `Field.tsx` | Wraps an input with a label, helper text, and error message. |
| `Checkbox.tsx` | Styled checkbox input. |
| `RadioGroup.tsx` | Group of radio button options. |
| `Card.tsx` | Surface container with optional header, body, and footer. |
| `Dialog.tsx` | Accessible modal dialog. |
| `StatusBanner.tsx` | Alert/notification banner (success, error, warning, info). |
| `Table.tsx` | Data table with header, rows, and optional sorting. |
| `Typography.tsx` | Heading and paragraph text components with correct semantic HTML. |
| `buttonStyles.ts` | CSS class utilities shared by `Button` and `ButtonLink`. |
| `utils.ts` | Small helper functions for the theme components (e.g. `cn()` class merging). |

---

## features/

Components shared across multiple views **within a specific feature domain** but
not generic enough to be in `theme/`. Each sub-folder mirrors one feature module.

See individual sub-folder READMEs for details.
````
