---
title: Ws:Explanation:Readmelib
sidebar_label: Ws:Explanation:Readmelib
id: readmelib
---

```markdown
# src/lib/ — Infrastructure & Utilities

**Location:** `deltalabs-frontend/src/lib/`
**Type:** Shared infrastructure helpers

---

## What It Does

This folder is the **engine room** of the frontend. It contains all the low-level
plumbing that the rest of the application depends on — the API client, query config,
auth utilities, and configuration values.

## Files Overview

| File | Purpose |
|---|---|
| `apiClient.ts` | The central HTTP client. All API calls to the backend go through here. |
| `apiClient.types.ts` | TypeScript types for the API client's request/response shapes. |
| `QueryProvider.tsx` | Wraps the app with TanStack Query's `QueryClientProvider`. |
| `queryClient.ts` | Creates and configures the TanStack Query client instance. |
| `queryKeys.ts` | Defines global/shared query key factories (used across multiple modules). |
| `config.ts` | Reads and exports environment variables (API URL, feature flags, etc.). |
| `authDisplay.ts` | Helper functions that format auth-related data for display (e.g. user display name). |
| `authErrors.ts` | Maps raw API error responses to user-friendly error messages. |
| `authGuards.ts` | Functions that check whether the user has permission to do something. |
| `authRedirect.ts` | Helper that determines where to redirect after login/logout. |
| `authSession.ts` | Reads and writes the user's session (token, user object) from storage. |
| `authSession.test.ts` | Unit tests for `authSession.ts`. |

## Mental Model

If the UI components are the "face" of the app and the modules are the "departments",
then `src/lib/` is the "IT infrastructure" — internet, email, security, and config.
Everything depends on it, but most of the time it just works invisibly in the background.
```
