---
title: Authorization
sidebar_label: Authorization
---

# Authorization

Roles, permissions, and access rules are added via data (admin UI or API), not by changing code.

**Principles:**

- **Roles** — stored in DB; create/edit/delete anytime.
- **Permissions** — stored in DB; fine-grained (e.g. `courses:create`, `users:list`).
- **Access** — computed from user → role(s) → permissions; no hard-coded role checks in routes.
- **Future** — new role "moderator", new permission "labs:approve", new resource "reports" → add in DB and optionally in admin UI; backend logic stays generic.

---

## 0. Auth architecture structure

Auth needs a clear place in the backend and a consistent request flow. Below is a **structure** that works with a modular monolith (e.g. Python/FastAPI or Node); adjust names to your stack.

### 0.1 Where Auth lives (directory layout)

Treat **Auth** as one **domain/module** with clear boundaries. Suggested layout:

```
app/
├── api/                          # HTTP entrypoints
│   ├── routes/
│   │   ├── auth/                 # Auth routes (login, register, refresh, profile, …)
│   │   │   ├── __init__.py
│   │   │   ├── login.py
│   │   │   ├── register.py
│   │   │   ├── refresh.py
│   │   │   └── profile.py
│   │   ├── roles.py              # Role CRUD (admin)
│   │   ├── permissions.py        # Permission CRUD (admin)
│   │   ├── users.py              # User management (admin)
│   │   └── organizations.py     # Organizations + types (admin / org admins)
│   └── middleware/
│       ├── auth.py               # JWT validation, attach current user to request
│       └── require_permission.py # Permission check (e.g. require_permission('users:list'))
│
├── domain/
│   └── identity/                 # Auth domain
│       ├── __init__.py
│       ├── services/             # Use cases (no DB access; use repos)
│       │   ├── auth_service.py   # login, register, refresh, logout, forgot_password, …
│       │   ├── user_service.py   # get_user, update_user, list_users, assign_roles
│       │   ├── role_service.py   # CRUD roles, assign permissions to role
│       │   ├── permission_service.py # CRUD permissions, resolve user permissions
│       │   └── organization_service.py # CRUD orgs + types, members
│       ├── repositories/         # Data access (MongoDB)
│       │   ├── user_repo.py
│       │   ├── role_repo.py
│       │   ├── permission_repo.py
│       │   ├── refresh_token_repo.py
│       │   ├── organization_repo.py
│       │   └── user_organization_repo.py
│       └── models/ or schemas/   # DTOs, request/response shapes (no DB coupling in API)
│           ├── user.py
│           ├── role.py
│           ├── permission.py
│           └── organization.py
│
├── core/                         # Shared cross-cutting
│   ├── config.py
│   ├── security.py               # JWT encode/decode, password hash, get_current_user dependency
│   └── errors.py
│
└── infra/
    └── db/                       # MongoDB connection, optional Redis for sessions
        └── connection.py
```

- **Routes** — thin: validate input, call domain service, return response. No business logic.
- **Middleware** — auth: validate JWT, set `request.user`; require_permission: check permission for `request.user`, return 401/403 if not.
- **Domain (identity)** — services implement use cases; repos do all DB access. Permission resolution (user → roles → permissions) lives in a service (e.g. `permission_service.get_user_permission_slugs(user_id)`) and is used by middleware or by other domains.
- **Core** — JWT handling, password hashing, `get_current_user` (dependency that returns user or 401). No domain logic.

### 0.2 Request flow (high level)

```
1. Request hits API
      ↓
2. Auth middleware (if route protected)
   - Read Authorization: Bearer <token>
   - Validate JWT → get user_id (and optionally load user)
   - Attach user to request (e.g. request.state.user)
   - If invalid/missing → 401
      ↓
3. Permission middleware (if route has require_permission('X'))
   - Get request.user
   - Resolve user's permission slugs (from user.role_ids → role_permissions → permissions)
   - If 'X' not in slugs → 403
   - If ok → continue
      ↓
4. Route handler
   - Call domain service (e.g. user_service.list_users(filters))
   - Service uses repos (user_repo, role_repo, …)
   - Return response
      ↓
5. Response
```

