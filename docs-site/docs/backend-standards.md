---
title: Backend Standards
sidebar_label: Backend Standards
---

title: **Delta Labs Backend Standards**

Delta Labs Backend Standards (FastAPI + MongoDB)

\> **Version**: 1.0.0

\> **Status**: Official — All backend code MUST follow this document

\> **Scope**: FastAPI, MongoDB, Redis, REST API design (no AI-specific logic)

\---

# 1\. Backend Stack & Principles

## 1.1 Stack

## Python 3.11+

FastAPI

Pydantic / pydantic-settings

Motor (MongoDB)

redis-py (Redis)

Uvicorn / Gunicorn for serving

## 1.2 Principles

## Clear layering: Route → Service → Repository → MongoDB.

Domain-oriented: Each product area has a dedicated domain package.

MongoDB-only for domain data.

Idempotent critical operations: Enrollment, bookings, orders use idempotency keys.

Stateless services: All persistent state is in MongoDB or Redis.

\---

# 2\. Project Layout

```
backend/

├── app/

│   ├── api/

│   │   ├── v1/

│   │   │   ├── auth.py

│   │   │   ├── feed.py

│   │   │   ├── schools.py

│   │   │   ├── courses.py

│   │   │   ├── enrollments.py

│   │   │   ├── planner.py

│   │   │   ├── certification.py

│   │   │   ├── chatroom.py

│   │   │   ├── tutorials.py

│   │   │   ├── research.py

│   │   │   ├── competitions.py

│   │   │   ├── specialization.py

│   │   │   ├── library.py

│   │   │   ├── course_support.py

│   │   │   ├── rent_lab.py

│   │   │   └── help_support.py

│   │   └── deps.py

│   ├── core/

│   │   ├── config.py

│   │   ├── security.py

│   │   └── exceptions.py

│   ├── domain/

│   │   ├── identity/

│   │   ├── school/

│   │   ├── course/

│   │   ├── learning/

│   │   ├── content/

│   │   ├── engagement/

│   │   ├── planner/

│   │   ├── certification/

│   │   ├── chatroom/

│   │   ├── tutorials/

│   │   ├── research/

│   │   ├── competitions/

│   │   ├── specialization/

│   │   ├── library/

│   │   ├── course_support/

│   │   ├── rent_lab/

│   │   └── help_support/

│   ├── infra/

│   │   ├── database.py

│   │   ├── redis_client.py

│   │   └── http_client.py

│   ├── jobs/

│   │   └── workers.py

│   └── main.py

├── tests/

│   ├── unit/

│   └── integration/

├── migrations/

├── pyproject.toml

└── .env.example
```

# 3\. Layer Responsibilities

## 3.1 API Layer

`app/api/v1/*.py`)

Parse HTTP requests and validate via Pydantic.

Inject dependencies:

`AsyncIOMotorDatabase` via `get_db`.

`User` via `get_current_user`.

Call one service function per endpoint.

Map domain exceptions to HTTP responses using a consistent error format.

## 3.2 Domain Layer

`app/domain/*`)

For each domain (e.g., `course`, `school`, `content`):

