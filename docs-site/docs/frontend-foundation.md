---
title: Frontend Foundation
sidebar_label: Frontend Foundation
---

# Delta Labs Frontend — Foundation Documentation

This document describes **what exists today** in `deltalabs-frontend` after the foundation work: the shape of the app, the conventions baked into the repo, and the capabilities you can build on. It is written as **documentation of outcomes**, not a project task list.

The foundation follows **Delta Labs Frontend Standards** (Next.js App Router, strict TypeScript, Tailwind with a token layer, a single theme primitive library, module-first code layout, and clear server/client boundaries). The goal was to establish **structure, tooling, and shared UI/networking baselines** — not to ship full product features.

* * *

## What you have now

The repository is a **Next.js application** with a clear split between **public (marketing-style) pages** and an **authenticated app shell**, both driven by **route groups** so URLs and layouts stay organized. Pages stay **thin**: they import **module views** from `src/modules/…`, where real screens will grow over time.

There is a **shared design language**: colors, surfaces, typography, spacing, radii, and shadows are expressed first as **CSS variables** and Tailwind theme mappings, then mirrored in **TypeScript** where JS needs to read the same values. Base UI is centralized under `src/components/theme/` so product code composes primitives instead of inventing one-off buttons or inputs.

**Theme behavior** (light, dark, or system) is implemented globally: state lives in a client context, the document root gets the right classes, and navigation chrome includes a theme control on both public and app layouts.

**Networking** is standardized: a small `fetch`**\-based client** attaches a request id, can attach a bearer token when you register a getter (for future auth), and maps failures to a single `ApiError` shape. **TanStack React Query** wraps the tree so feature work can use consistent caching, retries, and query-key conventions.

**Every product module** listed in the standards has a **full folder skeleton** under `src/modules/` (views, API stubs, hooks, context, routing helpers, types, utils) so new features land in predictable places instead of ad hoc folders.

**Quality and tests** are wired: ESLint and Prettier, strict TypeScript checks, **Vitest** with Testing Library for units and components, and a **Playwright** entry point for E2E (with a smoke spec kept skipped until you run against a live server or CI).

* * *

## Application structure

### Routing

-   `(public)/` — Unauthenticated experience: landing, legal placeholders, login/signup placeholders. A shared layout adds **header** (brand, features anchor, auth links, theme toggle) and **footer** (privacy/terms links).
    
-   `(app)/` — Authenticated-area shell: top bar with links to **Dashboard** and **Enrolled courses**, plus theme toggle. Individual routes render module views from `Feed` or `Course` as implemented today.
    

Route files under `src/app/**/page.tsx` are intentionally minimal; they delegate to `src/modules/[Module]/views/…`.

### Root layout and providers

The root layout loads global styles and fonts, then wraps the app in a `Root` shell that composes **React Query** and **theme** providers in a consistent order. That gives you one place to add future global providers (for example auth or toasts) without scattering boundaries.

### API route

A lightweight `/api/health` route exists for connectivity checks during development or deployment smoke tests.

* * *

## Visual system

`src/styles/design-tokens.css` holds semantic variables (primary palette, surfaces, text, borders, radii, shadows) and maps them into Tailwind’s theme so utilities like `bg-primary-600` or `text-text-secondary` stay aligned with design tokens.

`src/globals.css` pulls in the token file and Tailwind, and sets base body styles using token-backed colors and the project font stack.

`src/theme/designTokens.ts` and `typography.ts` expose the same ideas to TypeScript for inline styles or logic that must reference design values.

`src/components/theme/` is the **only** place for low-level UI building blocks: buttons (including **link-styled** buttons for Next.js navigation), inputs, cards, typography, and small helpers. Product modules should import from here rather than duplicating primitives.

* * *

## Global theme

Users can switch **light**, **dark**, or **system** preference. The choice is persisted and applied to the document root so token-driven colors and Tailwind dark variants behave consistently. The implementation lives under `src/contexts/` and is wired through `src/theme/Root.tsx`.

* * *

## Data fetching and HTTP

`src/lib/apiClient.ts` is the single place for HTTP calls to your backend. It:

-   Builds URLs from a configurable **public base URL** (or same-origin relative paths if unset).
    
-   Sends `X-Request-Id` on every request.
    
-   Optionally attaches `Authorization` when you register an access-token getter (intended for when `Auth_Context` exists).
    
-   Parses JSON responses and throws `ApiError` with status, message, optional code, request id, and raw details for logging or UI mapping.
    

`src/lib/queryClient.ts` and `queryKeys.ts` define default React Query behavior and a **namespaced key pattern** (`["dl", …]`) so modules stay consistent.

`QueryProvider` is a client-only wrapper that creates one **QueryClient** per browser session, which matches recommended patterns for Next.js App Router.

* * *

## Module organization

Each product area (**Feed**, **School**, **Course**, **Planner**, **Certification**, **Chatroom**, **Tutorials**, **Research**, **Competition**, **Specialization**, **Library**, **CourseSupport**, **RentLab**, **HelpSupport**) has the same **top-level structure**: `views/`, `context/`, `features/`, `api/`, `hooks/`, `routing/guards/`, `routing/hooks/`, `types/`, `utils/`, plus a root `index.ts`. **Feed** and **Course** additionally export their views through barrels so imports stay clean.

This is the foundation for **module-first** development: HTTP lives in `api/` and `hooks/`, screens in `views/`, and cross-cutting concerns in `features/` or shared `components/features/` as the product grows.

* * *

## Tooling and scripts

Command

Purpose

`npm run dev`

Start the dev server

`npm run build`

Production build

`npm run lint`

ESLint

`npm run typecheck`

TypeScript without emit

`npm run format` / `format:check`

Prettier

`npm run test`

Vitest (single run)

`npm run test:watch`

Vitest watch mode

`npm run test:e2e`

Playwright (install browsers once: `npx playwright install`)

TypeScript is configured with **strict** options plus unused checks and explicit returns where appropriate. ESLint is configured for Next.js and integrated with Prettier so formatting does not fight lint rules.

* * *

## Configuration

`.env.example` documents `NEXT_PUBLIC_API_BASE_URL`. Use it (or `.env.local`) to point the frontend at your API; omit it for same-origin API routes or a reverse proxy during development.

* * *

## Outside the scope of this foundation

The following are **expected next steps** for product work, not gaps in the foundation itself:

-   **Authentication** (context, middleware, token wiring into `setApiAccessTokenGetter`).
    
-   **Route protection** for `(app)` routes at the server or edge.
    
-   **Icon set** (e.g. Lucide) as a single dependency.
    
-   **Rich marketing** and full **Figma** parity on marketing pages.
    
-   **E2E** enabled in CI with a documented base URL or `webServer`.
    
-   **Schema validation** (e.g. Zod) at API boundaries for DTOs.
    

* * *

## Standards and collaboration

Implementation details are aligned with **Delta Labs Frontend Standards** (Next.js, TypeScript, Tailwind, design tokens, module layout, React Query, testing expectations). Git workflow for this repo follows **Delta Labs Git, Collaboration, and CI/CD Standards** (feature branches, PRs into `dev`, conventional commits, review and CI gates).