- **Public routes** (e.g. login, register): no auth middleware; no permission.
- **Protected routes**: auth middleware required; optional `require_permission('slug')` per route or per router.

### 0.3 Layers and dependencies

| Layer | Depends on | Does not depend on |
|-------|------------|---------------------|
| **API (routes)** | Domain services, middleware, core (get_current_user) | Repositories, DB |
| **Middleware** | Core (JWT, get_current_user), Permission service (resolve permissions) | Repositories directly |
| **Domain services** | Repositories (injected), core (e.g. password hash) | API, HTTP |
| **Repositories** | DB connection, schema/docs | Services, API |

- **Permission check** can live in middleware that calls a small **permission_service.get_user_permission_slugs(user_id)** (or equivalent); middleware then checks slug in list. Alternatively, a single **require_permission('slug')** dependency that does: get current user → resolve permissions → check slug → 403 if missing.

### 0.4 How Auth connects to the rest of the app

- **Other domains** (courses, labs, commerce, …) do **not** import Auth repositories or DB. They receive **user_id** (and optionally **user** or **permission_slugs**) from the API layer. If a course endpoint needs "user can edit this course", the API layer either:
  - calls a **permission** check (`require_permission('courses:update')`) and then the course service (with user_id), or
  - calls the course service with user_id and the service checks ownership/role internally (e.g. "is user instructor of this course?").
- **Auth domain** exposes: login/register/refresh, user CRUD, role/permission CRUD, organization CRUD, and **permission resolution** (user → list of permission slugs). The rest of the app uses that list for access control; it does not need to know about roles/permissions tables.

### 0.5 Summary of structure

- **One Auth domain** (identity): routes, services, repos, models under a single tree.
- **Auth middleware** + **permission dependency** at the API edge; no role logic in business code.
- **Clear layers**: API → domain services → repositories → DB; permission resolution in identity domain, consumed by middleware or dependency.
- **Other domains** depend only on "current user" and optionally "user permission slugs"; they do not touch Auth DB or repos.

This gives Auth a clear **architecture structure** without tying you to a specific language or framework.

---

## 1. Schemas (data-driven, extensible)

### 1.1 Core identity (unchanged)

| Collection | Purpose |
|------------|--------|
| `users` | id, email, password_hash, first_name, last_name, username, avatar, **role_ids** (array of ObjectId refs to `roles`), is_email_verified, status (active/suspended/deleted), created_at, updated_at, last_login_at. |
| `user_preferences` | user_id, theme, language, notifications, privacy (or embed in user). |
| `refresh_tokens` | user_id, token, expires_at, revoked. |
| `oauth_accounts` | user_id, provider, provider_user_id. |
| `sessions` (optional) | session_id, user_id, expires_at. |

**Important:** User has `role_ids: ObjectId[]` (or single `role_id` if one role per user for now). No enum in code — roles come from DB.

### 1.2 Roles

| Collection | Purpose |
|------------|--------|
| `roles` | **id**, **name** (e.g. `student`, `instructor`, `admin`, `moderator`), **slug** (unique, e.g. `student`), **description**, **is_system** (optional: true = cannot delete, only disable), created_at, updated_at. |

- New role = new document in `roles`. No deploy needed.
- `slug` is the stable key (e.g. for checks or UI).

### 1.3 Permissions

| Collection | Purpose |
|------------|--------|
| `permissions` | **id**, **name** (e.g. `courses:create`), **slug** (unique), **resource** (e.g. `courses`), **action** (e.g. `create`, `read`, `update`, `delete`, `list`), **description**, created_at, updated_at. |

- New permission = new document. Examples: `courses:read`, `courses:create`, `users:list`, `users:update_role`, `labs:approve`, `reports:view`.
- Backend checks "does current user have permission X?"; no list of roles in code.

### 1.4 Role–Permission mapping (many-to-many)

| Collection | Purpose |
|------------|--------|
| `role_permissions` | **role_id** (ObjectId → roles), **permission_id** (ObjectId → permissions). Unique (role_id, permission_id). |

- Grant/revoke permission to a role = insert/delete here. No code change.

### 1.5 Organizations (schools, laboratories, research centers, …)

