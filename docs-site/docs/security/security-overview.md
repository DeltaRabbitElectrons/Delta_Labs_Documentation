---
title: Security Overview
sidebar_label: Security Overview
---

# Security Overview

Trust and safety: how we approach security. Security docs are credibility.

---

## Authentication & Authorization

- **Tokens** — store tokens securely (e.g. httpOnly cookies or in-memory); avoid long-lived tokens in `localStorage` if the threat model requires it.
- **Permissions** — enforce authorization on every protected endpoint; don't rely only on hiding UI.
- **Sessions** — invalidate or refresh sessions on password change and logout.

---

## Injection and Input

- **Parameterized queries / ORM** — never build SQL or NoSQL from string concatenation with user input.
- **Sanitization** — sanitize inputs that affect HTML, redirects, or file paths to prevent XSS and related issues.
- **Rate limiting** — apply rate limits per user/IP on auth, AI, and mutation endpoints; see [API Reference](/api-reference/api-reference#rate-limiting).

---

## Sensitive Data

- **Secrets** — keep API keys and DB credentials in environment variables or secret managers; never commit them.
- **Logs** — do not log passwords, tokens, or PII in plain text.

---

## 📖 See Also

- [Authentication](./authentication) — how users and services authenticate.
- [Authorization](./authorization) — RBAC, roles, permissions, schemas, APIs, organizations, Delta Labs role set.
- [Secrets Management](./secrets-management) — storage and rotation.
- [API Standards](/design-system/api-standards) — REST, auth, and conventions.