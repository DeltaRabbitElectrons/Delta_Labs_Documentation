---
title: CI/CD, Branch Strategy & PR Roles
sidebar_label: CI/CD, Branch Strategy & PR Roles
---

# CI/CD, Branch Strategy & PR Roles

This document defines how we branch, review, merge, and deploy for Delta Labs repos. Use it for both the **docs** repo and the **implementation** (app) repos.

---

## 1. Branch Strategy

We use a **Git-flow–style** model with long-lived `main` and `develop` and short-lived feature/release/hotfix branches.

### 1.1 Branch diagram

```
                    feature/xyz          release/1.2         hotfix/1.2.1
                         |                     |                    |
                         v                     v                    v
    main  ---------------*=====================*====================*--------
                         ^                     ^                    ^
                         |                     |                    |
    develop  ------------*--------*-----------+--------------------+--------
                              ^        merge
                              |
                         feature/xyz
```

- **main** — Production-ready. Every commit on `main` is deployable. Protected.
- **develop** — Integration branch. Feature branches merge here; release branches fork from here.
- **feature/\*** — New work (e.g. `feature/auth-login`). Branch from `develop`; merge back to `develop` via PR.
- **release/\*** — Preparing a release (e.g. `release/1.2`). Branch from `develop`; merge to both `develop` and `main` when ready.
- **hotfix/\*** — Urgent production fix (e.g. `hotfix/1.2.1`). Branch from `main`; merge to `main` and back into `develop`.

### 1.2 Branch roles (summary)

| Branch         | Role                             | Branch from                     | Merge into         | Deploy / use                                  |
| -------------- | -------------------------------- | ------------------------------- | ------------------ | --------------------------------------------- |
| **main**       | Production source of truth       | —                               | —                  | Deploy to production (e.g. Vercel, prod API). |
| **develop**    | Integration, next release        | main (init) or previous release | main (via release) | Deploy to staging.                            |
| **feature/\*** | Single feature or task           | develop                         | develop            | CI only; no direct deploy.                    |
| **release/\*** | Release prep, version bump, docs | develop                         | main + develop     | Staging then production when merged to main.  |
| **hotfix/\***  | Urgent prod fix                  | main                            | main + develop     | Production when merged to main.               |

---

## 2. PR (Pull Request) roles

### 2.1 When to open a PR

- **feature → develop:** When the feature is ready for review and passes local checks.
- **release → main:** When the release is tested on staging and approved.
- **hotfix → main:** When the fix is tested and approved (expedited review).

### 2.2 Who does what

| Role            | Responsibility                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Author**      | Open PR, assign reviewers, address comments, ensure CI is green.                                |
| **Reviewer(s)** | Review code/docs, approve or request changes. At least one approval before merge.               |
| **Maintainer**  | Merge after approval and CI pass. For `main`, may require additional approval (e.g. tech lead). |

### 2.3 PR rules (recommended)

- **Required:** At least **1 approval** from a reviewer (not the author).
- **Required:** **CI green** (build + lint + tests) before merge.
- **Branch protection (main / develop):** No direct push; all changes via PR. Optional: require 2 approvals for `main`.
- **PR title/description:** Clear title; description should state what and why (and link issue/ticket if any).

### 2.4 Merge method

- Prefer **squash merge** for feature branches (one commit per PR on `develop`).
- For **release** and **hotfix** into `main`, either squash or merge commit depending on team preference; keep history clear.

---

## 3. CI/CD pipeline

### 3.1 Pipeline diagram (conceptual)

```
  Commit / PR
       |
       v
  +----+----+
  |  Build  |   (install, compile, bundle)
  +----+----+
       |
       v
  +----+----+
  |  Lint   |   (ESLint, Prettier, etc.)
  +----+----+
       |
       v
  +----+----+
  |  Test   |   (unit, integration; optional e2e)
  +----+----+
       |
       +---> PR: block merge if failed
       |
       v
  Merge to main (or release → main)
       |
       v
  +----+----+
  | Deploy  |   (e.g. Vercel for docs, API for backend)
  +----+----+
       |
       v
  Production (or Staging for develop)
```

### 3.2 Stages (summary)

| Stage      | When                                                                  | What                                                                                                         |
| ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Build**  | Every push / PR                                                       | Install deps, build frontend (e.g. Vite) and/or backend (e.g. Docker).                                       |
| **Lint**   | Every push / PR                                                       | Run ESLint, Prettier (or equivalent). Fail PR if lint fails.                                                 |
| **Test**   | Every push / PR                                                       | Run unit (and optionally integration) tests. Fail PR if tests fail.                                          |
| **Deploy** | On merge to `main` (and optionally on merge to `develop` for staging) | Deploy docs to Vercel; deploy API/backend per your hosting (e.g. build image, push, deploy to staging/prod). |

### 3.3 Docs repo (this repo)

- **CI (e.g. GitHub Actions):** On PR and push to `main` — `npm ci`, `npm run build`, optionally `npm run lint` if configured.
- **CD:** On push to `main` — Vercel builds and deploys (see [Deployment Guide](/architecture/deployment-architecture) or root `DEPLOYMENT.md`).

### 3.4 Implementation repo (app / backend)

- **CI:** On every PR — build, lint, test. Block merge if any step fails.
- **CD:** Merge to `main` (or merge release into `main`) triggers deploy to production; optionally merge to `develop` triggers deploy to staging. Secrets from vault; never in repo.

(Detailed CI/CD for backend is also in [Delta Labs System Architecture](/architecture/full-system-architecture#73-cicd) §7.3.)

---

## 4. Quick reference

| I want to…              | Do this                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Start a new feature     | Branch from `develop` → `feature/my-feature`. Open PR into `develop`.                  |
| Prepare a release       | Branch from `develop` → `release/1.2`. When ready, PR into `main` and into `develop`.  |
| Fix production urgently | Branch from `main` → `hotfix/1.2.1`. PR into `main`, then merge `main` into `develop`. |
| Deploy docs             | Push to `main` (or merge PR to `main`); Vercel deploys.                                |
| Deploy app/API          | Merge to `main` (or release → `main`); your CD deploys.                                |

---

## Related

- [Delta Labs System Architecture](/architecture/full-system-architecture) — §7.3 CI/CD, §7 Infrastructure
- Root **DEPLOYMENT.md** — GitHub + Vercel for this docs site