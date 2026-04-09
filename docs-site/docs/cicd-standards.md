---
title: Cicd Standards
sidebar_label: Cicd Standards
---

title: Delta Labs Git, Collaboration, and CI/CD Standards

Delta Labs Git, Collaboration, and CI/CD Standards

\> **Version**: 1.0.0

\> **Status**: Official — All contributors must follow this document

\> **Scope**: Git workflow, branching, commits, pull requests, code review, CI/CD, and release flow

\---

# 1\. Repositories and Branch Protection

## 1.1 Main Branches

`main`

Always deployable, production-ready.

Protected: no force pushes, no direct commits.

Only updated via pull requests and CI-verified merges.

`develop` (optional, if we decide to keep it)

Integration branch for upcoming releases.

Receives feature branches first; periodically merged into `main`.

Also protected (no force pushes, no direct commits).

\> **Rule:** You NEVER commit directly to `main` (or `develop` if used). All changes go through feature branches and pull requests.

1.2 Branch Protection Rules

On `main` (and `develop` if present), configure:

Require pull request before merge.

Require at least 1 approval from a senior engineer (or designated reviewer).

Require CI checks to pass:

Lint (frontend + backend).

Unit tests (frontend + backend).

Build checks (frontend + backend).

Disallow force pushes and history rewrites.

\---

# 2\. Branching Strategy

## 2.1 Branch Types

We follow a simplified, explicit branch naming scheme:

Feature branches

`feature/DL-123-feed-stream-api`

`feature/DL-456-school-structure-ui`

Bugfix branches

`fix/DL-789-enrollment-duplicate-bug`

Chore / Maintenance

`chore/DL-012-update-dependencies`

Docs

`docs/DL-101-update-architecture-docs`

Refactor

`refactor/DL-202-simplify-learning-service`

\> **Rule:** Every branch name starts with a **type** `feature`, `fix`, `chore`, `docs`, `refactor`) and, if possible, a **ticket ID** (e.g., `DL-123`), followed by a short kebab-case description.

2.2 Branch Lifecycle

Create branch from `develop` (or `main` if no develop):

`git checkout develop`

`git pull`

`git checkout -b feature/DL-123-feed-stream-api`

Implement changes, commit often (see commit rules).

Rebase or merge develop into your branch regularly to avoid large conflicts:

`git fetch`

`git rebase origin/develop` (preferred) or `git merge origin/develop`.

When ready, open a pull request into `develop` (or `main` if using trunk-based).

\> **Rule:** Do NOT create long-lived feature branches without frequent rebases/merges from the base branch. Aim to merge within a week, not months.

\---

# 3\. Commit Message Standards

We use Conventional Commits with clear scopes.

## 3.1 Format

## \`\`\`text

<type>(<scope>): <short, imperative description>

<optional body>

<optional footer>