**Schools are organizations, not roles.** So are laboratories, research centers, and any other institution. They share one model: **organizations** with a **type**.

| Collection | Purpose |
|------------|--------|
| `organization_types` | **id**, **name** (e.g. School, Laboratory, Research center), **slug** (unique: `school`, `laboratory`, `research_center`, …). Add new types in DB (no code change). |
| `organizations` | **id**, **type_id** (ObjectId → organization_types), **name**, **slug**, **settings** (optional JSON), **parent_id** (optional; for hierarchy), created_at, updated_at. |

- **Organization types** — examples: school, laboratory, research_center, university, institute, company, … All in DB; new type = new document.
- **Organizations** — each has one type. "Haromaya University", "Chemistry Lab Building A", "AI Research Center" are organizations with types school, laboratory, research_center (or your slugs).
- **Users** link to organizations via **user_organizations** (see below); a user can belong to multiple orgs (e.g. one school + one lab).

### 1.6 User–Organization membership (optional)

| Collection | Purpose |
|------------|--------|
| `user_organizations` | **user_id** (ObjectId → users), **organization_id** (ObjectId → organizations), **role_id** (ObjectId → roles; optional: role **within** this org), **status** (active, inactive), joined_at, created_at, updated_at. Unique (user_id, organization_id). |

- User belongs to one or more organizations; optionally has a **role within that org** (e.g. "teacher at School X", "lab assistant at Lab Y").
- Access can be scoped: "user has permission P **in** organization O" by checking user's membership and role in O, then that role's permissions.

### 1.7 Optional: User–Role override / future

- If later you need "user X has role Y only for tenant Z", add `user_roles` (user_id, role_id, scope_type, scope_id). With organizations, `user_organizations.role_id` already gives role-per-org. Global roles stay on `users.role_ids`.

---

## 2. How access is checked (generic, no fixed roles)

### 2.1 Flow

1. Request comes in with JWT → resolve **user** (and `role_ids`).
2. Route says: "this endpoint requires permission **P**" (e.g. `users:list`).
3. Backend: load permissions for user's roles (from `role_permissions` + `permissions`).
4. If user has **P** → allow; else → 403.

No `if (user.role === 'admin')` in route handlers. Only: "require permission P".

### 2.2 Implementation sketch

- **Function:** `userHasPermission(userId, permissionSlug)` (or load user with role_ids → get all permission slugs for those roles → check if permissionSlug in set). Cache per request or short TTL if needed.
- **Middleware/decorator:** `requirePermission('users:list')` on route. Gets current user, calls `userHasPermission`, returns 403 if false.
- **Optional:** `requireAnyPermission(['users:list', 'users:read'])` for multiple allowed permissions.

### 2.3 Defaults / seeding

- Seed script or migration creates **initial** roles and permissions and assigns permissions to roles (e.g. `admin` gets `users:list`, `users:update_role`, etc.). After that, everything is editable via API/DB; no code change to add "moderator" or "labs:approve".

---

## 3. APIs (consistent with data-driven model)

### 3.1 Auth (unchanged from frontend contract)

- Login, register, refresh, logout, forgot-password, reset-password, profile, etc.
- Response includes **user** with **roles** (and optionally **permissions**) so frontend can show UI or enforce client-side hints. Backend remains source of truth.

### 3.2 Role management (admin only)

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | /api/roles | `roles:list` | List all roles (with optional filters). |
| POST | /api/roles | `roles:create` | Create role (name, slug, description). |
| GET | /api/roles/:id | `roles:read` | Get one role (with permissions). |
| PATCH | /api/roles/:id | `roles:update` | Update role. |
| DELETE | /api/roles/:id | `roles:delete` | Delete role (or soft-delete; block if is_system). |

### 3.3 Permission management (admin only)

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | /api/permissions | `permissions:list` | List all permissions (resource/action filters). |
| POST | /api/permissions | `permissions:create` | Create permission (name, slug, resource, action). |
| GET | /api/permissions/:id | `permissions:read` | Get one permission. |
| PATCH | /api/permissions/:id | `permissions:update` | Update permission. |
| DELETE | /api/permissions/:id | `permissions:delete` | Delete permission. |

