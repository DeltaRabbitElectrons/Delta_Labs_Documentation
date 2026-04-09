---
title: Implementation Rules
sidebar_position: 0
sidebar_label: Implementation Rules
---

# Implementation Rules for Delta Labs

These rule files are meant to be **copied into the right implementation project** so Cursor has the correct structure, architecture, and principles when you implement **frontend**, **backend**, or **AI**.

---

## Rules overview

| Rule file | Use in project | When to use |
|-----------|----------------|-------------|
| **delta-labs-frontend-structure.mdc** | Vite + React + TypeScript (frontend) | Set up folder structure (modules, components, contexts, theme); component and naming standards. |
| **delta-labs-backend-structure.mdc** | Python + FastAPI (backend) | Set up app layout (api, core, domain, infra, jobs); domains, API design, MongoDB/Redis; single domain layer. |
| **delta-labs-ai-structure.mdc** | Same backend repo (AI layer) | Implement AI orchestrator, tool registry, request flow; tools call domain services only; tool catalog reference. |

---

## How to use

1. In your **implementation project** (frontend app or backend API), ensure you have a `.cursor/rules/` folder.
2. Copy the **relevant** rule file(s):
   - **Frontend:** `delta-labs-frontend-structure.mdc` → `<frontend-project>/.cursor/rules/`
   - **Backend:** `delta-labs-backend-structure.mdc` → `<backend-project>/.cursor/rules/`
   - **AI:** `delta-labs-ai-structure.mdc` → `<backend-project>/.cursor/rules/` (same repo as backend)
3. In Cursor, open that project and run your prompt, e.g.:
   - *"Set up folder structure (modules components contexts)"* (frontend)
   - *"Set up backend folder structure (api domain core infra)"* (backend)
   - *"Implement AI chat endpoint and tool registry"* (AI)

Cursor will use the rules (structure, architecture, principles) from the documentation.

---

## What each rule contains

### Frontend (`delta-labs-frontend-structure.mdc`)

- Top-level `src/`: `theme/`, `components/theme/`, `components/features/`, `modules/`, `Common/`, `contexts/`
- Module layout: `views/`, `context/`, `features/`, `routing/`, `types/`, `utils/`, `index.ts`
- Theme component layout, contexts, naming, path alias `@/`
- Principles: single source for design and UI primitives, no duplicate primitives, atomic composition

### Backend (`delta-labs-backend-structure.mdc`)

- Stack: Python 3.11+, FastAPI, MongoDB, Redis
- Layout: `app/api/`, `app/core/`, `app/domain/&lt;domain&gt;/`, `app/infra/`, `app/jobs/`
- Domain structure: services, repositories, models
- REST API design (versioning, idempotency, pagination, errors)
- API surface reference (auth, courses, enrollments, commerce, labs, AI)
- MongoDB + Redis roles and key patterns
- Principles: single domain layer, authz in domain, no business logic in api/, transactions where needed

### AI (`delta-labs-ai-structure.mdc`)

- Principles: tools = backend capabilities, user-scoped, observable
- Components: orchestrator, tool registry, LLM provider, conversation store
- Request flow (8 steps): request → load context → system prompt → LLM → tool execution → persist → response
- Tool catalog (list_courses, get_my_enrollments, enroll_in_course, get_course_grades, search_courses, add_to_cart, book_lab, ask_question, navigate_to_route)
- Where to place orchestrator and routes
- Principles: no business logic in AI layer, single domain layer, auth in domain

---

**Source:** Delta Labs System Architecture (§3 Frontend, §4 Backend, §5 Database, §6 AI), Coding Standards, and Design System docs in this repository.
