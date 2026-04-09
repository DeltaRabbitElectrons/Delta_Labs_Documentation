# Delta Labs Docs — Frontend Standard

> This document defines the frontend architecture, technology stack, design conventions, and component patterns used across both frontend applications in the Delta Labs Docs system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Application Architecture](#application-architecture)
3. [Portal (Admin Interface)](#portal-admin-interface)
4. [Docs Site (Public Documentation)](#docs-site-public-documentation)
5. [Design System](#design-system)
6. [State Management](#state-management)
7. [API Communication](#api-communication)
8. [Authentication Flow (Frontend)](#authentication-flow-frontend)
9. [Routing & Navigation](#routing--navigation)
10. [Component Architecture](#component-architecture)
11. [Deployment](#deployment)

---

## 1. System Overview

The Delta Labs Docs platform has **two separate frontend applications**:

| Application | Purpose | Framework | Hosting |
|---|---|---|---|
| **Portal** (`/portal`) | Admin CMS for managing documentation | Next.js 16.1.6 + React 19 | Vercel |
| **Docs Site** (`/docs-site`) | Public-facing documentation site | Docusaurus 3.9.2 + React 19 | Vercel |

Both communicate with a shared **Python/FastAPI backend** hosted on Render.

---

## 2. Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Delta Labs Frontend                       │
│                                                                   │
│  ┌─────────────────────┐          ┌────────────────────────┐     │
│  │   Portal (Next.js)  │          │  Docs Site (Docusaurus) │     │
│  │                     │          │                          │     │
│  │  • Admin Login/2FA  │          │  • Public docs viewer    │     │
│  │  • Rich Text Editor │          │  • Sidebar navigation    │     │
│  │  • Sidebar Manager  │          │  • Search                │     │
│  │  • Team Chat        │          │  • Logout button         │     │
│  │  • Admin Notes      │          │                          │     │
│  │  • User Management  │          │                          │     │
│  │  • Publish Workflow  │          │                          │     │
│  └──────────┬──────────┘          └───────────┬──────────────┘     │
│             │                                  │                    │
│             └──────────┬───────────────────────┘                    │
│                        ▼                                            │
│            ┌──────────────────────┐                                 │
│            │  FastAPI Backend      │                                 │
│            │  (Render)             │                                 │
│            └──────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Portal (Admin Interface)

### 3.1 Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.1.6 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **TipTap** | 3.20.1 | Rich text editor (WYSIWYG) |
| **Lucide React** | 0.577.0 | Icon library |
| **Axios** | 1.13.6 | HTTP client (available, but `fetch` wrapper used primarily) |
| **@dnd-kit** | 6.3.1 / 10.0.0 | Drag and drop for sidebar management |
| **Marked** | 17.0.3 | Markdown parsing |
| **Turndown** | 7.2.2 | HTML-to-Markdown conversion |
| **uuid** | 13.0.0 | Unique ID generation |
| **react-colorful** | 5.6.1 | Color picker |
| **lowlight** | 3.3.0 | Syntax highlighting for code blocks |

### 3.2 Directory Structure

```
portal/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.tsx              # Root layout (ToastProvider wrapper)
│   │   ├── page.tsx                # Root redirect
│   │   ├── globals.css             # Global styles + animations
│   │   ├── login/page.tsx          # Login page (email/password + password reset)
│   │   ├── signup/page.tsx         # Admin signup (request access)
│   │   ├── verify-otp/page.tsx     # 2FA OTP verification page
│   │   ├── docs/                   # Documentation editor pages
│   │   │   ├── page.tsx            # Docs list/redirect
│   │   │   └── [...slug]/page.tsx  # Dynamic doc editor (catch-all route)
│   │   ├── chat/page.tsx           # Team chat interface
│   │   ├── notes/page.tsx          # Personal admin notes
│   │   └── admin/                  # Super admin features
│   │       ├── approvals/          # Pending admin approval queue
│   │       └── manage-admins/      # Admin role & user management
│   ├── components/                 # Shared UI components
│   │   ├── AdminNavbar.tsx         # Top navigation bar
│   │   ├── DocsSidebar.tsx         # Sidebar tree manager (drag & drop)
│   │   ├── EditToolbar.tsx         # Editor formatting toolbar
│   │   ├── EditableBlock.tsx       # Inline-editable content block
│   │   ├── LoadingScreen.tsx       # Full-page loading spinner
│   │   ├── Toast.tsx               # Toast notification system
│   │   ├── WorkspaceSwitcher.tsx   # Notes workspace switcher
│   │   ├── HistoryModal/           # Git commit history modal
│   │   ├── PublishButton/          # Batch publish button
│   │   └── RichEditor/             # TipTap WYSIWYG editor wrapper
│   ├── lib/                        # Shared utilities
│   │   ├── api.ts                  # Centralized API client (fetch wrapper)
│   │   ├── draftStore.ts           # LocalStorage-based draft management
│   │   ├── pendingChanges.ts       # Pending changes tracking store
│   │   └── utils.ts                # Helper functions (colors, dates)
│   └── styles/
│       └── design-system.css       # Design tokens & utility classes
├── public/                         # Static assets (logo, favicon)
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── next.config.ts                  # Next.js configuration
├── vercel.json                     # Vercel deployment settings
└── package.json
```

### 3.3 Key Pages

| Route | File | Description |
|---|---|---|
| `/login` | `app/login/page.tsx` | Authentication + password reset flow |
| `/signup` | `app/signup/page.tsx` | New admin registration (pending approval) |
| `/verify-otp` | `app/verify-otp/page.tsx` | 6-digit OTP verification (2FA) |
| `/docs` | `app/docs/page.tsx` | Docs list / redirect to first doc |
| `/docs/[...slug]` | `app/docs/[...slug]/page.tsx` | Rich text page editor |
| `/chat` | `app/chat/page.tsx` | Team chat room |
| `/notes` | `app/notes/page.tsx` | Admin personal notes with workspaces |
| `/admin/approvals` | `app/admin/approvals/` | Pending admin approval list (super_admin) |
| `/admin/manage-admins` | `app/admin/manage-admins/` | Admin role management (super_admin) |

---

## 4. Docs Site (Public Documentation)

### 4.1 Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **Docusaurus** | 3.9.2 | Static documentation site generator |
| **React** | 19.x | UI library |
| **TypeScript** | 5.6.2 | Type safety |
| **MDX** | 3.x | Markdown with JSX support |
| **Prism React Renderer** | 2.3.0 | Code syntax highlighting |

### 4.2 Directory Structure

```
docs-site/
├── docs/                           # Markdown documentation files (managed via Portal)
├── src/
│   ├── components/
│   │   ├── AuthGuard/              # JWT-based access gate
│   │   ├── HomepageFeatures/       # Landing page feature cards
│   │   └── LoginPage/              # Docs site login form
│   ├── css/
│   │   └── custom.css              # Docusaurus theme overrides
│   ├── pages/                      # Custom pages
│   └── theme/
│       └── Root.tsx                 # Theme root wrapper (AuthGuard integration)
├── static/                         # Static files (images, etc.)
├── sidebars.ts                     # Auto-generated sidebar config
├── sidebar-state.json              # Sidebar tree state (synced from Portal)
├── docusaurus.config.ts            # Docusaurus configuration
├── vercel.json                     # Vercel deployment settings
└── package.json
```

### 4.3 Configuration Highlights

- **Route base path**: Docs are served at the root URL (`/`), not `/docs/`
- **Markdown format**: Pure `.md` (not MDX) with Mermaid diagram support
- **Blog**: Disabled
- **Custom navbar**: Includes a Logout button that clears `delta_token` from localStorage
- **Deploy hook**: Backend triggers Vercel rebuild via webhook after content changes

---

## 5. Design System

### 5.1 Design Tokens (`design-system.css`)

The portal uses a comprehensive CSS custom property-based design system:

**Color Palette:**
```css
--accent-primary: #174A5F;       /* Official brand color — SaaS Blue */
--accent-hover: #123d4f;
--accent-light: #eef7f9;
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--text-primary: #0f172a;         /* Deep Navy Black */
--text-secondary: #475569;       /* Slate Gray */
--success: #10b981;              /* Emerald */
--error: #ef4444;                /* Rose */
--warning: #f59e0b;              /* Amber */
```

**Design Principles:**
- **Glassmorphism** effects for panels (`backdrop-filter: blur(12px)`)
- **Premium shadows** with layered multi-shadow approach
- **Smooth transitions** using `cubic-bezier(0.4, 0, 0.2, 1)` easing
- **Custom scrollbars** for premium feel

### 5.2 Typography

- **Primary font**: Inter (Google Fonts) — `wght@300;400;500;600;700`
- **Monospace font**: JetBrains Mono — for code blocks and technical content
- **Base font size**: 14px
- **Font smoothing**: Antialiased rendering on all platforms

### 5.3 Component Utility Classes

| Class | Purpose |
|---|---|
| `.premium-card` | Elevated card with hover lift effect |
| `.glass-panel` | Glassmorphism panel with blur backdrop |
| `.glow-button` | Gradient button with luminous shadow |
| `.login-card` | Frosted glass login container |
| `.animate-fade-in` | Fade-in entrance animation |
| `.animate-slide-up` | Slide-up entrance animation |

### 5.4 Button Variants

The system defines three themed action buttons:

| Button | Style | Usage |
|---|---|---|
| `.history-trigger-btn` | Emerald gradient + rotate-on-hover icon | View commit history |
| `.view-live-btn` | Electric Blue gradient + diagonal arrow | Open live docs site |
| `.logout-btn` | Crimson gradient + slide-right icon | Sign out |

---

## 6. State Management

The portal uses **no external state library** (no Redux, Zustand, etc.). State is managed through:

### 6.1 React Component State
- Standard `useState` / `useEffect` hooks for page-level state
- Client components (`'use client'` directive) for all interactive pages

### 6.2 LocalStorage-Based Draft System (`draftStore.ts`)

```
DraftStore (Singleton)
├── Page Drafts      → localStorage key: "delta_draft_pages"
├── Sidebar Drafts   → localStorage key: "delta_draft_sidebar"
└── Publish Workflow  → Batch save all drafts → API → Clear storage
```

- Drafts auto-save to `localStorage` as the admin edits
- If content matches the original, the draft is automatically removed
- The `publishChanges()` method saves all pages, saves sidebar, triggers Vercel rebuild, then clears all drafts

### 6.3 Pending Changes Tracker (`pendingChanges.ts`)

A pub/sub singleton that tracks unsaved changes across the app:
- Components subscribe to change notifications
- The Publish Button shows a badge counter of pending changes
- Changes are keyed by `type:id` (e.g., `page:getting-started/intro`)

### 6.4 Session & Token Storage

| Key | Storage | Purpose |
|---|---|---|
| `portal_token` | localStorage | JWT access token |
| `role` | localStorage | User role (`admin` / `super_admin`) |
| `name` | localStorage | Display name |
| `email` | localStorage | User email |
| `otp_email` | sessionStorage | Email for OTP verification (temporary) |
| `auth_message` | sessionStorage | Session-expired message (temporary) |

---

## 7. API Communication

### 7.1 Centralized API Client (`api.ts`)

All backend communication goes through a single `api` object:

```typescript
export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
```

**Key behaviors:**
- Base URL from `NEXT_PUBLIC_API_URL` environment variable (default: `http://localhost:8000`)
- Automatically attaches `Authorization: Bearer <token>` header from localStorage
- On `401` response: clears token, sets session message, redirects to `/login`
- Handles empty responses and non-JSON responses gracefully

### 7.2 Environment Variables

| Variable | Application | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Portal | Backend API base URL |
| `REACT_APP_API_URL` | Docs Site | Backend API URL (Docusaurus custom field) |

---

## 8. Authentication Flow (Frontend)

```
Login Page (/login)
     │
     ├─ Enter email + password
     │       │
     │       ▼
     │  POST /auth/login
     │       │
     │       ├─ { requires_otp: true } ──► Store email in sessionStorage
     │       │                               Navigate to /verify-otp
     │       │
     │       └─ (direct token — legacy) ──► Store token in localStorage
     │                                        Navigate to /docs
     │
     ▼
OTP Page (/verify-otp)
     │
     ├─ Enter 6-digit code (sent via SMS + email)
     │       │
     │       ▼
     │  POST /auth/verify-otp
     │       │
     │       └─ { access_token, role, name } ──► Store in localStorage
     │                                             Navigate to /docs
     │
     ▼
Protected Pages (docs, chat, notes, admin)
     │
     └─ API client auto-attaches Bearer token on every request
         On 401 → auto-redirect to /login
```

---

## 9. Routing & Navigation

### 9.1 Portal Navigation

The portal uses a top navigation bar (`AdminNavbar.tsx`) with these sections:

| Nav Item | Route | Access |
|---|---|---|
| Documentation | `/docs` | All admins |
| Chat | `/chat` | All admins |
| Notes | `/notes` | All admins |
| Approvals | `/admin/approvals` | Super admin only |
| Manage Admins | `/admin/manage-admins` | Super admin only |
| View Live Docs | External link | All admins |
| Logout | Clears token → `/login` | All admins |

### 9.2 Docs Site Navigation

The docs site uses Docusaurus's built-in sidebar navigation:
- Sidebar structure is auto-generated from `sidebars.ts`
- `sidebars.ts` is generated programmatically by the backend from the tree stored in MongoDB
- Categories are collapsible with `collapsed: false` default
- The navbar has a Documentation link and a Logout button

---

## 10. Component Architecture

### 10.1 Rich Text Editor (TipTap)

The portal includes a full WYSIWYG editor powered by TipTap with these extensions:

- **Starter Kit**: Headings, bold, italic, lists, blockquotes, code
- **Code Block (Lowlight)**: Syntax-highlighted code blocks
- **Color & Text Style**: Custom text colors
- **Highlight**: Background text highlighting
- **Link**: Hyperlink insertion
- **Table**: Full table support (header, cell, row)
- **Text Align**: Left, center, right, justify
- **Underline**: Underlined text
- **YouTube**: Embedded YouTube videos

**Content flow**: Editor produces HTML → `Turndown` converts to Markdown → API sends Markdown to backend → Backend writes `.md` file to GitHub

### 10.2 Sidebar Manager (DocsSidebar)

A drag-and-drop sidebar tree editor using `@dnd-kit`:
- Supports categories (folders) and pages (leaf nodes)
- Inline renaming with input validation
- Add new page / category with auto-slug generation
- Delete pages (removes `.md` file from GitHub + MongoDB record)
- Tree changes are saved as a draft and batch-published

### 10.3 Toast Notification System

A context-based toast notification provider:
- Success, error, and info variants
- Auto-dismiss with configurable timeout
- Stacked toast display

---

## 11. Deployment

### 11.1 Portal Deployment (Vercel)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "headers": [{ "source": "/(.*)", "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }] }]
}
```

- **No-cache headers** ensure admins always see the latest content
- Environment variable `NEXT_PUBLIC_API_URL` must point to the Render backend URL

### 11.2 Docs Site Deployment (Vercel)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "docusaurus",
  "headers": [{ "source": "/(.*)", "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }] }]
}
```

- **Rebuild is triggered automatically** by the backend via `VERCEL_DEPLOY_HOOK_URL` after any content or sidebar change
- The docs site is a **static build** — changes only appear after a new Vercel deployment

---

## Summary

The Delta Labs Docs frontend consists of two complementary applications:

1. **Portal**: A feature-rich Next.js admin interface for content management, team collaboration, and user administration — with 2FA, draft management, rich text editing, and batch publishing.

2. **Docs Site**: A clean Docusaurus-powered documentation site that serves content managed through the Portal — with auto-generated sidebars, JWT-gated access, and automated deployments.

Both apps follow a **localStorage-first** approach for auth tokens, use **CSS custom properties** for theming, and rely on a **centralized API client** pattern for backend communication.