\`\`\`text

domain/\[name\]/

├── [schemas.py](http://schemas.py) # Pydantic models (requests, responses, entities)

├── [repository.py](http://repository.py) # MongoDB access (Motor)

└── [service.py](http://service.py) # Business logic and orchestration

\`\`\`

Responsibilities:

`schemas.py`:

Define Pydantic models for inputs/outputs and internal entities.

`repository.py`:

Use Motor to perform MongoDB queries.

Never contain business logic beyond simple filters.

`service.py`:

Enforce business rules and invariants.

Coordinate multiple repositories and transactions.

## 3.3 Infra Layer

`app/infra/*`)

DB connection factories (MongoDB).

Redis client setup.

HTTP clients for external APIs (if any).

\---

# 4\. Domain Standards

## 4.1 Content & Engagement (Feed)

Collections:

`content_items`, `content_media`, `content_simulations`,

`likes`, `favorites`, `comments`, `shares`, `view_events`.

Responsibilities:

`ContentService`:

Build feed pages (cursor-based pagination, filtering).

Optionally aggregate lightweight engagement stats.

`EngagementService`:

Record likes, favorites, comments, shares, views.

Enforce basic anti-abuse rules (rate limiting delegated to infra).

## 4.2 School

Collections:

`schools`, `school_staff`, `departments`, `classes`, `school_resources`,

`school_labs`, `school_finance`, `school_transport`, `school_plans`, `school_schedules`.

Responsibilities:

`SchoolService`:

Create/update schools.

Manage staff & structure.

Enforce ownership and role-based access.

## 4.3 Course & Learning

Collections:

`courses`, `course_sections`, `lessons`, `course_resources`, `course_roadmaps`,

`enrollments`, `enrollment_progress`, `course_scores`.

Responsibilities:

`CourseService`:

CRUD for courses & curriculum.

Manage course roadmap and sections.

`LearningService`:

Enrollment logic and validation.

Progress updates and completion.

Basic scoring and status transitions.

## 4.4 Other Domains

`planner`: `study_plans`, `plan_items`.

`certification`: `certificates`, `certificate_templates`.

`chatroom`: `chatrooms`, `chat_messages`.

`tutorials`: `tutorial_offers`, `tutorial_sessions`.

`research`: `research_projects`, `research_docs`.

`competitions`: `competitions`, `competition_rounds`, `competition_scores`.

`specialization`: `specialization_tracks`, `specialization_enrollments`.

`library`: `library_items`, `library_collections`.

`course_support`: `course_tickets`, `course_faqs`.

`rent_lab`: `labs`, `lab_availability`, `lab_bookings`.

`help_support`: `support_tickets`, `support_articles`.

Each domain follows the same structure and layering rules as above.

\---

# 5\. API Design

## 5.1 URL & Versioning

All URLs under `/v1`.

Resource-based naming:

`/v1/courses`, `/v1/schools`, `/v1/feed/stream`, `/v1/enrollments`.

Action endpoints only when resource mapping is not natural:

`/v1/orders/{id}/cancel`.

## 5.2 Pagination

Cursor-based pagination for lists that may exceed 100 items.

Response shape:

```
{

  "items": [],

  "total": 0,

  "next_cursor": null,

  "has_more": false

}
```

## 5.3 Idempotency

Critical endpoints accept an `Idempotency-Key` header.

Implementation stores response metadata in Redis keyed by that value.

On duplicate keys, return the stored response without re-running the logic.

\---

# 6\. Error Handling

## 6.1 Domain Exceptions

Define base classes in `core/exceptions.py`:

`DeltaLabsBaseError`.

Domain-specific errors (e.g., `CourseNotFoundError`, `AlreadyEnrolledError`, `InsufficientPermissionsError`).

## 6.2 HTTP Mapping

Global exception handler maps domain errors to structured HTTP JSON:

`code`, `message`, `requestId`, `details`.

Standard HTTP status usage:

`400` for validation/business-rule failures.

`401` for unauthenticated.

`403` for unauthorized.

`404` for not found.

`409` for conflicts.

`429` for rate limiting.

`500` for unexpected errors.

\---

# 7\. Configuration & Secrets

Use `pydantic-settings` in `core/config.py` for configuration.

All config from environment variables:

Mongo URI, DB name.

Redis URL.

JWT secrets, token expiry.

No secrets in code or committed files.

`.env.example` documents required variables with placeholder values only.

\---

# 8\. Testing

Unit tests:

Service layer logic for each domain.

Use mocks for repositories and external dependencies.

Integration tests:

Full request/response via FastAPI test client.

Use isolated MongoDB and Redis instances or test URIs.

Coverage target:

80%+ lines for domain and API layers.

\> **Rule:** Every new service function and API endpoint must have at least one test.

\---

# 9\. Logging & Observability

Structured JSON logging including:

`timestamp`, `level`, `service`, `request_id`, `user_id?`, and relevant fields.

Key metrics:

Request rate and latency per endpoint.

Error rates per endpoint.

MongoDB query times and index usage.

Business metrics like enrollments, lab bookings, and feed interactions.

\---

# 10\. Summary

This document defines how we build the backend: structure, domain boundaries, and API standards.

It works side-by-side with:

`Delta Labs System Architecture` (high-level picture).

`Delta Labs Frontend Standards` (SPA rules).

Global engineering standards (AI, infra, security, and detailed cross-cutting rules).
