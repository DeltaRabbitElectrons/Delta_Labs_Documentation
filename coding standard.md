# Delta Labs Docs — Coding Standard

> This document defines the coding conventions, naming patterns, file organization rules, error handling strategies, and best practices observed and enforced across the Delta Labs Docs codebase (backend, portal, and docs site).

---

## Table of Contents

1. [General Principles](#general-principles)
2. [Backend Coding Standards (Python / FastAPI)](#backend-coding-standards-python--fastapi)
3. [Frontend Coding Standards (TypeScript / React)](#frontend-coding-standards-typescript--react)
4. [Naming Conventions](#naming-conventions)
5. [Error Handling Patterns](#error-handling-patterns)
6. [API Design Conventions](#api-design-conventions)
7. [Database Conventions](#database-conventions)
8. [Git & Version Control](#git--version-control)
9. [Security Practices](#security-practices)
10. [Testing & Debugging](#testing--debugging)
11. [Environment & Configuration](#environment--configuration)

---

## 1. General Principles

### 1.1 Core Philosophy

- **Simplicity over abstraction**: Avoid over-engineering. Use straightforward patterns.
- **Explicit over implicit**: Be clear about types, returns, and side effects.
- **Fail gracefully**: Always provide fallback behavior; never let the user see a raw stack trace.
- **Single responsibility**: Each file/module handles one concern.
- **Consistency**: Follow established patterns even if you think there's a "better" way — consistency across the codebase is paramount.

### 1.2 Language Standards

| Layer | Language | Style Guide |
|---|---|---|
| Backend | Python 3.x | PEP 8 (loosely — 4-space indentation, snake_case) |
| Portal | TypeScript | Next.js / React conventions |
| Docs Site | TypeScript | Docusaurus conventions |
| Styling | CSS + Tailwind | CSS custom properties for tokens, Tailwind for layout |

---

## 2. Backend Coding Standards (Python / FastAPI)

### 2.1 File Organization

- **One router per file** in `app/routes/`
- **One service per file** in `app/services/`
- **Pydantic models** in either `app/models/` (data models) or `app/schemas/` (request/response shapes)
- **Middleware** in `app/middleware/`
- **Auth logic** in `app/auth/`
- **Configuration** centralized in `app/config.py`

### 2.2 Route Pattern

Every route file follows this pattern:

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.auth.jwt import current_user  # or admin_only, portal_user

router = APIRouter()

class RequestBody(BaseModel):
    field: str

@router.post("/endpoint")
async def my_endpoint(body: RequestBody, db=Depends(get_db), user=Depends(current_user)):
    # 1. Authorization check (if needed beyond the dependency)
    # 2. Business logic
    # 3. Database operation
    # 4. Return response dict
    return {"success": True}
```

### 2.3 Async Pattern

- All route handlers are `async def`
- All MongoDB operations use `await` (Motor async driver)
- External service calls (email, SMS) may be sync or async depending on the library
- Use `async` for email service functions even when calling sync libraries (for consistency)

### 2.4 Dependency Injection

FastAPI's `Depends()` is used for:

| Pattern | Usage |
|---|---|
| `db=Depends(get_db)` | Inject MongoDB database reference |
| `user=Depends(current_user)` | Require valid JWT, fetch user |
| `user=Depends(admin_only)` | Require admin or super_admin role |
| `user=Depends(portal_user)` | Require admin, developer, or super_admin |
| `user=Depends(require_super_admin)` | Require super_admin role |

### 2.5 Request/Response Schema Pattern

**Request bodies** use Pydantic `BaseModel`:

```python
class CreatePage(BaseModel):
    slug: str
    title: str
    content: str
    category: str
    sidebar_position: int = 1
    sidebar_label: Optional[str] = None
```

**Response**: Plain dicts (no response model enforcement in most routes). Use `response_model` on `GET` endpoints that return lists:

```python
@router.get('/admin/users', response_model=List[AdminUserItem])
```

### 2.6 Logging

Use Python's `logging` module, not `print()` for production logs:

```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"Writing to GitHub: {file_path}")
logger.error(f"GitHub API error: {e}")
logger.warning(f"Missing env var: {var}")
```

> **Note**: Some legacy `print()` statements exist in the codebase for debugging (e.g., `[OTP]`, `[SMS]`, `[LOGIN]` prefixed). New code should use the `logger` object.

---

## 3. Frontend Coding Standards (TypeScript / React)

### 3.1 File Organization

- **One page component per file** in `app/` (Next.js App Router)
- **Shared components** in `components/`
- **Utilities and stores** in `lib/`
- **Styles** in `styles/` (design tokens) and `app/globals.css` (global styles)

### 3.2 Component Pattern

All interactive pages use the **client component** pattern:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function MyPage() {
  const [data, setData] = useState<MyType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await api.get<MyType[]>('/my-endpoint');
      setData(result);
    } catch (err) {
      console.error('Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

### 3.3 State Management Rules

1. **Use `useState` for component-local state** — no external state library
2. **Use `localStorage` for persistence** — tokens, drafts, user info
3. **Use `sessionStorage` for transient data** — OTP email, session messages
4. **Singleton classes for cross-component state** — `DraftStore`, `PendingChangesStore`

### 3.4 TypeScript Usage

- Use `interface` for object shapes (not `type` alias for objects)
- Use explicit types for state: `useState<MyType[]>([])`
- Use `any` sparingly and only for API responses where the shape is dynamic
- Path aliases: `@/` maps to `src/`

### 3.5 CSS / Styling Rules

**Priority order:**
1. **CSS custom properties** (`var(--accent-primary)`) for design tokens
2. **Tailwind utility classes** for layout and spacing
3. **Inline styles** only when dynamic values are needed (e.g., computed colors)
4. **CSS classes in `globals.css`** for complex animations and pseudo-elements
5. **`styled jsx`** for page-specific overrides (used sparingly)

**Naming for custom CSS classes:**
- Use kebab-case: `.history-trigger-btn`, `.premium-card`, `.glass-panel`
- Use BEM-lite for related groups: `.attribution-badge`, `.attribution-text`, `.attribution-time`

---

## 4. Naming Conventions

### 4.1 Backend (Python)

| Item | Convention | Example |
|---|---|---|
| Files | snake_case | `admin_auth.py`, `otp_service.py` |
| Functions | snake_case | `get_all_admins()`, `send_otp_email()` |
| Classes | PascalCase | `SignupIn`, `AdminUserItem`, `Settings` |
| Variables | snake_case | `admin_doc`, `clean_tree`, `file_path` |
| Constants | UPPER_SNAKE | `STORAGE_KEYS`, `_JUNK_SLUG_RE` |
| Route prefixes | lowercase, hyphenated | `/auth/send-otp`, `/admin/manage-admins` |
| DB collection names | snake_case | `sidebar_tree`, `chat_messages`, `admin_notes` |

### 4.2 Frontend (TypeScript / React)

| Item | Convention | Example |
|---|---|---|
| Files (pages) | `page.tsx` (Next.js convention) | `app/login/page.tsx` |
| Files (components) | PascalCase | `AdminNavbar.tsx`, `DocsSidebar.tsx` |
| Files (utilities) | camelCase | `draftStore.ts`, `pendingChanges.ts` |
| Components | PascalCase | `LoadingScreen`, `EditableBlock` |
| Functions / hooks | camelCase | `handleLogin()`, `getColorFromName()` |
| State variables | camelCase | `loginLoading`, `otpCode`, `resendTimer` |
| CSS custom properties | kebab-case with prefix | `--accent-primary`, `--bg-secondary` |
| LocalStorage keys | snake_case with prefix | `portal_token`, `delta_draft_pages` |
| API paths | lowercase, hyphenated | `/auth/verify-otp`, `/content/trigger-rebuild` |

### 4.3 Documentation Slugs

- Use kebab-case: `getting-started`, `api-reference`
- Use forward slashes for nesting: `architecture/data-flow`
- No numbered prefixes in final slugs (sanitized by backend): `00-intro` → `intro`

---

## 5. Error Handling Patterns

### 5.1 Backend Error Handling

**Route-level errors:**
```python
# Validation errors → 400
raise HTTPException(400, "Email already registered")

# Not found → 404
raise HTTPException(404, "Page not found")

# Auth errors → 401 or 403
raise HTTPException(401, "Invalid or expired token")
raise HTTPException(403, "Super admin access required")

# Rate limiting → 429
raise HTTPException(status_code=429, detail={"message": "...", "seconds_remaining": int})

# Server errors → 500 (usually auto from global handler)
raise HTTPException(500, "GitHub write failed")
```

**Service-level errors:**
- Email failures: Caught and logged, but do NOT block the main operation
- SMS failures: Raised as exceptions, caught in the route handler
- GitHub failures: Return `False` and let the route decide how to handle

**Global exception handler:**
```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception caught: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error", "message": str(exc)})
```

### 5.2 Frontend Error Handling

**API call pattern:**
```typescript
try {
  const result = await api.post('/endpoint', data);
  // Success path
} catch (err: any) {
  setError(err.message || 'Something went wrong');
} finally {
  setLoading(false);
}
```

**Auto-redirect on 401:**
The centralized API client automatically clears the token and redirects to `/login` on any `401` response.

**User-facing messages:**
- Never show raw error objects
- Provide clear, actionable messages: "Invalid email or password. Please try again."
- Use inline error UI (red border, error text below input)

---

## 6. API Design Conventions

### 6.1 HTTP Methods

| Method | Usage |
|---|---|
| `GET` | Retrieve data (lists, single items, history) |
| `POST` | Create new resources, trigger actions (login, save, rebuild) |
| `PATCH` | Update existing resources (partial updates) |
| `DELETE` | Remove resources |

### 6.2 URL Structure

```
/{resource}                    → List / Create
/{resource}/{id}               → Get / Update / Delete
/{resource}/{id}/{sub-action}  → Nested actions (e.g., /admin/users/{id}/role)
```

### 6.3 Response Format

**Success responses:**
```json
{ "success": true, "slug": "getting-started" }
{ "message": "Page updated and live" }
{ "id": "507f1f77bcf86cd799439011" }
```

**Error responses (via HTTPException):**
```json
{ "detail": "Email already registered" }
{ "detail": "Internal Server Error", "message": "..." }
```

### 6.4 Authentication Header

```
Authorization: Bearer <jwt_token>
```

---

## 7. Database Conventions

### 7.1 MongoDB Patterns

- **No ORM**: Direct Motor/PyMongo operations
- **Upsert pattern**: Used for pages and sidebar to create-or-update in one call
- **Object IDs**: Always convert to string for JSON responses: `str(doc['_id'])`
- **Date fields**: Use `datetime.utcnow()` for all timestamps
- **Single-document collections**: `sidebar_tree` uses `_id: "main"` as a singleton

### 7.2 Query Patterns

```python
# Find one
doc = await db.users.find_one({'email': body.email})

# Find many with limit
users = await db.users.find({'status': 'pending'}).to_list(100)

# Sorted with limit
messages = await db.chat_messages.find({}).sort("createdAt", -1).limit(100).to_list(100)

# Update one
await db.users.update_one({'_id': ObjectId(id)}, {'$set': {'role': 'admin'}})

# Upsert
await db.pages.update_one({"slug": slug}, {"$set": data}, upsert=True)

# Push to array
await db.pages.update_one({"slug": slug}, {"$push": {"change_log": entry}})

# Delete with ownership check
await db.admin_notes.delete_one({"_id": ObjectId(note_id), "adminId": str(user["_id"])})
```

---

## 8. Git & Version Control

### 8.1 Commit Message Format

Backend-generated commits follow these patterns:

```
docs: content updated by {admin_name}
docs: create {slug} [{admin_name}]
docs: update {slug} [{admin_name}]
docs: create page '{title}' by {admin_name}
docs: delete page '{slug}' by {admin_name}
chore: update sidebar structure by {admin_name}
chore: update sidebar data by {admin_name}
revert: restore {slug} to {short_sha} by {admin_name}
revert: restore sidebar to {short_sha} by {admin_name}
revert: sync sidebars.ts by {admin_name}
```

### 8.2 Branch Strategy

- All changes push to the `main` branch (configurable via `GITHUB_BRANCH`)
- No feature branches for documentation content — all changes go live immediately

### 8.3 .gitignore Patterns

**Backend:**
- Python bytecode (`__pycache__/`)
- Virtual environments (`venv/`)
- Environment files (`.env`)

**Portal:**
- `node_modules/`
- `.next/`
- `.env.local`, `.env.production`

**Docs Site:**
- `node_modules/`
- `build/`
- `.env`

---

## 9. Security Practices

### 9.1 Authentication Security

| Practice | Implementation |
|---|---|
| **2FA enforcement** | Password login triggers mandatory OTP verification |
| **Rate limiting** | 60-second cooldown on OTP requests |
| **OTP expiration** | 5-minute TTL on all OTP codes |
| **OTP cleanup** | Codes cleared from DB after successful verification |
| **Session expiry** | JWT tokens expire after 24 hours |
| **Auto-logout** | Frontend clears token and redirects on 401 |
| **Email enumeration prevention** | Password reset returns same message regardless of email existence |

### 9.2 Authorization Security

| Practice | Implementation |
|---|---|
| **Role-based access** | Dependency injection guards on all protected routes |
| **Self-deletion prevention** | Super admins cannot delete their own account |
| **Last super admin protection** | Cannot demote the only remaining super_admin |
| **Approval gating** | `status: approved` required to log in and access any API |

### 9.3 Input Validation

| Practice | Implementation |
|---|---|
| **Email validation** | Pydantic `EmailStr` type on all email fields |
| **Sidebar validation** | `field_validator` on label (non-empty) and type (category/page) |
| **Junk slug filtering** | Regex-based filter for placeholder slugs |
| **Chat message limits** | Max 2000 characters, non-empty |
| **Password length** | Minimum 8 characters for password reset |

### 9.4 Known Security Considerations

> **Passwords are stored in plaintext**: The `hash_pw()` function currently returns the password as-is. This is a known project decision and should be addressed before production with critical data.

> **CORS is fully open**: `allow_origins=["*"]` should be restricted to specific frontend URLs in production.

---

## 10. Testing & Debugging

### 10.1 Debug Scripts

The backend includes multiple standalone Python scripts for debugging:

| Script | Purpose |
|---|---|
| `check_db.py` | Verify MongoDB connection |
| `check_users.py` | List users in the database |
| `check_pages.py` | List pages in the database |
| `check_log.py` | Check change logs |
| `test_login.py` | Test login flow |
| `debug_dns.py` | Debug DNS resolution |
| `inspect_db.py` | Inspect database state |

### 10.2 Logging Conventions

```python
# Structured log prefixes for different subsystems
print(f"[OTP] Saved OTP for {admin_id}")
print(f"[SMS] Sending OTP to: {formatted_number}")
print(f"[LOGIN] Password verified for {body.email}")
print(f"[VERIFY-OTP] email={body.email} otp={body.otp}")
print(f"[SEND-OTP] Request for: {body.email}")
```

### 10.3 Frontend Debugging

- All API errors are logged to `console.error()`
- The API client includes network error messages with backend status info
- Toast notifications surface errors to the admin user

---

## 11. Environment & Configuration

### 11.1 Environment File Pattern

Each application has its own `.env`:

```
backend/.env          → Python backend configuration
portal/.env.local     → Next.js local development
portal/.env.production → Next.js production
docs-site/.env        → Docusaurus configuration
```

### 11.2 Environment Variable Strategy

- **Backend**: `pydantic-settings` loads from `.env` file with type enforcement
- **Portal**: Next.js `NEXT_PUBLIC_` prefix for client-side variables
- **Docs Site**: Docusaurus `customFields` in config for API URL
- **Never** commit `.env` files to Git
- **Always** set required variables in the deployment platform (Render / Vercel)

### 11.3 Local Development Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Portal
cd portal
npm install
npm run dev  # → http://localhost:3000

# Docs Site
cd docs-site
npm install
npm start    # → http://localhost:3000
```

---

## Summary

The Delta Labs Docs codebase follows a **pragmatic, consistency-first coding standard**:

- **Python backend**: FastAPI with async patterns, Pydantic schemas, dependency injection for auth, structured logging
- **TypeScript frontend**: Next.js App Router with client components, centralized API client, localStorage-based state, CSS custom property design tokens
- **Error handling**: Graceful degradation everywhere — services fail silently, routes return clear error messages, the frontend never shows raw errors
- **Git integration**: Backend auto-commits to GitHub with structured messages, all content changes trigger automated deployments
- **Security**: 2FA via SMS + email, role-based guards, rate limiting, input validation — with known gaps (plaintext passwords, open CORS) documented for future hardening
