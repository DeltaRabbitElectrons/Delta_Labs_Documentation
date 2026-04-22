---
title: Ws:Explanation:Readmecontext
sidebar_label: Ws:Explanation:Readmecontext
id: readmecontext
---

```markdown
# src/contexts/ — React Context Providers

**Location:** `deltalabs-frontend/src/contexts/`
**Type:** Global React Contexts

---

## What It Does

This folder contains React Context providers that need to be accessible from
**anywhere in the application** — not just within a single module.

## Why Contexts?

React Context solves the "prop drilling" problem: instead of passing data through
every layer of components from top to bottom, you put data into a Context at a
high level and any component anywhere in the tree can access it directly.

## Files Overview

| File | Purpose |
|---|---|
| `AuthSession_Context.tsx` | Stores and provides the current logged-in user's session data everywhere. |
| `FeatureTabs_Context.tsx` | Manages which feature tab is currently active in the `FeatureBrowserTabBar`. |
| `Theme_Context.tsx` | Stores the current theme (`"light"` or `"dark"`) and provides the toggle function. |
| `index.ts` | Re-exports all contexts for clean imports. |

---

## AuthSession_Context.tsx

**What it provides to the tree:**
- `user` — the current user's profile object (name, email, avatar, role, etc.).
- `isAuthenticated` — boolean, true if there is a valid session.
- `sessionStatus` — `"loading"`, `"authenticated"`, or `"unauthenticated"`.
- `logout()` — function to clear the session and redirect to login.
- `refreshSession()` — function to re-fetch the user profile from the API.

**How it works:**
On mount, it reads the session from storage (`authSession.ts`), fetches the fresh
user profile from the API, and makes it all available via context.

---

## FeatureTabs_Context.tsx

**What it provides:**
- `activeTab` — which tab is currently selected in the horizontal feature browser bar.
- `setActiveTab(tab)` — function to change the active tab.

Used by `FeatureBrowserTabBar` (navigation) and the feature page to stay in sync
without prop drilling through multiple layout levels.

---

## Theme_Context.tsx

**What it provides:**
- `theme` — `"light"` or `"dark"`.
- `toggleTheme()` — switches between light and dark mode.
- `setTheme(theme)` — sets a specific theme.

**How it works:**
Reads the saved theme preference from `localStorage` on first load. Applies the
current theme by adding a class (`data-theme="dark"`) to the `<html>` element,
which activates the corresponding CSS custom property values in `design-tokens.css`.

---

## Mental Model

Contexts are like a building's PA system. Instead of someone walking to each desk
to deliver a message (prop drilling), they announce it once over the speakers and
anyone who needs to hear it can listen.
```