### 3.4 Role–Permission assignment (admin only)

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | /api/roles/:id/permissions | `roles:read` | List permissions for role. |
| PUT | /api/roles/:id/permissions | `roles:update` | Set full list of permission IDs for role. |
| POST | /api/roles/:id/permissions/:permissionId | `roles:update` | Grant permission to role. |
| DELETE | /api/roles/:id/permissions/:permissionId | `roles:update` | Revoke permission from role. |

### 3.5 User management (admin only)

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | /api/users | `users:list` | List users (pagination, filters, search). |
| GET | /api/users/:id | `users:read` | Get user (with roles). |
| PATCH | /api/users/:id | `users:update` | Update user (including **role_ids**). |
| DELETE | /api/users/:id | `users:delete` | Soft-delete or deactivate user. |

- Assigning roles to a user = PATCH `users/:id` with `role_ids: [ObjectId, ...]`. No fixed enum; only IDs that exist in `roles`.

### 3.6 Organization types (admin / platform)

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | /api/organization-types | `organization_types:list` | List all organization types (school, laboratory, research_center, …). |
| POST | /api/organization-types | `organization_types:create` | Create type (name, slug). |
| GET | /api/organization-types/:id | `organization_types:read` | Get one type. |
| PATCH | /api/organization-types/:id | `organization_types:update` | Update type. |
| DELETE | /api/organization-types/:id | `organization_types:delete` | Delete type (block if orgs use it). |

### 3.7 Organizations (admin / org admins)

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | /api/organizations | `organizations:list` | List organizations (filter by type, search). |
| POST | /api/organizations | `organizations:create` | Create organization (type_id, name, slug). |
| GET | /api/organizations/:id | `organizations:read` | Get one organization (with members optional). |
| PATCH | /api/organizations/:id | `organizations:update` | Update organization. |
| DELETE | /api/organizations/:id | `organizations:delete` | Soft-delete or deactivate. |
| GET | /api/organizations/:id/members | `organizations:read` or `organizations:members` | List members (user_organizations). |
| POST | /api/organizations/:id/members | `organizations:update` or `organizations:members` | Add user to org (user_id, role_id optional). |
| DELETE | /api/organizations/:id/members/:userId | `organizations:update` or `organizations:members` | Remove user from org. |

- Access can be scoped: e.g. only org admins can PATCH their own org; platform admins can manage any org. Use permissions like `organizations:update` with optional scope (e.g. "in org O" when not super_admin).

---

## 4. Adding something new (no code change)

| What you want | What you do |
|---------------|--------------|
| New role "moderator" | POST /api/roles (or insert in `roles`). |
| New permission "labs:approve" | POST /api/permissions (or insert in `permissions`). |
| Moderator can approve labs | PUT /api/roles/:moderatorId/permissions with list including `labs:approve`. |
| New route "Approve lab" | In code: one line `requirePermission('labs:approve')` on that route. Only new permission slug is "in code"; who has it is in DB. |
| New resource "reports" | Create permissions `reports:read`, `reports:export` in DB; assign to roles; add routes with `requirePermission('reports:read')` etc. |

So: **roles and permissions and who-has-what are data-driven; only the permission slug for a new action is added in code when you add the new feature.**

---

## 5. Summary

