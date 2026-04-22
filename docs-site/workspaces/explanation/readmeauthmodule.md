---
title: Ws:Explanation:Readmeauthmodule
sidebar_label: Ws:Explanation:Readmeauthmodule
id: readmeauthmodule
---

```markdown
# src/modules/Auth/ — Authentication Module

**Location:** `deltalabs-frontend/src/modules/Auth/`
**Domain:** User authentication — login, signup, password recovery, OTP

---

## What It Does

Manages the entire authentication lifecycle: registering new users, logging existing
users in, handling OTP verification, and recovering forgotten passwords.

---

## api/

### `authApi.ts`
All direct API calls for authentication:
- `loginWithEmail(email, password)` — POST to `/auth/login/`, returns tokens + user.
- `signupWithEmail(data)` — POST to `/auth/register/`, creates a new user.
- `requestOtp(phoneOrEmail)` — POST to `/auth/otp/request/`.
- `verifyOtp(code)` — POST to `/auth/otp/verify/`.
- `requestPasswordReset(email)` — POST to `/auth/password-reset/`.
- `confirmPasswordReset(token, newPassword)` — POST to `/auth/password-reset/confirm/`.
- `loginWithSocialProvider(provider, token)` — POST to `/auth/social/`.

### `authValidation.ts`
Client-side form validation functions. Validates email format, password strength
(min length, special characters), phone number format, OTP length, etc.
These run before the API call to give instant user feedback.

### `mockAuthStore.ts`
A fake in-memory auth store for **development and testing**. Allows working on
auth UI without needing the real backend running. Simulates success/failure
responses for every auth operation.

---

## hooks/

### `useAuthMutations.ts`
TanStack Query `useMutation` wrappers for all auth operations:
- `useLoginMutation()` — runs `loginWithEmail`, on success saves the session and redirects.
- `useSignupMutation()` — runs `signupWithEmail`, handles OTP flow next steps.
- `usePasswordResetMutation()` — handles the reset request flow.

### `authMutationKeys.ts`
String keys for each auth mutation (used by TanStack Query to track in-flight state).

---

## types/

### `auth.ts`
TypeScript interfaces for all auth data:
- `LoginCredentials` — `{ email: string; password: string }`
- `SignupData` — full registration form fields.
- `AuthTokens` — `{ access: string; refresh: string }`
- `AuthUser` — the logged-in user's profile.
- `OtpPayload`, `PasswordResetPayload`, `SocialAuthPayload`.

---

## views/

### `LoginPageView.tsx`
The full login page UI. Composes auth form primitives from `components/features/auth/`.
Handles the login form state, calls `useLoginMutation`, shows errors via `AuthStatusBanner`.

### `SignupPageView.tsx`
The full signup page UI. Multi-step: account type selection → personal info →
email/phone verification → confirmation. The largest auth view.

### `RecoverPageView.tsx`
Password recovery flow: enter email → receive link → enter new password.

---

## Mental Model

The Auth module is the "front door" of the application. Every user passes through
it at least once. `api/` is the lock mechanism, `views/` is the door and welcome
mat, `hooks/` is the doorbell that triggers the lock.
```
