---
title: Api Reference
sidebar_label: Api Reference
---

# Delta Labs - API Reference

> **Version**: 1.0.0  
> **Last Updated**: 2026-01-25  
> **Status**: Reference for backend/frontend contract

* * *

## 📋 Base URL & Authentication

### Base URL

Use the environment-defined API base (e.g. `VITE_API_URL` or `API_BASE_URL`). Do not hardcode production URLs in the frontend.

```text
# Example (replace with your config)
https://api.deltalabs.example.com/v1
```

### Authentication

-   **Authenticated endpoints** require a token (e.g. Bearer JWT) or session cookie, depending on your backend.
    
-   **Header** (typical): `Authorization: Bearer <token>`.
    
-   Obtain the token via your auth flow (e.g. login/register endpoints); see [Auth Context](/overview/project-analysis#context-providers) in the project analysis.
    

* * *

## 📡 Core Endpoints (Conceptual)

These are **representative** endpoint groups. Exact paths and methods depend on your backend implementation.

Purpose

Method

Path (example)

Description

AI / chat

POST

`/chat` or `/ai/navigate`

Send user message, get navigation + optional update\_data

Course list

GET

`/modules/courses`

List courses (with filters, pagination)

Course detail

GET

`/modules/courses/:id`

Single course by id

Enrollment

POST

`/modules/courses/:id/enroll`

Enroll user in course

Labs list

GET

`/modules/labs`

List labs

Labs detail

GET

`/modules/labs/:id`

Single lab by id

Add or adjust entries to match your real API; this table is a template for structure and naming.

* * *

## ⚠️ Error Handling

### HTTP status codes

Code

Meaning

200

Success

201

Created

400

Bad request (validation, invalid params)

401

Unauthorized (missing or invalid auth)

403

Forbidden (no permission)

404

Not found

429

Too many requests (rate limit)

500

Server error

### Response shape (typical)

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "OPTIONAL_ERROR_CODE",
  "details": {}
}
```

Frontend should handle 4xx/5xx and surface `message` (or a fallback) to the user.

* * *

## ⚡ Rate Limiting

Apply rate limits per user or IP to protect the backend. Example ranges (adjust to your needs):

Endpoint type

Example limit

Create/Update/Delete

20 requests/minute per user

List (e.g. courses, labs)

100 requests/minute per user

Detail (single item)

200 requests/minute per user

AI / chat

60 requests/minute per user

When the backend returns **429**, the frontend should:

-   Show a “too many requests” message.
    
-   Use exponential backoff or wait before retrying.
    
-   Optionally respect headers like `Retry-After` or `X-RateLimit-Remaining` if your backend sends them.
    

* * *

## 📦 Module Types

Delta Labs organizes content into **modules**. APIs often expose one “list” and one “detail” endpoint per module:

Module

List endpoint (example)

Description

courses

`/modules/courses`

Courses and learning content

schools

`/modules/schools`

Institutions and providers

labs

`/modules/labs`

Labs and hands-on projects

certifications

`/modules/certifications`

Credentials and achievements

research

`/modules/research`

Research and R&D

offers

`/modules/offers`

Jobs and career-related offers

Use the same module naming in frontend routing and context so they stay aligned with the API.

* * *

## ✅ Common Patterns

-   **Auth**: Send `Authorization` (or required cookie) on every authenticated request.
    
-   **Validation**: Validate query/body on backend; frontend should validate before submit to improve UX.
    
-   **Caching**: Cache GET responses where appropriate (e.g. SWR, React Query, or simple in-memory cache).
    
-   **Pagination**: Use `page`, `limit` (or `offset`/`cursor`) consistently and document in each list endpoint.
    
-   **429**: Handle rate limits with backoff and user feedback; avoid tight retry loops.
    

* * *

## 📖 See Also

-   [API Standards](/design-system/api-standards) — REST, auth, and conventions.
    
-   [Delta Labs System Architecture](/architecture/full-system-architecture) — API surface (§4.4), data flow, and data model.
    
-   [Project Analysis](/overview/project-analysis) — modules and contexts.