- **Roles** — in DB (`roles`); create/update/delete via API; users reference roles by `role_ids`.
- **Permissions** — in DB (`permissions`); create/update/delete via API; many-to-many with roles (`role_permissions`).
- **Organizations** — in DB (`organizations`); each has an **organization type** (school, laboratory, research_center, …). Organization types in `organization_types`; add new types in DB. Users belong to orgs via `user_organizations`. **Schools, laboratories, research centers** are organizations, not roles.
- **Access** — backend checks "user has permission P" (from user → roles → permissions). Optionally scoped by organization (user's role in org O). No fixed role enums in route logic.
- **User management** — PATCH user's `role_ids`; list/get/update/delete users; all gated by permissions.
- **Future** — new roles, new permissions, new organization types, new access: add in DB (and admin UI if you have one); add one permission slug in code only when you add a new protected action.

---

## 6. Delta Labs role set (frontend alignment)

The frontend uses or will use these **user types / roles**. They **all fit** in this RBAC: each is a **role** in the `roles` collection. No enum in code — create them in DB (seed or admin) and assign permissions.

| Role (slug) | Name (display) | Notes |
|-------------|----------------|--------|
| `student` | Student | Learner; enrolls in courses, views content, submits work. |
| `parent` | Parent | Guardian; may view child progress, get reports (permissions: e.g. `progress:read_guardian`, `reports:read`). |
| `teacher` | Teacher | Teaches; creates/edits content, grades, manages class (per course or global). |
| `user` / `normal_user` | Normal user | Generic authenticated user; minimal permissions (profile, browse). |
| `lab_assistant` | Lab assistant | Manages lab space, equipment, bookings (e.g. `labs:manage`, `labs:approve`). |
| `coach` | Coach | Coaching/mentoring; may have `coaching:read`, `coaching:assign`, etc. |
| `professor` | Professor | Same idea as teacher; can share permissions with `teacher` or have extra (e.g. `courses:publish`, `grades:finalize`). |
| `content_creator` | Content creator | Creates courses, supplements, resources (e.g. `content:create`, `content:update_own`). |
| `tutor` | Tutor | Tutoring; may grade, answer Q&A, manage sessions (e.g. `courses:tutor`, `qa:answer`). |
| `admin` | Admin | Platform admin; user/role/permission management. |
| `super_admin` | Super admin | Full system access. |
| `instructor` | Instructor | Same as teacher/professor for course context. |
| `ta` | TA | Teaching assistant; often **context-specific** per course (see below). |

- **Add/remove roles:** Create or delete documents in `roles` and assign permissions via `role_permissions`. No code change.
- **Frontend:** Auth/profile API returns user with **roles** (e.g. list of `{ id, slug, name }`). UI can show "Student", "Parent", "Teacher", etc. from that list; no hard-coded role list in frontend if you load roles from API.

### 6.1 Schools, laboratories, research centers — they are organizations (not roles)

**Schools are organizations.** So are laboratories, research centers, universities, institutes, and similar. They are **not** roles; they are **organizations** with an **organization type**.

- **Organization types** (in `organization_types`): e.g. **school**, **laboratory**, **research_center**, **university**, **institute**, **company**, … Add new types in DB; no code change.
- **Organizations** (in `organizations`): each has a `type_id` pointing to an organization type. Examples:
  - "Haromaya University" → type **school** (or **university**)
  - "Chemistry Lab Building A" → type **laboratory**
  - "AI Research Center" → type **research_center**
- **Users** belong to organizations via **user_organizations** (user_id, organization_id, optional role_id within that org). A user can be in multiple orgs (e.g. one school + one lab).
- **Roles** (student, teacher, lab_assistant, …) stay as **roles**; they describe *what* the user does. **Organizations** describe *where* (which school, which lab, which research center). So: "teacher **at** School X" = user with role **teacher** and membership in organization **School X** (and optionally role **teacher** in that org in `user_organizations.role_id`).

So: **schools, laboratories, research centers** (and any other type you add) are **organizations**; add new organization types in DB. No "school" role; use roles like **teacher**, **lab_assistant**, **student** and tie them to orgs via membership.

### 6.2 Context-specific roles (e.g. course member: student, ta, instructor)

Inside a **course**, the frontend has **MemberRole** = `student` | `ta` | `instructor`. That is **per enrollment**, not the global app role:

- Store in **enrollments** (or **course_members**): e.g. `enrollment.role` or `enrollment.member_role_slug` = `student` | `ta` | `instructor`.
- Global app role (from `users.role_ids`) can **default** or **override** per course: e.g. user with app role "instructor" is assigned "instructor" in course X; in course Y they might be "student".
- Option: **derive** course role from app role (e.g. if app role is `instructor` then allow assigning them as instructor in a course); or keep course role fully independent and assign per enrollment.

So: **student, parent, teacher, normal user, lab assistant, coach, professor, content creator, tutor** (and admin, super_admin, instructor, ta) all fit as **roles**. **Schools, laboratories, research centers** (and similar) are **organizations** with types, not roles. **Course-level** roles (student, ta, instructor) stay in enrollment/course_member data and can align with or derive from global roles.