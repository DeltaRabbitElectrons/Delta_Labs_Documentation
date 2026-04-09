# Delta Labs Docs — Backend Standard

> This document defines the backend architecture, API design, database schema, service patterns, authentication mechanisms, and deployment configuration for the Delta Labs Docs system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Application Entry Point](#application-entry-point)
5. [Configuration & Environment](#configuration--environment)
6. [Database Layer](#database-layer)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Routes & Endpoints](#api-routes--endpoints)
9. [Service Layer](#service-layer)
10. [GitHub Integration](#github-integration)
11. [Deployment](#deployment)

---

## 1. System Overview

The backend is a **Python FastAPI** application that serves as the central API layer for the entire Delta Labs Docs platform. It connects the admin portal and docs site to:

- **MongoDB** (via Motor async driver) for data persistence
- **GitHub API** (via PyGithub) for documentation file management
- **Twilio** for SMS-based OTP delivery
- **Email providers** (Resend / SendGrid / SMTP) for email notifications
- **Vercel** deploy hooks for automated docs site rebuilds

```
┌──────────────┐     ┌──────────────┐
│  Portal      │     │  Docs Site   │
│  (Next.js)   │     │  (Docusaurus)│
└──────┬───────┘     └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  ▼
    ┌──────────────────────────┐
    │    FastAPI Backend        │
    │    (Python 3.x + Uvicorn)│
    ├──────────────────────────┤
    │  Routes │ Services │ Auth│
    └────┬────────┬────────┬───┘
         │        │        │
    ┌────▼──┐ ┌───▼───┐ ┌──▼──────┐
    │MongoDB│ │GitHub  │ │Twilio / │
    │(Motor)│ │API     │ │Email    │
    └───────┘ └───────┘ └─────────┘
```

---

## 2. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.x | Runtime |
| **FastAPI** | 0.133.1 | Web framework (async, type-safe) |
| **Uvicorn** | 0.41.0 | ASGI server |
| **Motor** | 3.7.1 | Async MongoDB driver |
| **PyMongo** | 4.16.0 | MongoDB utilities (used by Motor) |
| **python-jose** | 3.5.0 | JWT token creation & verification |
| **passlib** | 1.7.4 | Password hashing utilities (available) |
| **Pydantic** | 2.12.5 | Data validation & schemas |
| **pydantic-settings** | 2.13.1 | Environment variable configuration |
| **PyGithub** | 2.8.1 | GitHub API client |
| **Resend** | 2.23.0 | Primary email API |
| **SendGrid** | 6.11.0 | Fallback email API |
| **Twilio** | 9.4.5 | SMS OTP delivery |
| **httpx** | latest | Async HTTP client |
| **python-multipart** | latest | Form data parsing |
| **email-validator** | 2.3.0 | Email address validation |
| **markdownify** | latest | HTML → Markdown conversion |
| **requests** | 2.32.5 | Sync HTTP client (Vercel hooks) |

---

## 3. Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Environment settings (pydantic-settings)
│   ├── database.py             # MongoDB connection (Motor async)
│   ├── github_client.py        # GitHub API operations
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   └── jwt.py              # JWT creation, password ops, auth dependencies
│   │
│   ├── middleware/
│   │   └── auth_guard.py       # Role-based access guards
│   │
│   ├── models/
│   │   └── admin.py            # Pydantic model for Admin user
│   │
│   ├── schemas/
│   │   ├── content.py          # Request schemas for content operations
│   │   └── sidebar.py          # Request schemas for sidebar operations
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py             # Login & registration endpoints
│   │   ├── admin_auth.py       # Admin management, signup, OTP, approvals
│   │   ├── pages.py            # Page CRUD operations
│   │   ├── content.py          # Content save, history, revert
│   │   ├── sidebar.py          # Sidebar tree management
│   │   ├── chat.py             # Team chat messages
│   │   ├── notes.py            # Admin notes & workspaces
│   │   └── password_reset.py   # Forgot/reset password flow
│   │
│   └── services/
│       ├── email_service.py    # Multi-provider email sending
│       ├── otp_service.py      # OTP generation & verification
│       └── sms_service.py      # Twilio SMS sending
│
├── scripts/                    # Utility scripts
├── requirements.txt            # Python dependencies
├── render.yaml                 # Render deployment configuration
├── openapi.json                # Auto-generated OpenAPI spec
└── .env                        # Environment variables (local)
```

---

## 4. Application Entry Point

### `app/main.py`

The FastAPI app is initialized with:

```python
app = FastAPI(title='Delta Labs Docs API', lifespan=lifespan)
```

**Lifespan events:**
- **Startup**: Validates required environment variables, connects to MongoDB
- **Shutdown**: Closes MongoDB connection

**Middleware stack:**
1. **CORS**: Allows all origins (`*`), credentials, methods, and headers
2. **Request Logger**: Logs every incoming request method + path and response status code

**Global exception handler:**
- Catches all unhandled exceptions and returns a `500` JSON response with error details

**Router mounting:**

| Prefix | Router | Tags |
|---|---|---|
| `/auth` | `auth.router` | Auth |
| `/pages` | `pages.router` | Pages |
| `/content` | `content.router` | Content |
| `/auth` | `password_reset.router` | Auth |
| `/chat` | `chat.router` | Chat |
| `/notes` | `notes.router` | Notes |
| `/sidebar` | `sidebar.router` | Sidebar |
| (root) | `admin_auth.router` | Admin Auth |

**Health check:**
```
GET / → { "status": "Delta Labs Docs API is running — v3.0" }
```

---

## 5. Configuration & Environment

### `app/config.py`

Uses `pydantic-settings` for type-safe configuration:

```python
class Settings(BaseSettings):
    # Core
    MONGO_URI: str                          # MongoDB connection string
    DATABASE_NAME: str                      # MongoDB database name
    SECRET_KEY: str                         # JWT signing secret
    ALGORITHM: str = 'HS256'               # JWT algorithm
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # Token TTL (24 hours)

    # GitHub
    GITHUB_TOKEN: str                       # GitHub personal access token
    GITHUB_REPO: str                        # GitHub repo (owner/repo)
    GITHUB_BRANCH: str = 'main'            # Target branch
    DOCS_FOLDER: str = 'docs-site/docs'    # Docs path within repo

    # Frontend
    FRONTEND_URL: str = 'http://localhost:3000'

    # Deployment
    VERCEL_DEPLOY_HOOK_URL: str = ''       # Vercel rebuild webhook

    # Email — Primary (Resend)
    RESEND_API_KEY: str = ''
    FROM_EMAIL: str = 'onboarding@resend.dev'

    # Email — Fallback (SendGrid)
    SENDGRID_API_KEY: str = ''
    EMAIL_FROM_ADDRESS: str = ''

    # Email — Fallback (SMTP)
    SMTP_HOST: str = ''
    SMTP_PORT: int = 587
    SMTP_USER: str = ''
    SMTP_PASSWORD: str = ''

    # SMS (Twilio)
    TWILIO_ACCOUNT_SID: str = ''
    TWILIO_AUTH_TOKEN: str = ''
    TWILIO_PHONE_NUMBER: str = ''
```

### Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `DATABASE_NAME` | ✅ | Database name |
| `SECRET_KEY` | ✅ | JWT signing key |
| `GITHUB_TOKEN` | ✅ | GitHub PAT for repo access |
| `GITHUB_REPO` | ✅ | GitHub repository path |
| `VERCEL_DEPLOY_HOOK_URL` | ✅ | Vercel deploy hook for auto-rebuilds |
| `RESEND_API_KEY` | ✅ | Primary email provider |
| `FROM_EMAIL` | ✅ | Sender email address |
| `TWILIO_ACCOUNT_SID` | ⚠️ | Required for SMS OTP |
| `TWILIO_AUTH_TOKEN` | ⚠️ | Required for SMS OTP |
| `TWILIO_PHONE_NUMBER` | ⚠️ | Required for SMS OTP |

---

## 6. Database Layer

### `app/database.py`

**Driver**: Motor (async MongoDB driver)

```python
client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DATABASE_NAME]
```

### MongoDB Collections

| Collection | Purpose | Key Fields |
|---|---|---|
| `users` | Admin user accounts | `name`, `email`, `passwordHash`, `role`, `status`, `phone_number`, `otp`, `otp_expires_at`, `otp_last_sent_at`, `createdAt` |
| `pages` | Documentation page records | `slug`, `title`, `content`, `category`, `sidebar_position`, `sidebar_label`, `isDraft`, `authorId`, `change_log`, `createdAt`, `updatedAt` |
| `sidebar_tree` | Sidebar structure (single doc) | `_id: "main"`, `tree` (nested array), `updated_at`, `updated_by` |
| `chat_messages` | Team chat messages | `text`, `authorId`, `authorName`, `createdAt` |
| `admin_notes` | Personal admin notes | `adminId`, `workspaceId`, `title`, `content`, `createdAt`, `updatedAt` |
| `workspaces` | Note workspace folders | `adminId`, `name`, `createdAt` |
| `password_resets` | OTP records for password reset | `email`, `otp`, `expiresAt`, `used`, `createdAt` |

### Admin User Schema (MongoDB Document)

```json
{
  "_id": ObjectId,
  "name": "John Doe",
  "email": "john@example.com",
  "passwordHash": "...",
  "phone_number": "+251912345678",
  "role": "admin | super_admin",
  "status": "pending | approved | rejected",
  "otp": "123456",
  "otp_expires_at": ISODate,
  "otp_last_sent_at": ISODate,
  "createdAt": ISODate
}
```

---

## 7. Authentication & Authorization

### 7.1 JWT System (`auth/jwt.py`)

**Token creation:**
```python
def make_token(user_id: str, role: str) -> str:
    payload = {'sub': user_id, 'role': role, 'exp': datetime.utcnow() + timedelta(minutes=1440)}
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
```

**Token validation chain:**
```
OAuth2PasswordBearer (tokenUrl='/auth/login')
    → current_user()         # Validates JWT, fetches user, checks approved status
        → admin_only()       # Requires role: admin or super_admin
        → portal_user()      # Requires role: admin, developer, or super_admin
```

### 7.2 Auth Guard Middleware (`middleware/auth_guard.py`)

| Guard Function | Dependency Chain | Access Level |
|---|---|---|
| `require_approved` | `current_user` → status check | Any approved user |
| `require_approved_admin` | `require_approved` | Any approved admin |
| `require_super_admin` | `require_approved` → role check | Super admin only |

### 7.3 Role Hierarchy

```
super_admin  →  Full access (user management, approvals, content, all features)
admin        →  Content management (docs, sidebar, chat, notes)
developer    →  Read-only portal access (via portal_user guard)
```

### 7.4 Password Storage

> **Current implementation**: Passwords are stored in plaintext (per project decision). The `hash_pw()` function simply returns the password as-is, and `verify_pw()` does a direct string comparison.

---

## 8. API Routes & Endpoints

### 8.1 Authentication (`/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register new admin (status=pending) |
| `POST` | `/auth/login` | ❌ | Password login → triggers OTP → returns `{requires_otp: true}` |
| `POST` | `/auth/signup` | ❌ | Alternative signup endpoint (same as register) |
| `POST` | `/auth/send-otp` | ❌ | Resend OTP via SMS + email |
| `POST` | `/auth/verify-otp` | ❌ | Verify 6-digit OTP → returns JWT token |
| `POST` | `/auth/forgot-password` | ❌ | Request password reset OTP |
| `POST` | `/auth/reset-password` | ❌ | Verify reset OTP + set new password |

### 8.2 Pages (`/pages`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/pages` | `portal_user` | List all pages (slug, title, category, position) |
| `GET` | `/pages/{slug}` | `portal_user` | Get page content (with GitHub fallback) |
| `POST` | `/pages` | `admin_only` | Create new page + push to GitHub |
| `PATCH` | `/pages/{slug}` | `admin_only` | Update page + push to GitHub |

### 8.3 Content (`/content`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/content/save` | `current_user` | Save content to GitHub + MongoDB |
| `POST` | `/content/trigger-rebuild` | `current_user` | Trigger Vercel docs site rebuild |
| `GET` | `/content/history/{slug}` | `current_user` | Get commit history (page + sidebar) |
| `POST` | `/content/revert` | `current_user` | Revert page/sidebar to a previous commit |

### 8.4 Sidebar (`/sidebar`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/sidebar` | (via db dep) | Get the full sidebar tree |
| `POST` | `/sidebar` | `admin_only` | Save sidebar tree → generate `sidebars.ts` → push to GitHub → rebuild |
| `POST` | `/sidebar/page` | `admin_only` | Create a new page node + `.md` file |
| `DELETE` | `/sidebar/page/{slug}` | `admin_only` | Delete page (GitHub file + MongoDB record) |

### 8.5 Chat (`/chat`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/chat/messages` | `current_user` | Get chat messages (default: 100, oldest first) |
| `POST` | `/chat/messages` | `current_user` | Send a message (max 2000 chars) |

### 8.6 Notes (`/notes`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/notes/` | `current_user` | Get notes for a workspace |
| `POST` | `/notes/` | `current_user` | Create a new note |
| `PATCH` | `/notes/{note_id}` | `current_user` | Update a note |
| `DELETE` | `/notes/{note_id}` | `current_user` | Delete a note |
| `GET` | `/notes/workspaces` | `current_user` | List user workspaces |
| `POST` | `/notes/workspaces` | `current_user` | Create a workspace |
| `DELETE` | `/notes/workspaces/{id}` | `current_user` | Delete workspace + all its notes |

### 8.7 Admin Management (root prefix)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/users` | `super_admin` | List all approved admins |
| `PATCH` | `/admin/users/{id}/role` | `super_admin` | Change admin role |
| `DELETE` | `/admin/users/{id}` | `super_admin` | Remove an admin |
| `GET` | `/admin/approvals` | `super_admin` | List pending signups |
| `PATCH` | `/admin/approve/{id}` | `super_admin` | Approve a pending admin |
| `PATCH` | `/admin/reject/{id}` | `super_admin` | Reject a pending admin |

---

## 9. Service Layer

### 9.1 OTP Service (`services/otp_service.py`)

- **Generation**: Random 6-digit number, zero-padded (`str(random.randint(0, 999999)).zfill(6)`)
- **Storage**: Saved directly in the user's MongoDB document (`otp`, `otp_expires_at`, `otp_last_sent_at`)
- **Expiration**: 5 minutes from generation
- **Rate limiting**: 60-second cooldown between OTP requests (checked in route)
- **Verification**: String comparison (stripped + cast to string on both sides)
- **Cleanup**: On successful verification, OTP fields are cleared from the document

### 9.2 Email Service (`services/email_service.py`)

**Multi-provider cascade** (tries each in order until one succeeds):

```
1. Resend API (Primary)  ──► if RESEND_API_KEY is set
       ↓ (on failure)
2. SendGrid API           ──► if SENDGRID_API_KEY is set
       ↓ (on failure)
3. SMTP Fallback           ──► if SMTP_HOST is set
       ↓ (on failure)
4. Log warning (no email sent)
```

**Email types:**

| Function | Recipient | Trigger |
|---|---|---|
| `send_new_signup_alert()` | All super admins | New admin signup |
| `send_approval_email()` | Applicant | Admin approved |
| `send_rejection_email()` | Applicant | Admin rejected |
| `send_otp_email()` | Admin | OTP backup (alongside SMS) |

### 9.3 SMS Service (`services/sms_service.py`)

- **Provider**: Twilio
- **Phone format**: Supports Ethiopian numbers (`+251` prefix)
  - `0912345678` → `+251912345678`
  - `912345678` → `+251912345678`
  - `+251912345678` → unchanged
- **Graceful degradation**: If Twilio credentials are not configured, SMS is skipped with a warning
- **Error handling**: Raises exception on failure (caught by the calling route)

---

## 10. GitHub Integration

### `app/github_client.py`

The backend uses GitHub as the **source of truth** for documentation content. All `.md` files and the sidebar configuration live in the GitHub repository.

### 10.1 Core Operations

| Function | Description |
|---|---|
| `get_repo()` | Returns a PyGithub `Repository` object for the configured repo |
| `write_doc(slug, content, message)` | Write/update a doc `.md` file (`docs-site/docs/{slug}.md`) |
| `write_file(path, content, message)` | Write/update any file in the repo (create or update) |
| `delete_file(path, message)` | Delete a file from the repo |
| `get_file_history(slug)` | Get commit history for a doc + sidebar (combined, sorted by date) |
| `get_file_at_commit(slug, sha)` | Get file content at a specific commit SHA |
| `list_all_docs()` | Recursively list all `.md` files in the docs folder |
| `_trigger_vercel_rebuild()` | Fire the Vercel deploy hook to trigger a new build |

### 10.2 Content Pipeline

```
Portal Editor (HTML)
    │
    ▼ (Turndown: HTML → Markdown)
    │
Portal API Call (Markdown string)
    │
    ▼ POST /content/save
    │
Backend adds frontmatter:
    ---
    title: Page Title
    sidebar_label: Sidebar Label
    ---
    [markdown content]
    │
    ▼ write_file() → GitHub API
    │
GitHub Repository (docs-site/docs/{slug}.md)
    │
    ▼ Vercel Deploy Hook
    │
Docusaurus Build → Live Docs Site
```

### 10.3 Sidebar Pipeline

```
Portal Sidebar Editor (drag & drop tree)
    │
    ▼ POST /sidebar
    │
Backend:
    1. Sanitize tree (remove numbered prefixes from slugs)
    2. Filter tree (remove empty labels, junk slugs, empty categories)
    3. Save to MongoDB (sidebar_tree collection)
    4. Generate sidebars.ts (Docusaurus TypeScript config)
    5. Validate generated content (security checks)
    6. Push sidebars.ts + sidebar-state.json to GitHub
    7. Trigger Vercel rebuild
```

### 10.4 Sidebar Generation Validation

The `generate_sidebars_ts()` function includes hardening checks:
- Must contain `SidebarsConfig` type import
- Must contain `export default sidebars`
- Must NOT contain git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- Must NOT contain `undefined` or `null` strings
- Returns `None` on validation failure (route returns 500)

---

## 11. Deployment

### 11.1 Render Configuration (`render.yaml`)

```yaml
services:
  - type: web
    name: delta-labs-backend
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 11.2 Required Render Environment Variables

All variables listed in the `config.py` section must be set in the Render dashboard. Key ones:

- `MONGO_URI` — MongoDB Atlas connection string
- `DATABASE_NAME` — Target database name
- `SECRET_KEY` — JWT signing secret
- `GITHUB_TOKEN` — GitHub personal access token
- `GITHUB_REPO` — Repository path (e.g., `owner/delta-labs-docs`)
- `VERCEL_DEPLOY_HOOK_URL` — Vercel webhook URL
- `RESEND_API_KEY` — Email API key
- `FROM_EMAIL` — Sender address
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` — SMS

### 11.3 CORS Configuration

Currently set to allow all origins (`*`) for development flexibility:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

> **Production recommendation**: Restrict `allow_origins` to the specific Portal and Docs Site URLs.

---

## Summary

The Delta Labs Docs backend is a **FastAPI-based REST API** that:

1. **Manages admin users** with a signup → approval → 2FA login workflow
2. **Persists documentation** in both MongoDB (for portal editing) and GitHub (as source of truth)
3. **Automates deployments** by triggering Vercel rebuilds after any content change
4. **Provides collaboration tools** including team chat and personal notes
5. **Supports role-based access** with `super_admin` and `admin` tiers
6. **Uses a multi-provider email strategy** (Resend → SendGrid → SMTP) for reliability
7. **Delivers OTP codes** via SMS (Twilio) with email backup for 2FA
