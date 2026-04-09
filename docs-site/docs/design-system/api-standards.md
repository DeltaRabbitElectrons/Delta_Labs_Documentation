---
title: 02-design-system/api-standards
sidebar_label: 02-design-system/api-standards
---

# API Standards

> **Focus**: REST conventions, auth, DataContext, rate limiting  
> **Relevant to**: Backend and frontend integration

---

## 📋 Overview

This document defines **API-related standards** for Delta Labs: how backends expose endpoints and how the frontend consumes them. It complements the [API Reference](/api-reference/api-reference), which describes specific endpoints and contracts.

---

## 🌐 RESTful Conventions

| Method | Typical use |
|--------|-------------|
| **GET** | Read single resource or list (id in path or query) |
| **POST** | Create resource or run action (e.g. enroll, submit) |
| **PUT** / **PATCH** | Update resource (prefer PATCH for partial updates) |
| **DELETE** | Remove resource |

- **Paths**: Use nouns for resources (e.g. `/modules/courses`, `/modules/courses/:id`).
- **Responses**: Use consistent JSON shape (e.g. `{ data }` or `{ items, total, page }` for lists).
- **Status codes**: 200/201 for success, 400 for validation, 401/403 for auth, 404 for not found, 429 for rate limit, 500 for server error.

---

## 🔐 Authentication & Authorization

- **Transport**: Prefer HTTPS; send tokens via `Authorization: Bearer <token>` or secure, httpOnly cookies.
- **Scope**: Require auth for all protected routes; don’t rely on “hidden” URLs.
- **Errors**: Return 401 for missing/invalid token, 403 when the user is authenticated but not allowed.
- **Frontend**: Attach the token (or rely on cookies) on every request to protected APIs; handle 401/403 with redirect or re-login.

---

## 📦 DataContext & Frontend State

- **DataContext** (or module-specific context) holds data returned by the API (e.g. course list, user profile).
- **Update pattern**: Backend returns JSON → frontend updates context (e.g. dispatch or setState) → components that use context re-render.
- **Loading and errors**: Keep `isLoading` and `error` in context and surface them in the UI.
- **Caching**: Use a consistent strategy (e.g. refetch on focus, SWR, or explicit “refresh”) and align with [Delta Labs System Architecture](/architecture/full-system-architecture) (§4, §5).

---

## 🤖 AI Event Integration

When the backend drives navigation or UI via “AI” or “chat” endpoints:

- **Contract**: Define a clear JSON shape for “navigate” and “update_data” (or equivalent) so frontend and backend agree.
- **Idempotency**: Where it matters (e.g. mutations triggered by AI), use idempotency keys or idempotent operations.
- **Logging**: Log AI/chat requests and high-level outcomes (e.g. intent, target module) for debugging and analytics; avoid logging full PII or secrets.

---

## ⚡ Rate Limiting & Caching

### Rate limiting

- **Backend**: Apply limits per user or IP on auth, AI/chat, and mutation endpoints; return 429 when exceeded.
- **Headers**: Optionally send `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` so the frontend can adapt.
- **Frontend**: On 429, show a “too many requests” message and back off before retrying; see [API Reference → Rate Limiting](/api-reference/api-reference#-rate-limiting).

### Caching

- **GET** responses can be cached (in-memory, Redis, or via HTTP cache headers) where freshness allows.
- **Mutations** should invalidate or update relevant cached data so the UI stays consistent.

---

## 📖 See Also

- [API Reference](/api-reference/api-reference) — endpoints, auth, errors, rate limits.
- [Delta Labs System Architecture](/architecture/full-system-architecture) — API (§4.4) and data model (§5).
- [Best Practices → Security](/best-practices/best-practices#3-security) — auth and input safety.