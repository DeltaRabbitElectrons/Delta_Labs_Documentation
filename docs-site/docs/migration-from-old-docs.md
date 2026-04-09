---
title: Untitled
sidebar_label: Untitled
---

# Migration: Old docs → New structure\_

Use this to fill the new documentation from the old (currently excluded) docs. **Old paths are under** `docs/` **but excluded from the build.**

* * *

## Direct copy (old → new)

New document

Copy from old

**01-explanation/system-overview**

`01-overview/overview`

**01-explanation/project-analysis**

`01-overview/project-analysis`

**03-design-system/design-intro**

`02-design-system/design-intro`

**03-design-system/design-tokens**

`02-design-system/design-tokens`

**03-design-system/design-principles**

`02-design-system/design-system` (Core Philosophy / Golden Rule sections)

**03-design-system/api-standards**

`02-design-system/api-standards`

**03-design-system/components/component-catalog**

`02-design-system/components/component-catalog`

**03-design-system/components/component-doc-template**

`02-design-system/components/component-doc-template`

**04-development-standards/standards-intro**

`03-coding-standards/standards-intro`

**04-development-standards/coding-standards**

`03-coding-standards/coding-standards`

**06-reference/api-reference**

`06-api-reference/api-reference-intro.md` + `06-api-reference/api-reference`

**07-operations/ci-cd**

`08-process/cicd-branch-pr.md` (+ `08-process/process-intro` for intro)

**07-operations/environments**

Optional: from runbooks or env docs if any

* * *

## Already done

-   **02-architecture/** — Filled from old `05-architecture/` (architecture-intro, full-system-architecture, diagram).
    
-   **structures/** — Filled from old `implementation-rules/*c` (backend, frontend, AI structure).
    

* * *

## Use to enrich (not 1:1 copy)

New section

Old content to reuse

**00-getting-started/introduction**

`intro` (welcome, quick start, who it’s for).

**00-getting-started/contributor-workflow**

`08-process/process-intro.md`, `08-process/cicd-branch-pr` (branch strategy, PR rules).

**04-development-standards** (error-handling, logging)

`07-best-practices/best-practices` (§2 Backend, §5 Code Style).

**08-security/security-overview**

`07-best-practices/best-practices` (§3 Security).

**09-testing-quality/testing-strategy**

`07-best-practices/best-practices` (§4 Testing).

**05-how-to-guides**

No direct old equivalent; can turn parts of best-practices into short how-tos later.

**templates/** (code templates)

Old `04-templates/templates` is **code** templates; new `templates/` is **doc** templates (ADR, API, etc.). Keep both: add a link from new docs to old code templates if you keep that file.

* * *

## Root-level old files

Old file

Use for

`intro.md`

00-getting-started/introduction or docs/README.

`documentation-analysis.md`

Reference or 01-explanation if it explains “why” the docs are structured that way.

`separation-guide.md`

00-getting-started or 01-explanation (separation of concerns).

`structure-guide.md`

00-getting-started/repo-overview or 01-explanation.

* * *

## Summary

-   **Direct copy:** 01-explanation (overview, project-analysis), 03-design-system (design-intro, design-tokens, design-principles, api-standards, components), 04-development-standards (standards-intro, coding-standards), 06-reference (API), 07-operations (ci-cd).
    
-   **Enrich:** 00-getting-started (intro, contributor-workflow), 04 (error-handling, logging from best-practices), 08-security, 09-testing-quality from best-practices.
    
-   **Already migrated:** 02-architecture, structures.