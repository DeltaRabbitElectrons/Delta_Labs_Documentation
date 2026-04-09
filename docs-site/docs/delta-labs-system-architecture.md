---
title: Delta Labs System Architecture
sidebar_label: Delta Labs System Architecture
---

title: Delta Labs System Architecture

Delta Labs System Architecture

\> **Version**: 1.0.0

\> **Status**: Official — All engineers must follow this document

\> **Scope**: High-level architecture, domains, and module mapping (no AI logic)

\---

# 1\. Product Identity & Modules

## 1.1 What is Delta Labs?

Delta Labs is a global-scale educational platform focused on:

A TikTok-like educational feed:

Short videos, audios, simulations, and AI-related cards (AI behavior is defined in a separate AI standards document).

Deep learning ecosystem:

School: full-school management (from one-person schools to large institutions).

Course: course design, delivery, and learning.

Planner: schedules and study planning.

Certification: verification of learning outcomes.

Chatroom: real-time discussion.

Tutorials: tutors, guidance, and tutorials.

Research and Development: R&D collaboration and publication.

Online Competition: contests and leaderboards.

Specialization: long-term specialization tracks.

Digital Library: large digital content library.

Course Support: support and help around courses.

Rent a Lab: renting and managing physical/virtual labs.

Help and Support: platform-level support.

## 1.2 Core Technology Stack

Layer Technology Purpose

Frontend Runtime React 18 SPA UI and interaction

Frontend Language TypeScript (strict) Type safety & developer productivity

Frontend Build Vite Dev server and bundling

Frontend Styling Tailwind CSS + design tokens Utility-first with a strict design system

Backend Language Python 3.11+ Async, typed backend services

Backend Framework FastAPI REST APIs with Pydantic validation

Primary Database MongoDB Single source of truth for domain data

Cache / Session Redis Cache, sessions, rate-limits, queues

\> **Rule:** MongoDB is the **only** primary database. Redis is used _only_ for cache/session/queues.

\---

# 2\. System Layers

```
┌────────────────────────────────────────────────────┐

│                    CLIENTS                         │

│  Browser (React SPA) · Mobile · 3rd-party clients  │

└───────────────────────┬────────────────────────────┘

                        │ HTTPS / JSON

┌───────────────────────▼────────────────────────────┐

│                 API GATEWAY / EDGE                 │

│ TLS, WAF, rate limiting, request logging           │

└───────────────────────┬────────────────────────────┘

                        │

┌───────────────────────▼────────────────────────────┐

│               FASTAPI BACKEND (REST)               │

│  /v1 APIs (feed, school, course, ...)              │

└───────────────┬────────────────────────────────────┘

                │

       ┌────────▼─────────┐

┌──────▼──────┐    ┌──────▼─────┐

│ DOMAIN LAYER │    │  INFRA    │

│ (services)   │    │ (Mongo/   │

│              │    │  Redis)   │

└──────┬───────┘    └─────┬─────┘

       │                  │

┌──────▼──────┐    ┌──────▼──────┐

│   MongoDB   │    │    Redis    │

│ (primary DB)│    │(cache,queues│

└─────────────┘    └─────────────┘
```

Frontend SPA: Talks only to the FastAPI backend via JSON.

Backend: Stateless, horizontally scalable.

Domain Layer: Encapsulates business logic per domain (School, Course, Feed, etc.).

MongoDB: Stores all domain data.

Redis: Caching, sessions, and job queues only.

\---

# 3\. Domain & Frontend Module Mapping

Every product area maps to a frontend module, backend domain(s), and MongoDB collections.

Product Area Frontend Module Backend Domain(s) Example Collections

Feed `Feed` `content`, `engagement` `content_items`, `content_media`, `content_simulations`, `likes`, `favorites`, `comments`, `shares`, `view_events`

School `School` `school` `schools`, `school_staff`, `departments`, `classes`, `school_resources`, `school_labs`, `school_finance`, `school_transport`, `school_plans`, `school_schedules`

Course `Course` `course`, `learning` `courses`, `course_sections`, `lessons`, `course_resources`, `course_roadmaps`, `enrollments`, `enrollment_progress`, `course_scores`

Planner `Planner` `planner` `study_plans`, `plan_items`

Certification `Certification` `certification` `certificates`, `certificate_templates`

Chatroom `Chatroom` `chatroom` `chatrooms`, `chat_messages`

Tutorials `Tutorials` `tutorials` `tutorial_offers`, `tutorial_sessions`

Research & Dev `Research` `research` `research_projects`, `research_docs`

Online Competition `Competition` `competitions` `competitions`, `competition_rounds`, `competition_scores`

Specialization `Specialization` `specialization` `specialization_tracks`, `specialization_enrollments`

Digital Library `Library` `library` `library_items`, `library_collections`

Course Support `CourseSupport` `course_support` `course_tickets`, `course_faqs`

Rent a Lab `RentLab` `rent_lab` `labs`, `lab_availability`, `lab_bookings`

Help & Support `HelpSupport` `help_support` `support_tickets`, `support_articles`

\---

# 4\. Cross-Cutting Architecture Rules

## 4.1 Separation of Concerns

Frontend

Holds presentation logic only (view models, UI state, navigation).

Never performs domain decisions based on raw data that should belong to the backend.

Backend

Owns all domain logic:

Enrollment rules.

Access control rules.

Scheduling rules (planner, labs).

Domains

Each domain `school`, `course`, `content`, etc.) is cohesive and has:

`schemas.py` (Pydantic models).

`repository.py` (MongoDB access).

`service.py` (business logic).

## 4.2 Stateless Backend

No in-memory user data between requests.

All data and state are in MongoDB or Redis.

Scaling is done by adding more API instances.

## 4.3 Versioned APIs

All endpoints are versioned: `/v1/...`.

Breaking changes create a new version `/v2`), never silently change `/v1`.

\---

# 5\. MVP Flows

## 5.1 Feed → Course Enrollment

User opens Feed (React SPA).

SPA calls `GET /v1/feed/stream?cursor=&limit=20`.

Backend `FeedService` returns a page of `ContentItem`s with:

Type (video/audio/simulation/ai-card).

Linked `course_id?`.

Engagement stats and user state.

User taps Enroll on a card.

SPA calls `POST /v1/enrollments` with `course_id`.

`LearningService`:

Validates course exists.

Validates not already enrolled.

Creates `Enrollment`.

SPA navigates to `CourseLearningPanelView` for that course.

## 5.2 School Management

School admin signs in.

SPA loads School module:

Calls `GET /v1/schools/{id}`.

Admin can:

Update basic info, staff, resources, labs, schedules.

All operations mapped to `SchoolService`, which:

Validates ownership.

Writes to `schools`, `school_staff`, etc.

\---

# 6\. What Is Defined Elsewhere

AI-specific architecture, tools, prompts, and models are defined in dedicated AI standards.

Infrastructure, DevOps, and CI/CD pipelines are defined in platform engineering standards.

Security, testing, and observability have detailed rules in their own standards documents.

\> **Rule:** When in doubt, follow this document plus the global `Delta Labs Engineering Standards`.

\> If the two ever conflict, the global standard + architecture review decision wins.
