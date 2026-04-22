---
title: Ws:Explanation:Readmeauth
sidebar_label: Ws:Explanation:Readmeauth
id: readmeauth
---

```markdown
# src/components/features/auth/ — Auth Form Primitives

**Location:** `deltalabs-frontend/src/components/features/auth/`
**Type:** Feature-Specific UI Components (Auth Domain)

---

## Overview

These are the **reusable UI building blocks** for authentication forms — the inputs,
buttons, labels, and panels that appear on the login, signup, and password-recovery
pages. They live here rather than inside the Auth module because they could
theoretically be used in any future auth-adjacent UI.

---

## Form Field Components

| Component | Purpose |
|---|---|
| `AuthFields.tsx` | Renders standard text input fields (email, name) styled for auth forms. |
| `AuthPasswordField.tsx` | Password input with show/hide toggle eye icon. |
| `AuthPhoneField.tsx` | Phone number input with country code prefix selector. |
| `AuthOtpField.tsx` | A row of single-character inputs for OTP (one-time password) codes. Handles auto-advance on keypress. |
| `AuthSelectField.tsx` | A styled dropdown select for auth forms (e.g. selecting country or role). |
| `AuthRadioGroup.tsx` | A set of radio buttons for auth choices (e.g. "I am a Student / Instructor"). |

---

## Action Components

| Component | Purpose |
|---|---|
| `AuthPrimaryButton.tsx` | The main submit button for auth forms. Shows a loading spinner during API calls. |
| `AuthDivider.tsx` | A horizontal rule with text like "or continue with" between form and social login. |
| `AuthBottomSwitchLink.tsx` | The "Already have an account? Log in" / "Don't have an account? Sign up" link at the bottom. |

---

## Social Login Components

| Component | Purpose |
|---|---|
| `SocialProvidersRow.tsx` | Renders a row of social login buttons (Google, GitHub, etc.). |
| `SocialProviderGlyphs.tsx` | SVG icon definitions for each social provider brand logo. |

---

## Feedback Components

| Component | Purpose |
|---|---|
| `AuthStatusBanner.tsx` | Displays success or error messages after a form submission (wraps `StatusBanner`). |
| `useAuthResponseBanner.ts` | A custom hook that manages the banner's `message` and `type` state based on API mutation results. |

---

## Style Utilities

| File | Purpose |
|---|---|
| `authFormClasses.ts` | CSS class name constants for form layout (grid, gap, etc.) shared across all auth forms. |
| `authInputStyles.ts` | Class strings for auth-specific input styling (height, border, focus ring). |
| `authPrimaryButtonStyles.ts` | Class strings for the primary auth button at different states (idle, loading, disabled). |

---

## master/ Sub-folder

| Component | Purpose |
|---|---|
| `AuthModalShell.tsx` | The modal container frame for auth flows shown inside a dialog (when a guest tries to do a gated action). |
| `AuthModalGateway.tsx` | Decides which auth view to show inside the modal — login, signup, or recover — based on a state machine. |

---

## index.ts

Re-exports all auth components for clean imports.

---

## Mental Model

These components are the LEGO bricks. The views in `src/modules/Auth/views/`
(like `LoginPageView.tsx`) are the assembled LEGO models. The views import and
compose these primitives into full form pages.
```