\`\`\`

Types:

`feat` – new feature.

`fix` – bug fix.

`docs` – documentation only changes.

`chore` – maintenance, configs, non-functional changes.

`refactor` – code refactoring without behavior change.

`test` – adding or updating tests.

`perf` – performance improvements.

`ci` – changes to CI/CD configuration.

Scope:

Domain modules or components, e.g.:

`feed`, `school`, `course`, `learning`, `planner`, `library`, `rent_lab`, `backend`, `frontend`.

3.2 Examples

\`\`\`text

feat(feed): add infinite scroll endpoint

feat(course): implement course learning panel view

fix(learning): prevent duplicate enrollments

docs(architecture): clarify module/domain mapping

chore(deps): upgrade fastapi and react

refactor(school): extract resource service from controller

test(feed): add integration tests for feed stream

ci(pipeline): add caching for node\_modules

\`\`\`

\> **Rule:** Commit messages must describe **why** and **what** in a concise way. Avoid generic messages like `fix bugs` or `update code`.

\---

# 4\. Pull Request (PR) Standards

## 4.1 PR Size and Scope

Aim for small, focused PRs:

Ideal: `< 400` lines changed (excluding generated files).

Each PR should address a single logical change:

One feature.

One bug fix.

One refactor.

\> **Rule:** If you feel “this touches too many things”, it probably should be split into multiple PRs.

## 4.2 PR Title & Description

Title:

Mirror the main commit, e.g.:

`feat(feed): add infinite feed stream API`

Description must include:

Context: why we are doing this.

Changes: summary of what changed.

Testing: what tests you ran and results (e.g. checkboxes).

Example:

\`\`\`markdown

**Context**

We need a TikTok-like infinite feed for educational content tied to courses.

**Changes**

\- Add `/v1/feed/stream` endpoint with cursor-based pagination.

\- Implement `ContentService.get_feed_page` with filters and basic ranking.

\- Add frontend `useInfiniteFeed` hook and `FeedPage` wiring.

**Testing**

\- \[x\] Backend unit tests (content + engagement services)

\- \[x\] Backend integration tests for `/v1/feed/stream`

\- \[x\] Frontend unit tests for `useInfiniteFeed`

\- \[x\] Manual test in local environment

\`\`\`

## 4.3 Review Process

At least one senior engineer (or designated reviewer) must approve before merging.

All comments marked as blocking must be resolved.

Non-blocking comments are suggestions; address if they improve clarity or simplicity.

\> **Rule:** Reviewers focus on correctness, architecture alignment (with `delta-rules`), readability, tests, and security/performance implications.

## 4.4 When to Request Review

Code compiles and passes local tests.

Feature is functionally complete enough for review (no major TODOs, except explicitly documented).

You have updated or added relevant tests.

\---

# 5\. Code Review Expectations

## 5.1 For Authors

Keep PR small and well-scoped.

Provide:

Screenshots or GIFs for UI changes (feed, course views, etc.).

API examples for backend changes (request/response bodies).

Respond to comments:

With code updates or clear explanations.

Mark threads as resolved when addressed.

## 5.2 For Reviewers

Check:

Does this align with architecture standards in `delta-rules/system-architecture.md`?

Does frontend follow module + design system rules?

Does backend follow service/repository layering and Mongo rules?

Are tests sufficient and meaningful?

Provide feedback that is:

Specific.

Actionable.

Respectful and focused on the code, not the person.

\> **Rule:** Reviewers should avoid bikeshedding on style if automated tooling (lint/format) already enforces it. Focus energy on architecture, correctness, and clarity.

\---

# 6\. CI/CD Pipeline Standards

## 6.1 CI Stages (per PR)

For every pull request into `develop` or `main`:

Lint

Frontend:

ESLint (React/TypeScript rules).

Prettier formatting (usually run via lint).

Backend:

Ruff / flake8 for linting.

`black` formatting check.

`mypy` (at least for critical modules).

Unit Tests

Frontend: Vitest for hooks/components.

Backend: pytest for domain services.

Build

Frontend: Vite production build.

Backend: Docker image build or at least `pip install` + static checks.

Integration Tests (optional for all PRs, mandatory for high-risk changes)

Backend API integration tests against a test MongoDB URI.

\> **Rule:** PR **cannot** be merged if any CI stage fails.

# 6.2 CD Stages (on `main` merge)

On every merge to `main`:

Build & Test (same as PR, as a safety net).

Deploy to Staging

Deploy frontend and backend to staging environment.

Run smoke tests:

Can log in.

Feed loads.

Enrollment works.

Canary Deploy to Production

Gradual rollout:

Start with 10% of traffic.

Monitor metrics and error rates.

Increase to 50%, then 100%.

Auto-Rollback

If error rate or latency pass thresholds, automatically roll back to the previous stable version.

\> **Rule:** No direct manual deploys to production. All production deployments go through CI/CD pipeline with a recorded release artifact.

\---

# 7\. Environment and Configuration Management

Environments:

`development`: local developer machines.

`staging`: pre-production testing environment.

`production`: live environment.

Every environment has:

Its own MongoDB + Redis.

Its own configuration (API URLs, secrets) managed via environment variables and/or secret manager.

\> **Rule:** Never share production secrets in non-production environments. Never commit secrets to the repository.

\---

# 8\. Feature Flags

Use feature flags for:

Large or risky features (new feed ranking, new course flows).

Gradual rollout by cohort, region, or role.

Flags can be stored in:

A dedicated collection (e.g., `feature_config`).

Or an external feature flag service.

\> **Rule:** New non-trivial features should be behind a flag until stable. Avoid long-lived flags; clean them up once fully rolled out.

\---

# 9\. Hotfix Process

When a critical production bug needs immediate fix:

Create a hotfix branch from `main`:

`git checkout main && git pull`

`git checkout -b fix/hotfix-DL-999-production-bug`

Implement minimal, focused fix with tests.

Open PR into `main` with `[HOTFIX]` in the title.

Run full CI pipeline.

Merge once approved and CI passes.

Cherry-pick or merge hotfix into `develop` (if used) to keep branches in sync.

\> **Rule:** Hotfixes still go through PR and CI. The only difference is priority and reduced scope, not quality.

\---

# 10\. Deployment, Environments, and Security Standards

This section defines how Delta Labs frontend, backend, and databases are deployed and secured across environments.

## 10.1 Environments

Environments:

`development` — local machines + ephemeral preview environments.

`staging` — production-like environment for validation before releases.

`production` — live environment for real users and data.

Rules:

Every deployable service (frontend apps, backend services, workers) must explicitly define how it runs in all three environments.

Non-production environments must never share production databases or secrets.

Access to `production` is strictly limited and audited.

## 10.2 Deployment Targets (Reference Architecture)

We assume a container-based deployment model (e.g. AWS ECS Fargate, Azure Container Apps, or GCP Cloud Run). Adjust to your cloud provider, but keep the principles:

Frontend:

Built as static assets from the main frontend repo(s).

Deployed to a static host + CDN (e.g. S3 + CloudFront, Azure Static Web Apps, or equivalent).

Separate deployments per environment:

`app.dev.<primary-domain>`

`app.staging.<primary-domain>`

`app.<primary-domain>` (production).

Backend:

Packaged as Docker images.

Deployed as containerized services behind an HTTP load balancer or API gateway.

Each environment has its own backend cluster and configuration.

Background workers / queues:

Long-running jobs (emails, reports, integrations) run as worker containers.

Communication via managed queues (e.g. SQS, Azure Queue, Pub/Sub).

Database and storage:

Managed database instances per environment (e.g. MongoDB Atlas, RDS Postgres).

No shared DB between staging and production.

Object storage (e.g. S3/Blob Storage) per environment or with strict bucket-level separation.

10.3 Domain, DNS, and TLS

Primary domain:

A single organization domain (e.g. `deltalabs.school` or `delta-labs.com`).

DNS managed centrally (e.g. Route53, Azure DNS, Cloud DNS).

Standard hostnames:

Production:

`app.<domain>` → main frontend.

`api.<domain>` → API gateway/load balancer for backend.

Staging:

`app-staging.<domain>` or `staging.<domain>`.

`api-staging.<domain>`.

Development (shared env, not local):

`app-dev.<domain>`, `api-dev.<domain>` (optional).

TLS:

All external endpoints must use HTTPS with managed certificates.

HTTP requests must redirect to HTTPS.

HSTS enabled in production (with conservative rollout).

## 10.4 CI/CD → Environments Mapping

On pull requests:

Run full CI (lint, tests, build).

Optionally create ephemeral preview environments for frontend/backends when feasible.

On merge to main (or release branch):

Build Docker images and publish to the registry.

Deploy automatically to `staging`.

Run smoke tests:

Can log in.

Core flows (e.g. enrollment, feed, school management) work.

Promoting to production:

Requires:

Green CI on main.

Successful staging deployment and smoke tests.

Manual approval from an authorized maintainer or release owner.

Deployment strategy:

Rolling or blue/green deployment.

Automated rollback when error rate/latency exceeds thresholds.

\> **Rule:** No direct manual edits or ad-hoc scripts against production. All production changes go through versioned artifacts and CI/CD pipelines.

## 10.5 Accounts, Access Control, and Secrets

Cloud accounts / subscriptions:

Use separate projects/accounts/subscriptions for `dev`, `staging`, and `production` where possible.

At minimum, separate resource groups/namespaces and IAM roles per environment.

Access control:

All engineer access goes through SSO (e.g. Google Workspace, Azure AD, Okta).

Enforce MFA on all accounts with infrastructure access.

Apply least-privilege:

Developers: full access in dev, limited in staging, read-only in production (except designated ops).

CI/CD: dedicated service accounts/roles for deployments, without console login rights.

Secrets management:

All secrets (DB passwords, API keys, JWT signing keys) must live in a secret manager (e.g. AWS Secrets Manager, Azure Key Vault, HashiCorp Vault).

No secrets in git, `.env` files in the repo, or CI logs.

Rotation policies documented and automated where feasible.

\> **Rule:** Production secrets are only accessible to the minimal set of services and people that absolutely require them, and all access is auditable.

## 10.6 Security Baseline (Application + Platform)

Application security:

Centralized authentication (e.g. JWT/OIDC) and clear authorization model (roles, permissions).

Input validation and output encoding across all public endpoints.

Rate limiting and throttling on all external APIs (per IP and per user).

Use a Web Application Firewall (WAF) on public entry points when available.

Platform security:

Default-deny network posture:

Databases and internal services are private, only reachable from application subnets.

Public access only via API gateway/load balancers/CDN.

Data:

Encryption at rest for all persistent stores (DB, disks, object storage).

Encryption in transit (TLS) for all internal and external traffic where supported.

Backups:

Regular automated backups for databases.

Periodic restore drills to verify backups are usable.

Logging and monitoring:

Centralized logs for frontend (via browser logging/monitoring) and backend (structured logs).

Metrics and alerts for:

Error rates.

Latency.

Resource usage (CPU, memory, DB connections).

Security logging and audit trails for admin actions and data access where applicable.

\> **Rule:** No production change is considered “done” unless it has meaningful monitoring and alerting in place.

## 10.7 Compliance and Data Protection (Baseline)

Treat all student and school data as sensitive:

Minimize what you store.

Mask or anonymize where possible in non-production environments.

Follow regional data laws (e.g. GDPR-style principles):

Ability to delete user data on request.

Clear data retention policies.

For any new subsystem handling sensitive data (grades, personal info, payments):

Document threat model and security controls.

Get a security review before going live.

\---

# 11\. Summary

This document defines how we work together on Delta Labs:

Branching and commit rules keep history clean and meaningful.

PR and review standards maintain quality and architectural integrity.

CI/CD and deployment standards ensure safe, repeatable delivery across environments.

Security, access control, and data protection rules keep our users and their data safe.

All contributors are expected to follow these rules alongside:

`delta-rules/system-architecture.md`

`delta-rules/frontend-standards.md`

`delta-rules/backend-standards.md`
