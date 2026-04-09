---
title: Delta Labs System Architecture
sidebar_label: Delta Labs System Architecture
---

# Delta Labs System Architecture

**Classification:** Architecture — Single source of truth  
**Audience:** Engineering, Product, Operations, Security  
**Scale target:** Global scale (tens to hundreds of millions of users).  
**Status:** Authoritative reference for frontend, backend, database (MongoDB only), AI, infrastructure, security, and operations.

---

## Document Control

| Attribute | Value |
|-----------|-------|
| **Title** | Delta Labs System Architecture |
| **Version** | 1.0 |
| **Last updated** | See [Document History](#123-document-history) |
| **Owner** | System Architecture |
| **Scope** | End-to-end: clients, edge, API, backend services, MongoDB (primary database), Redis, AI orchestration, real-time, infrastructure, security, observability, DR/HA |

---

## Table of Contents

1. [Architecture Principles & Scale Targets](#1-architecture-principles--scale-targets)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture (Python)](#4-backend-architecture-python)
5. [Database Architecture (MongoDB + Redis)](#5-database-architecture-mongodb--redis)
6. [AI Architecture](#6-ai-architecture)
7. [Infrastructure & Deployment](#7-infrastructure--deployment)
8. [Security Architecture](#8-security-architecture)
9. [Observability & Operations](#9-observability--operations)
10. [Scale & Capacity Planning](#10-scale--capacity-planning)
11. [Disaster Recovery & High Availability](#11-disaster-recovery--high-availability)
12. [Appendices](#12-appendices) (Glossary, ADR, Document History, Related Documents, Implementation Roadmap, Checklist)

---

## 1. Architecture Principles & Scale Targets

### 1.1 Principles

| Principle | Description |
|-----------|-------------|
| **Single source of truth** | Authoritative data lives in MongoDB (all core domains: identity, catalog, learning, commerce, labs, engagement, etc.). Redis for cache, sessions, queues only. No dual-write without a defined sync strategy. |
| **Backend as capability layer** | All user-facing and AI-driven actions go through the same backend services. AI invokes tools that call these services; no duplicate business logic. |
| **Design for failure** | Assume components fail; use timeouts, retries, circuit breakers, graceful degradation, and idempotency where required. |
| **Security by default** | Auth on every sensitive path; least privilege; secrets in vaults; encryption in transit and at rest; audit logging for sensitive actions. |
| **Observability first** | Every request is traced; metrics and logs are structured; SLOs/SLIs defined; alerting on symptoms and causes. |
| **Horizontal scalability** | Stateless services; scale out via added instances; databases scaled via replication, pooling, and (when needed) sharding. |
| **Modular frontend** | Single design-token and component library; features and modules consume them; no duplicate UI primitives. See [Design System](/design-system/design-intro) and [Component Library](/design-system/design-system) for tokens, theme components, and usage. |

### 1.2 Scale Targets (Design Point)

| Dimension | Target | Implications |
|-----------|--------|--------------|
| **Registered users** | Hundreds of millions | Identity and profile in MongoDB; session/cache in Redis; read-heavy profile; sharding by user_id or tenant. |
| **Concurrent users** | Tens of millions | Stateless API tier; MongoDB connection pool; CDN for static and media. |
| **Requests per second (RPS)** | Order of 100k+ aggregate | Multiple regions; load balancing; caching (Redis, CDN); async for heavy work; MongoDB sharding and read preference. |
| **Data volume** | Petabyte-scale over time | MongoDB: sharding, TTL/archiving for events; object storage for media. |
| **AI requests** | High growth, variable burst | Dedicated AI tier; queue for peaks; rate limits and cost controls per user/tenant. |

### 1.3 Non-Functional Requirements Summary

- **Availability:** 99.9%+ for core API and learning flows; 99.99% for critical paths (auth, payments) where business requires.
- **Latency:** p95 < 500 ms for standard API; p99 < 2 s for complex queries; AI first-token and full response under defined SLOs.
- **Consistency:** Strong consistency for identity, enrollments, orders, payments, grades, bookings; eventual consistency acceptable for activity feeds, analytics, recommendations.
- **Compliance:** Support for data residency, retention, and audit trails (e.g. GDPR, SOC2, education regulations).

### 1.4 Current State vs Target

| Area | Current | Target / planned |
|------|---------|------------------|
| **API & backend** | Modular monolith (Python/FastAPI), MongoDB, Redis | Same; scale out horizontally |
| **Real-time** | Not in production | WebSocket/SSE for notifications, presence, chat |
| **Multi-region** | Single region or minimal | Active-active or active-passive; host handles routing/failover |
| **AI** | Orchestrator, tools → domain services | Same; queue and rate limits for scale |
| **Frontend** | React, design tokens, theme components | Same; see [Design System](/design-system/design-intro) for components and patterns |

Implementers: treat "Target" as the architecture we design toward; "Current" may lag. When in doubt, implement to the target and flag gaps.

### 1.5 Product Scope (Module & Feature Map)

What the system must serve — frontend modules and backend domains aligned.

| Module | Features / sub-features | Main entities | Complexity |
|--------|-------------------------|---------------|------------|
| **Auth** | Login, register, forgot/reset password, OAuth (Google/Apple/GitHub/Facebook), verification, profile, preferences | User, UserPreferences, NotificationSettings, UserRole, TokenPayload | User-centric |
| **Course (core)** | Dashboard, enrolled list, catalog, wishlist, cart, recent activity | Course, Instructor, Enrollment, WishlistItem, CourseActivity | High: User↔Course |
| **Course (enrolled detail)** | Intro, Exercise, Q&A, Resources, Roadmap, Score, Summary, Supplement, Community | Per-feature entities | Very high |
| **Course — Q&A** | My questions/answers, bookmarks, wiki, live QA, notifications | Question, Answer, BookmarkedQuestion, DiscussionThread, ChatMessage | High |
| **Course — Exercise** | School/community/my exercises, take/customize/add, history, tutor | Exercise, CustomizeExerciseData, QuestionType, Difficulty | Medium |
| **Course — Score** | Grades, progress, ranking, charts, appeals | GradeItem, ChartData, ScoreProgressStats | High |
| **Course — Roadmap** | Personal/community/super roadmaps, adjust | RoadmapSection, RoadmapData | Medium |
| **Course — Summary** | Saved, my summaries, school, community, generate | Summary, Reminder, Exercise | Medium |
| **Course — Resources** | Home, cart, bag, rent, orders, sponsors | ResourceItem, Cart, CartItem, Order, Sponsor, SponsorshipRequest | Very high |
| **Course — Supplement** | Books, docs, slides, YouTube, generated | SupplementResource, SupplementType | Medium |
| **Course — Community** | Chat, discussions, study groups, events, members, notifications | ChatMessage, DiscussionThread, StudyGroup, CommunityEvent, EventRSVP, CourseMember | Very high |
| **Super-course** | Create/combine courses, sections, content items, roadmap canvas, publish | SuperCourse, CourseSection, CourseContentItem, RoadmapNode | High |
| **RentLab** | Rent, host, create lab; search, filters | Lab, LabFilters; Booking, Availability, Host | High |
| **Landing / common** | Video/audio feeds, comments, reactions, share, subscription, search, AI bot | Content feeds, comments, subscriptions | Medium |
| **Planner, Chatroom, DigitalLibrary, HelpSupport, OnlineCompetition, RnD, Specialization, Tutorials** | Planned / stubbed | — | To be designed |

**Entity relationships:** Users and courses are central. Strong relations: User↔Course (enrollment, progress, grades), Question↔Answer↔Votes, Order↔Cart↔Resource↔Sponsor, Lab↔Booking↔User, Community (threads, members, events, RSVPs). Transactions needed: enrollment+payment, cart checkout, sponsorship approval, lab booking, grade appeals, order lifecycle.

---

## 2. High-Level System Architecture

### 2.1 Logical Layers

**Diagram (SVG)** — Logical layers (Clients → Edge → Gateway → Entry points → Domain → Data). Renders in all browsers; no plugin required.

<div class="architecture-diagram-fullwidth">

<!-- ![Delta Labs logical layers diagram](./img/logical-layers.svg) -->

</div>
<!-- Alternative (ASCII) diagram omitted; see git history to restore. -->
---


### 2.2 Data Flow (Simplified)

- **Web user:** Browser → CDN (static) → API Gateway → REST API → Domain layer → MongoDB/Redis (as defined per use case). Response back along same path.
- **AI user:** Browser/app → API Gateway → AI Orchestrator → intent resolution → tool call → **same domain layer** as REST → MongoDB → tool result → LLM format → response.
- **Real-time:** Browser/app → WebSocket/SSE endpoint → real-time service → Redis pub/sub or dedicated message bus → same domain layer for persistence where needed.

### 2.3 Region & Deployment Model

- **Multi-region active-active or active-passive** for API and AI when needed; routing and failover are typically handled by the host (e.g. Vercel, AWS, Cloudflare) — no custom geo-routing required.
- **MongoDB:** Cluster(s) per region or global cluster with sharding; primary database for all domains. Replica sets for HA; read preference for scaling. See [§5](#5-database-architecture-mongodb--redis).
- **Redis:** Per-region clusters for cache and sessions; optional global replication for session portability.

### 2.4 CDN — where and how it's useful
 
A **CDN (Content Delivery Network)** is a network of edge servers that serve content from a location close to the user. You typically don't run it yourself — your host (e.g. Vercel, Cloudflare, AWS CloudFront) provides it.

**Where it's useful:**

| Use | What the CDN does | Why it helps |
|-----|-------------------|--------------|
| **Static assets** | Serves JS, CSS, images, fonts from edge caches | Faster load: user gets files from a nearby node instead of your origin. Less load on your app. |
| **Media** | Serves videos, audio, thumbnails from edge caches | Same as above; media is heavy and benefits most from edge delivery. |
| **API cache (optional)** | Caches selected GET responses (e.g. public catalog, course list) at the edge | Reduces hits to your API and DB for read-heavy, cacheable endpoints. Use only where freshness rules are clear (TTL, invalidation). |

**How it fits in the diagram:** Traffic from the client hits the CDN first. If the CDN has a cached copy (static file or cached API response), it responds directly. Otherwise it goes to your origin (API gateway / app). So "Edge & Global Traffic" in the diagram includes the CDN; the host you use (Vercel, Cloudflare, etc.) usually provides both CDN and DDoS/WAF/TLS.

**Summary:** Use the host's CDN for static assets and media; optionally for cacheable GETs. No need to build your own — the host does it.

---

## 3. Frontend Architecture

*Detailed tokens, theme components, and usage: [Design System](/design-system/design-intro), [Design System & Component Library](/design-system/design-system).*

### 3.1 Stack & Responsibilities

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Runtime** | React 18 | Component tree, hooks, concurrent features where needed. |
| **Language** | TypeScript (strict) | Types for API contracts, domain models, and component props. |
| **Build** | Vite | Dev server, production bundle, code-splitting, env injection. |
| **Styling** | Tailwind CSS | Utility-first CSS; theme extended from design tokens. |
| **Routing** | React Router | Declarative routes; lazy-loaded route chunks. |
| **State** | React Context + optional (e.g. React Query / Zustand) | Auth, theme, tab context; server state and cache via React Query or equivalent. |
| **HTTP** | Fetch or axios | Centralized client with base URL, auth header, interceptors, error mapping. |

### 3.2 Module & Feature Structure

- **Single source for design:** `src/theme/` — design tokens (colors, spacing, typography, shadows). Consumed by Tailwind config and theme components.
- **Single source for UI primitives:** `src/components/theme/` — Button, Card, Input, Modal, Spinner, ErrorBanner, Badge, Dropdown, etc. Each has one definition and a **variant/size/state API**. All features and modules import from here.
- **Feature compositions:** `src/components/features/` or per-module components — compose theme components only.

  *This follows **Atomic Design** (Brad Frost): theme primitives = atoms (and some molecules); feature compositions = molecules/organisms. One source for the smallest pieces; larger UI is built by composing them.*

- **Modules:** `src/modules/` — Auth, Course, RentLab, etc. Each module can contain: pages, feature components, hooks, types, and optional local context.
- **Common:** `src/Common/` — shared across modules (e.g. Landing page, shared layout pieces).

### 3.3 Design System (Single Source)

- **Tokens:** `src/theme/designTokens.ts` (or CSS variables): primary/secondary colours (#174A5F, #DCE5E9), surface, text, spacing scale (4px grid), typography (Poppins, Nunito Sans), radii, shadows, z-index scale. Tailwind config extends from these.
- **Theme components:** `src/components/theme/` — one folder per primitive; each exports a single component with a **variant/size/state API**. Barrel `theme/index.ts` re-exports all.
- **Feature components:** Compose theme components only. All screens and modules import from `@/components/theme` and `@/components/features/*`.

---

## 4. Backend Architecture (Python)

### 4.1 Stack & Layout

| Component | Choice | Role |
|-----------|--------|------|
| **Runtime** | Python 3.11+ | Consistency, type hints, performance. |
| **Framework** | FastAPI | Async, OpenAPI, dependency injection, validation (Pydantic). |
| **DB access** | Motor (async) or pymongo | MongoDB: single primary database; connection pool, repositories for all domains. |
| **Redis** | redis / aioredis | Cache, sessions, rate-limit counters, job queues (e.g. Celery or ARQ). |
| **Validation** | Pydantic | Request/response models; shared with OpenAPI. |
| **Auth** | JWT (e.g. PyJWT) + OAuth libraries | Token issue/verify; integration with gateway. |

### 4.2 Service Layout (Modular Monolith)

- **Preferred:** Single deployable "backend" (modular monolith) with clear **domains**: identity, catalog, learning, assessment, content, engagement, commerce, labs, AI orchestration. Each domain has: **routes**, **services** (use cases), **repositories** (data access).
- **Directory layout (conceptual):**
  - `app/api/` — route modules (auth, courses, enrollments, labs, ai, …).
  - `app/core/` — config, security, dependencies (get_db, get_current_user).
  - `app/domain/<domain>/` — services, repositories, models/schemas.
  - `app/infra/` — DB connection, Redis client, external HTTP clients.
  - `app/jobs/` — background tasks using Redis-backed queue.

### 4.3 API Design

- **REST:** Resource-oriented URLs; JSON body; standard methods (GET, POST, PUT, PATCH, DELETE). Versioning via URL prefix (e.g. `/v1/`).
- **Idempotency:** For mutations, accept `Idempotency-Key` header; store key in Redis/DB with result; return same result on replay.
- **Pagination:** Cursor-based preferred for large lists (e.g. `?cursor=&limit=20`).
- **Errors:** HTTP status + body `{ "code", "message", "requestId", "details?" }`.

### 4.4 API Surface (REST Conventions)

- **Auth:** `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/forgot-password`, `GET/POST /auth/oauth/:provider`, `GET/PATCH /users/me`, …
- **Courses:** `GET /courses`, `GET /courses/:id`, `GET /courses/:id/sections`, `POST /enrollments`, `GET /enrollments`, `GET /enrollments/:id/progress`, `PATCH /enrollments/:id/progress`, `GET/POST/DELETE /wishlist`, …
- **Enrolled detail:** `GET /courses/:id/intro`, `GET /courses/:id/questions`, `POST /courses/:id/questions`, `GET/POST /courses/:id/answers`, `GET /courses/:id/exercises`, `POST /courses/:id/exercises/:eid/submit`, `GET /courses/:id/grades`, `GET /courses/:id/roadmap`, `GET/POST /courses/:id/summaries`, `GET /courses/:id/resources`, `GET /courses/:id/supplements`, `GET /courses/:id/community/*`, …
- **Super-course:** `GET/POST /super-courses`, `GET/PATCH /super-courses/:id`, `GET/POST /super-courses/:id/sections`, `POST /super-courses/:id/publish`, …
- **Commerce:** `GET/POST/DELETE /cart`, `POST /orders`, `GET /orders`, `GET/POST /sponsors`, `POST /sponsorship-requests`, `GET/POST /financial-aid`, …
- **Labs:** `GET /labs`, `GET /labs/:id`, `GET /labs/:id/availability`, `POST /labs/:id/bookings`, `GET /bookings`, …
- **AI:** `POST /ai/chat` or `POST /ai/execute` (prompt → tool runs + optional streaming).

Versioning: prefix by major (e.g. `/v1/...`) or header `Accept: application/vnd.deltalabs.v1+json`.

---

## 5. Database Architecture (MongoDB + Redis)

### 5.1 Role of Each Store

| Store | Role | Data types | Consistency |
|-------|------|------------|-------------|
| **MongoDB** | **Primary and only database** | All core data: users, courses, enrollments, grades, orders, payments, labs, bookings, Q&A, community, AI conversations, activity events, content drafts, feature config | Strong for single-document writes; multi-document transactions where required |
| **Redis** | Cache, session, queues, rate limit | Session data, API response cache, rate-limit counters, job queues, real-time pub/sub, idempotency keys | Best-effort; data can be recreated from MongoDB |

### 5.2 MongoDB Collections (Reference — All Domains)

| Domain | Collections | Key indexes / notes |
|--------|-------------|----------------------|
| **Identity** | users, user_preferences, sessions, oauth_accounts, refresh_tokens | users: email unique, username unique; sessions: session_id, TTL |
| **Catalog** | instructors, courses, course_categories, course_levels | courses: instructor_id ref, category, level; text index title, description |
| **Learning** | enrollments, enrollment_progress, roadmap_sections, roadmap_progress | enrollments: (user_id, course_id) unique |
| **Assessment** | exercises, exercise_questions, submissions, grades, grade_items, appeals | user_id, course_id, enrollment_id |
| **Content** | course_sections, content_items, super_courses, supplement_resources, resources | parent_id / position; flexible content blocks |
| **Engagement** | questions, answers, votes, discussion_threads, community_events, event_rsvps, notifications | course_id, created_at, user_id |
| **Commerce** | carts, cart_items, orders, order_items, payments, sponsorship_requests, financial_aid_applications | Multi-doc transactions for checkout |
| **Labs** | labs, lab_availability, lab_bookings, hosts | lab_id, slot_start; transactions for booking |
| **AI / operational** | conversations, activity_events, content_drafts, feature_config | conversations: user_id, conversation_id; activity_events: TTL/shard |

### 5.3 Redis Key Patterns (Reference)

| Pattern | Key format | Value | TTL | Use |
|---------|------------|--------|-----|-----|
| **Session** | session:&#123;session_id&#125; | &#123; user_id, metadata &#125; | Session lifetime (e.g. 24h) | Auth session |
| **Cache** | cache:&#123;resource&#125;:v1:&#123;id&#125; | Serialized DTO | 5–60 min | Course, user profile, catalog |
| **Rate limit** | ratelimit:&#123;scope&#125;:&#123;id&#125; | Counter | 1 min / 1 hour | Per user/IP/tenant |
| **Idempotency** | idempotency:&#123;key&#125; | &#123; status, response? &#125; | 24h | Mutating requests |
| **Queue** | (list/stream) | Job payload | — | Background jobs |
| **Pub/Sub** | channel:notifications:&#123;user_id&#125; | Message | — | Real-time push |

---

## 6. AI Architecture

### 6.1 Principles

- **Tools = backend capabilities.** Every AI action is implemented by a **tool** that calls the same domain services used by REST. No business logic in the AI layer beyond intent resolution and formatting.
- **User-scoped and secure.** Tools receive user/session context; authorization enforced in the service layer.
- **Observable and bounded.** Log prompt, model, token usage, tool calls, latency; rate limit and cost cap per user/tenant.

### 6.2 Components

| Component | Responsibility |
|-----------|----------------|
| **AI Gateway / Orchestrator** | Receives prompt; loads conversation from MongoDB if needed; calls LLM with system prompt + tool definitions; parses tool calls; executes tools via domain services; returns/streams answer; persists turn to MongoDB. |
| **Tool registry** | Catalog of tools: name, description, parameters (JSON Schema). Examples: list_courses, enroll_user, get_my_grades, book_lab, add_to_cart, search_courses, navigate_to_route. |
| **LLM provider** | OpenAI, Anthropic, Azure OpenAI, or OSS; abstracted behind an interface. |
| **Conversation store** | MongoDB: conversation document with messages and optional tool_calls; indexed by user_id, conversation_id. |

### 6.3 Flow (Detail)

1. **Request:** `POST /v1/ai/execute` or `/v1/ai/chat` with `{ "prompt", "conversation_id?", "stream?" }`. Auth: JWT → user_id.
2. **Load context:** If conversation_id, load messages from MongoDB; else start new conversation.
3. **System prompt:** Includes product description, available tools (name + description + params), and rules.
4. **LLM call:** Send system + conversation history + user prompt; request tool_use in response.
5. **Tool execution:** For each tool_call: resolve name and arguments; validate; call domain service (with user_id); collect result.
6. **Follow-up (optional):** Send tool results back to LLM; LLM returns final natural-language answer.
7. **Persist:** Append user message and assistant message to conversation in MongoDB.
8. **Response:** Return `{ "answer", "conversation_id", "turn_id?" }` or stream SSE.

### 6.4 Tool Catalog (Reference)

| Tool name | Description (for LLM) | Parameters | Backend call |
|-----------|------------------------|------------|--------------|
| list_courses | Returns available courses with instructor, category, level | — | catalog_service.list_courses() |
| get_my_enrollments | Returns current user's enrolled courses and progress | — | learning_service.get_enrollments(user_id) |
| enroll_in_course | Enrolls the user in a course | course_id | learning_service.enroll(user_id, course_id) |
| get_course_grades | Returns grades for a course | course_id? | assessment_service.get_grades(user_id, course_id) |
| search_courses | Search courses by query and filters | query, category?, level? | catalog_service.search(...) |
| add_to_cart | Adds a course or resource to cart | item_id, type | commerce_service.add_to_cart(user_id, ...) |
| book_lab | Books a lab slot | lab_id, slot_start | labs_service.book(user_id, lab_id, slot_start) |
| ask_question | Posts a question in course Q&A | course_id, title, body | engagement_service.ask_question(user_id, ...) |
| navigate_to_route | Returns the app route for a feature | route_name, params? | Static mapping; no backend call |

---

## 7. Infrastructure & Deployment

### 7.1 Regions & Traffic

- **Multi-region:** At least two regions for HA; active-active for API if consistency allows.
- **DNS:** Global load balancing with health checks; the host (e.g. Vercel, AWS, Cloudflare) handles routing and failover — no custom geo-routing required.
- **CDN:** See [§2.4 CDN — where and how it's useful](#24-cdn--where-and-how-its-useful). Edge nodes for static assets and cached GETs.

### 7.2 Compute

- **Containers:** Application (API, AI, workers) packaged as Docker images; no mutable state on disk.
- **Orchestration:** Kubernetes (or ECS/equivalent); deployments, services, HPA; resource limits and requests set.
- **Scaling:** Horizontal: add pods/instances.

### 7.3 CI/CD

- **Build:** On commit/PR; build frontend (Vite) and backend (Docker); run tests and lint.
- **Deploy:** Promote image to staging; run smoke tests; promote to production with canary or blue-green; rollback on failure.
- **Secrets:** Injected at runtime from vault; never in image or repo.

---

## 8. Security Architecture

### 8.1 Authentication & Authorization

- **Identity:** Users in MongoDB; password hashed (e.g. bcrypt/argon2); MFA optional for sensitive roles.
- **Tokens:** JWT access (short-lived) + refresh (longer, stored securely); refresh rotation; revocation via blocklist in Redis or MongoDB.
- **OAuth:** For social/login; store provider id and link to user.
- **Authorization:** RBAC (roles: student, instructor, admin) + resource-level checks; enforced in domain layer before any mutation.

### 8.2 Network & Data

- **TLS:** All client and service-to-service traffic over TLS 1.2+.
- **Encryption at rest:** MongoDB, Redis, and object storage use provider or app-level encryption.
- **Secrets:** DB credentials, API keys, JWT signing keys in vault; rotated on schedule.

### 8.3 Application Security

- **Input validation:** All inputs validated (Pydantic, schema); reject malformed or oversized payloads.
- **NoSQL injection:** Use parameterized queries and driver-sanitized inputs; no raw string concatenation.
- **CSP, headers:** Security headers set by gateway (CSP, X-Frame-Options, HSTS, etc.).
- **Audit:** Log authentication events, privilege changes, and sensitive mutations for audit trail.

---

## 9. Observability & Operations

### 9.1 Logging

- **Format:** Structured JSON; fields: timestamp, level, service, request_id, user_id (if any), message, error stack (dev only).
- **Aggregation:** Central log store; retention per env; no PII in logs.
- **Correlation:** request_id from gateway propagated to all services and logs.

### 9.2 Metrics

- **Latency:** p50, p95, p99 per route and per dependency (DB, Redis, LLM).
- **Throughput:** RPS per route and per service; error rate (4xx, 5xx).
- **Business:** Enrollments/day, orders/day, AI requests/day, active users.
- **Infra:** CPU, memory, connection pool usage, queue depth.

### 9.3 Tracing

- **Distributed tracing:** OpenTelemetry or similar; trace from gateway through API and domain to DB/Redis/LLM.

### 9.4 Alerting

- **Availability:** Alert when error rate or latency exceeds threshold; when dependency is down.
- **Capacity:** Alert when connection pool, queue depth, or CPU approaches limit.

### 9.5 SLOs / SLIs (Examples)

- **API availability:** 99.9% successful requests (excluding client 4xx).
- **API latency:** p95 < 500 ms for standard routes.
- **AI:** p95 first-token < 2 s; p95 full response < 30 s (configurable).
- **DB:** Replication lag < 10 s; failover RTO < 5 min.

---

## 10. Scale & Capacity Planning

### 10.1 Bottlenecks & Mitigations

| Bottleneck | Mitigation |
|------------|------------|
| **API CPU/memory** | Scale horizontally; optimize hot paths; cache hot data in Redis. |
| **MongoDB connections** | Driver pool; maxPoolSize per instance; total within MongoDB limit. |
| **MongoDB write/read volume** | Read preference (primaryPreferred/nearest for reads); sharding; index all query patterns; TTL/archive for events. |
| **Redis** | Cluster; separate instances for cache vs queues vs session if needed. |
| **LLM latency/cost** | Queue for batch; smaller models for simple intents; caching; rate limits. |
| **Object storage/bandwidth** | CDN in front; optimize media. |

### 10.2 Capacity Numbers (Order of Magnitude)

- **Single API instance:** ~1k–5k RPS depending on route mix; scale out to 100s of instances for 100k+ RPS.
- **MongoDB:** Replica set (3+ nodes) or sharded cluster; millions of users and courses with proper indexing and shard key design.
- **Redis:** Sub-ms latency; millions of keys for cache/session; queue throughput 10k+ jobs/s with multiple workers.
- **AI:** Depends on model and prompt size; 100–500 concurrent requests per region with queue.

---

## 11. Disaster Recovery & High Availability

### 11.1 RTO / RPO Targets (Example)

- **RTO (Recovery Time Objective):** Core API < 1 hour; critical path (auth, payment) < 30 min.
- **RPO (Recovery Point Objective):** MongoDB < 5–15 min (continuous backup or replication); Redis best-effort.

### 11.2 MongoDB

- **Replica set:** Automatic failover to new primary; application reconnects via driver.
- **Backup:** Continuous backup or periodic snapshots; point-in-time recovery within retention; restore to new cluster if region lost.
- **Sharded cluster:** Per-shard replica set failover; same backup/restore and runbook.

### 11.3 Multi-Region

- **Data:** MongoDB replica set or sharded cluster; optional cross-region replica set members or global cluster; promote or failover to secondary region if primary region fails.
- **Traffic:** DNS failover to secondary region; or global load balancer with health-based routing.

### 11.4 Runbooks & Testing

- **Runbooks:** Documented for failover, restore, and scale-up; owned by platform/on-call. *Runbooks live in the ops repo or wiki (link here when available; e.g. `RUNBOOKS` or Confluence).*
- **DR drills:** Periodic restore and failover tests; measure RTO/RPO and fix gaps.

---

## 12. Appendices

### 12.1 Glossary

| Term | Definition |
|------|------------|
| **BFF** | Backend for Frontend; gateway or adapter layer for client-specific API. |
| **Idempotency key** | Client-supplied key to make a mutation request idempotent; server stores key and result, returns same result on replay. |
| **RTO** | Recovery Time Objective; max acceptable time to restore service. |
| **RPO** | Recovery Point Objective; max acceptable data loss (time). |
| **SLO** | Service Level Objective; target for availability, latency, etc. |
| **SLI** | Service Level Indicator; measurable metric used in SLO. |
| **ADR** | Architecture Decision Record; short note capturing a key decision and rationale. |

### 12.2 Architecture Decisions (ADR)

Key decisions (e.g. MongoDB only, modular monolith, AI tools → domain services) are reflected in this doc. For a separate ADR log, maintain a list in the repo (e.g. `docs/architecture/decisions/` or `ADR`) and link here.

### 12.3 Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | — | Initial full architecture: frontend, backend (Python), MongoDB (only database), Redis, AI, infrastructure, security, observability, scale, DR/HA. |

### 12.4 Related Documents (Implementers Read These Too)

- [Design System](/design-system/design-intro) — frontend tokens and components.
- [API Reference](/reference/config-reference) — API contract and conventions.
- [Best Practices](/development-standards/standards-intro) — cross-cutting patterns.
- **Runbooks / ops:** See ops repo or wiki (link when available) for failover, restore, scale-up.

### 12.5 Implementation Roadmap (Vertical Slices)

We do **not** follow a phased, time-boxed plan (e.g. “weeks 0–8”). Instead we deliver **one vertical slice at a time**: choose a starting point, plan it fully, build it end-to-end, then move to the next.

**Per slice:**

1. **Choose a starting point** — One concrete capability (e.g. “user login”, “course catalog + enrollment”, “enrolled-course Q&A”, “labs + bookings”, “commerce cart + orders”, “AI tool: get my grades”).
2. **Plan that slice fully** — For that one thing, define: data (MongoDB collections/indexes), REST API, domain logic, frontend (screens + theme), and any AI tools or prompts. Align with this architecture doc.
3. **Implement end-to-end** — Backend (domain + API), frontend (UI + integration), AI (if the slice includes AI), auth/permissions, and tests. One integrated, shippable slice.
4. **Complete and harden** — Done means: working in dev, documented, and ready for the next slice (no half-finished layers).
5. **Move to the next slice** — Pick the next vertical; repeat. Order can follow product priority (e.g. identity first, then catalog/enrollment, then enrolled-course features, then commerce, then AI tooling).

**Ongoing (across slices):** Real-time (chat, live QA), search, analytics, and hardening (rate limits, audits, backups) are added as needed or as dedicated slices, not as a single “phase”.

### 12.6 Checklist (What Not to Skip)

- **MongoDB as only database:** all core entities and operational data live in MongoDB; Redis for cache, sessions, queues only.
- **Single domain layer:** both REST and AI call the same use cases; no duplicated business logic.
- **Tool catalog and auth:** every AI-driven action is a tool; every tool is permission-checked and user-scoped.
- **Transactions:** enrollment+payment, cart→order, sponsorship approval, lab booking — always in a transaction.
- **Ids and keys:** UUIDs for external ids; idempotency keys for critical mutations.
- **Schema migrations:** versioned, reversible where possible; no untracked DDL.
- **Structured logs and metrics:** from day one for API and AI paths.
- **Secrets and config:** externalized; rotation story for DB and API keys.

---

*This document is the single authoritative reference for Delta Labs system architecture. Implementations (frontend, backend, database, AI, infra) must align with this architecture; deviations require architecture review and approval.*