# Delta Labs Docs — Implementation of Two-Factor Authentication (2FA)

> This document provides a complete technical breakdown of how Two-Factor Authentication (2FA) is implemented across the Delta Labs Docs system, covering the backend logic, frontend flow, OTP delivery mechanisms, and security safeguards.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Authentication Flow (Step-by-Step)](#authentication-flow-step-by-step)
4. [Backend Implementation](#backend-implementation)
   - [Login Route (Step 1 — Password Verification)](#41-login-route-step-1--password-verification)
   - [OTP Generation & Storage](#42-otp-generation--storage)
   - [OTP Delivery (SMS + Email)](#43-otp-delivery-sms--email)
   - [OTP Verification Route (Step 2 — Code Verification)](#44-otp-verification-route-step-2--code-verification)
   - [OTP Resend Route](#45-otp-resend-route)
5. [Frontend Implementation](#frontend-implementation)
   - [Login Page](#51-login-page)
   - [OTP Verification Page](#52-otp-verification-page)
   - [Token Storage & Session Management](#53-token-storage--session-management)
6. [OTP Delivery Channels](#otp-delivery-channels)
   - [SMS via Twilio](#61-sms-via-twilio)
   - [Email Backup](#62-email-backup)
7. [Security Safeguards](#security-safeguards)
8. [Rate Limiting](#rate-limiting)
9. [Database Schema for 2FA](#database-schema-for-2fa)
10. [Configuration Requirements](#configuration-requirements)
11. [Error Scenarios & Handling](#error-scenarios--handling)
12. [Flow Diagrams](#flow-diagrams)
13. [Files Involved](#files-involved)

---

## 1. Overview

The Delta Labs Docs system implements **mandatory two-factor authentication** for all admin portal logins. The 2FA system uses a **One-Time Password (OTP)** approach:

- **Factor 1**: Email + Password (knowledge factor)
- **Factor 2**: 6-digit OTP code sent via SMS and email (possession factor)

### Key Characteristics

| Feature | Detail |
|---|---|
| **OTP Length** | 6 digits (zero-padded) |
| **OTP TTL** | 5 minutes |
| **Delivery** | Primary: SMS (Twilio) · Backup: Email |
| **Rate Limit** | 60-second cooldown between OTP requests |
| **Storage** | Stored directly in the user's MongoDB document |
| **Cleanup** | OTP fields cleared after successful verification |
| **JWT Issuance** | Token is only issued AFTER successful OTP verification |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        2FA Authentication Flow                          │
│                                                                         │
│  ┌──────────┐    Step 1         ┌──────────────┐                       │
│  │  Portal   │ ──────────────► │  POST         │                       │
│  │  Login    │  email+password  │  /auth/login  │                       │
│  │  Page     │                  │               │                       │
│  └──────────┘    ◄──────────── │  ✓ password   │                       │
│       │         {requires_otp}  │  verified      │                       │
│       │                         └───────┬────────┘                       │
│       │                                 │                                │
│       │                                 ▼                                │
│       │                         ┌──────────────┐     ┌───────────┐     │
│       │                         │  OTP Service  │────►│  Twilio   │     │
│       │                         │  generate()   │     │  (SMS)    │     │
│       │                         │  save to DB   │     └───────────┘     │
│       │                         │               │     ┌───────────┐     │
│       │                         │               │────►│  Email    │     │
│       │                         └───────────────┘     │  (backup) │     │
│       │                                               └───────────┘     │
│       ▼                                                                  │
│  ┌──────────┐    Step 2         ┌──────────────┐                       │
│  │  OTP     │ ──────────────► │  POST          │                       │
│  │  Verify  │  email + code    │  /auth/        │                       │
│  │  Page    │                  │  verify-otp    │                       │
│  └──────────┘    ◄──────────── │               │                       │
│       │         {access_token}  │  ✓ OTP match  │                       │
│       │                         │  ✓ not expired│                       │
│       ▼                         └───────────────┘                       │
│  ┌──────────┐                                                           │
│  │  Docs    │   Protected pages (token in localStorage)                │
│  │  Editor  │                                                           │
│  └──────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Authentication Flow (Step-by-Step)

### Complete Login Sequence

```
1.  User navigates to /login
2.  User enters email and password
3.  Frontend sends POST /auth/login { email, password }
4.  Backend verifies password against MongoDB
5.  Backend checks if user status is "approved"
6.  Backend generates a 6-digit OTP
7.  Backend stores OTP + expiration in user's MongoDB document
8.  Backend sends OTP via SMS (Twilio) to user's phone
9.  Backend sends OTP via email as backup
10. Backend returns { requires_otp: true, email: "...", message: "..." }
11. Frontend stores email in sessionStorage
12. Frontend redirects to /verify-otp
13. User receives SMS and/or email with 6-digit code
14. User enters the 6-digit code on the OTP page
15. Frontend sends POST /auth/verify-otp { email, otp }
16. Backend validates OTP: matches stored code AND not expired
17. Backend clears OTP fields from user document
18. Backend generates JWT token with user_id + role
19. Backend returns { access_token, role, name }
20. Frontend stores token + user info in localStorage
21. Frontend redirects to /docs (main workspace)
```

---

## 4. Backend Implementation

### 4.1 Login Route (Step 1 — Password Verification)

**File**: `backend/app/routes/auth.py`  
**Endpoint**: `POST /auth/login`

```python
@router.post('/login')
async def login(body: LoginIn):
    db = get_db()
    user = await db.users.find_one({'email': body.email})
    
    # Step 1: Verify credentials
    if not user or not verify_pw(body.password, user['passwordHash']):
        raise HTTPException(401, 'Invalid email or password')
    
    # Step 2: Check approval status
    if user.get('status', 'pending') != 'approved':
        raise HTTPException(403, 'Your account is pending approval')

    # Step 3: Generate and save OTP
    otp = otp_service.generate_otp()
    await otp_service.save_otp(str(user['_id']), otp)
    
    # Step 4: Send OTP via SMS
    if user.get('phone_number'):
        try:
            sms_service.send_otp_sms(user['phone_number'], otp)
        except Exception as e:
            logger.error(f"SMS sending failed: {str(e)}")
    
    # Step 5: Send OTP via email (backup)
    try:
        await email_service.send_otp_email(user.get('name', 'Admin'), user['email'], otp)
    except Exception as e:
        logger.error(f"OTP Email sending failed: {str(e)}")

    # Step 6: Return OTP-required state (NO token yet)
    return {
        'requires_otp': True,
        'email': user['email'],
        'message': "Verification code sent to your phone"
    }
```

**Key behavior**: 
- The login route **never returns a JWT token**. It only validates the password and triggers OTP delivery.
- The response `{ requires_otp: true }` signals the frontend to redirect to the OTP page.

---

### 4.2 OTP Generation & Storage

**File**: `backend/app/services/otp_service.py`

#### OTP Generation

```python
def generate_otp() -> str:
    """Returns a random 6-digit string, zero-padded."""
    return str(random.randint(0, 999999)).zfill(6)
```

- Generates a number between `000000` and `999999`
- Uses `zfill(6)` to ensure consistent 6-digit format (e.g., `042817`)
- Uses Python's `random.randint()` for generation

#### OTP Persistence

```python
async def save_otp(admin_id: str, otp: str):
    db = get_db()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    await db.users.update_one(
        {'_id': ObjectId(admin_id)},
        {
            '$set': {
                'otp': otp,                           # The 6-digit code
                'otp_expires_at': expires_at,          # Expiration timestamp
                'otp_last_sent_at': datetime.utcnow()  # Last-sent timestamp (for rate limiting)
            }
        }
    )
```

- OTP is stored **directly in the user's document** in the `users` collection
- Three fields are set: `otp`, `otp_expires_at`, `otp_last_sent_at`
- Each new OTP overwrites the previous one (only one active OTP per user)
- Expiration is set to **5 minutes** from generation time

---

### 4.3 OTP Delivery (SMS + Email)

#### SMS Delivery (Primary)

**File**: `backend/app/services/sms_service.py`

```python
def send_otp_sms(phone_number: str, otp: str):
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured. Skipping SMS.")
        return

    formatted_number = format_phone_number(phone_number)
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    
    message = client.messages.create(
        body=f"Your Delta Labs admin verification code is: {otp}. It expires in 5 minutes.",
        from_=settings.TWILIO_PHONE_NUMBER,
        to=formatted_number
    )
```

**Phone number formatting** (supports Ethiopian phone numbers):

| Input | Formatted Output |
|---|---|
| `+251912345678` | `+251912345678` (unchanged) |
| `0912345678` | `+251912345678` (strips leading 0, adds +251) |
| `912345678` | `+251912345678` (adds +251) |

#### Email Delivery (Backup)

**File**: `backend/app/services/email_service.py`

```python
async def send_otp_email(admin_name: str, admin_email: str, otp: str):
    subject = "Your Delta Labs Verification Code"
    body = (
        f"Hi {admin_name},\n"
        f"Your verification code is: {otp}\n"
        "This code expires in 5 minutes.\n"
        "If you did not request this, please ignore this email."
    )
    await _send_email(admin_email, subject, body)
```

The email is sent through a **multi-provider cascade**:
1. **Resend** (primary) → if `RESEND_API_KEY` is configured
2. **SendGrid** (fallback) → if `SENDGRID_API_KEY` is configured
3. **SMTP** (fallback) → if `SMTP_HOST` is configured

**Important**: Email delivery is a backup. It is wrapped in a try/catch and failures are silently logged — they do NOT block the login flow.

---

### 4.4 OTP Verification Route (Step 2 — Code Verification)

**File**: `backend/app/routes/admin_auth.py`  
**Endpoint**: `POST /auth/verify-otp`

```python
@router.post('/auth/verify-otp')
async def verify_otp(body: VerifyOTPIn):
    db = get_db()
    admin_doc = await db.users.find_one({'email': body.email})
    
    if not admin_doc:
        raise HTTPException(404, 'Admin not found')
    
    # Direct comparison first (quick check)
    stored_otp = admin_doc.get('otp')
    expires_at = admin_doc.get('otp_expires_at')
    match = str(stored_otp).strip() == str(body.otp).strip()

    if not match:
        if expires_at and datetime.utcnow() > expires_at:
            raise HTTPException(400, "OTP has expired. Request a new code.")
        raise HTTPException(400, "Invalid code. Please try again.")
    
    # Full verification via service (includes expiry check + DB cleanup)
    is_valid = await otp_service.verify_otp(admin_doc, body.otp)
    if not is_valid:
        raise HTTPException(400, "Invalid code. Please try again.")

    # SUCCESS → Issue JWT token
    return {
        'access_token': make_token(str(admin_doc['_id']), admin_doc['role']),
        'token_type': 'bearer',
        'role': admin_doc['role'],
        'name': admin_doc['name'],
    }
```

#### OTP Verification Logic (`otp_service.verify_otp`)

```python
async def verify_otp(admin: dict, otp_input: str) -> bool:
    stored_otp = admin.get('otp')
    expires_at = admin.get('otp_expires_at')

    # Check existence
    if not stored_otp or not expires_at:
        return False

    # Check expiration
    if datetime.utcnow() > expires_at:
        return False

    # String comparison (both sides stripped and cast to string)
    match = str(stored_otp).strip() == str(otp_input).strip()
    if not match:
        return False

    # On success: CLEAR OTP fields from the database
    db = get_db()
    await db.users.update_one(
        {'_id': admin['_id']},
        {
            '$set': {
                'otp': None,
                'otp_expires_at': None,
                'otp_last_sent_at': None
            }
        }
    )
    return True
```

**Key behaviors:**
1. Both stored and input OTP values are cast to `str` and stripped of whitespace before comparison
2. Expiration is checked against `datetime.utcnow()`
3. On successful verification, all three OTP fields (`otp`, `otp_expires_at`, `otp_last_sent_at`) are set to `None`
4. The JWT token is **only generated and returned** after OTP verification succeeds

---

### 4.5 OTP Resend Route

**File**: `backend/app/routes/admin_auth.py`  
**Endpoint**: `POST /auth/send-otp`

```python
@router.post('/auth/send-otp')
async def send_otp(body: EmailIn):
    db = get_db()
    admin = await db.users.find_one({'email': body.email})
    
    if not admin:
        raise HTTPException(404, 'Admin not found')
    
    phone_number = admin.get('phone_number')
    if not phone_number:
        raise HTTPException(400, "No phone number on this account")
    
    # Rate limiting: 60-second cooldown
    last_sent = admin.get('otp_last_sent_at')
    if last_sent:
        diff = (datetime.utcnow() - last_sent).total_seconds()
        if diff < 60:
            raise HTTPException(
                status_code=429, 
                detail={
                    "message": "Please wait before requesting a new code",
                    "seconds_remaining": int(60 - diff)
                }
            )
    
    # Generate, save, and send new OTP
    otp = otp_service.generate_otp()
    await otp_service.save_otp(str(admin['_id']), otp)
    sms_service.send_otp_sms(phone_number, otp)
    
    # Email backup (silent failure)
    try:
        await email_service.send_otp_email(admin.get('name', 'Admin'), admin['email'], otp)
    except:
        pass
        
    return {'message': 'OTP sent to your registered phone'}
```

---

## 5. Frontend Implementation

### 5.1 Login Page

**File**: `portal/src/app/login/page.tsx`

The login page handles the first factor (email + password) and redirects to the OTP page:

```typescript
const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    try {
        const res: any = await api.post('/auth/login', { email, password });
        
        // Check if 2FA is required (it always is)
        if (res.requires_otp) {
            // Store email for the OTP page
            sessionStorage.setItem('otp_email', email);
            router.push('/verify-otp');
            return;
        }

        // Fallback: direct token (legacy path — not currently used)
        localStorage.setItem('portal_token', res.access_token);
        router.push('/docs');
    } catch {
        setLoginError('Invalid email or password. Please try again.');
    } finally {
        setLoginLoading(false);
    }
};
```

**Key behavior**: The email is stored in `sessionStorage` (not `localStorage`) so it persists only for the current browser tab session.

---

### 5.2 OTP Verification Page

**File**: `portal/src/app/verify-otp/page.tsx`

#### Page Structure

The verification page displays:
- A shield icon with "Two-Factor Verification" heading
- The user's email (retrieved from `sessionStorage`)
- **Six individual digit input boxes** (not a single text field)
- Verify button (disabled until all 6 digits entered)
- Resend code button with countdown timer
- Back to Login link

#### 6-Digit OTP Input UI

```typescript
// State: array of 6 empty strings
const [otp, setOtp] = useState(['', '', '', '', '', '']);
const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

// Auto-focus next input after entering a digit
const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);  // Only last char
    if (!/^\d*$/.test(value)) return;                // Only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
    }
};

// Backspace moves to previous input
const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
    }
};
```

#### Verification Handler

```typescript
const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const fullOtp = otp.join('');  // Join array into "123456"
    if (fullOtp.length < 6) return;

    setLoading(true);
    setError('');

    try {
        const res: any = await api.post('/auth/verify-otp', {
            email: email,
            otp: fullOtp
        });
        
        // Store token and user info
        localStorage.setItem('portal_token', res.access_token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('name', res.name);
        localStorage.setItem('email', email);
        
        // Cleanup and redirect
        sessionStorage.removeItem('otp_email');
        router.push('/docs');
    } catch (err: any) {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('expired')) {
            setError('Your code has expired. Please request a new one.');
            setCanResend(true);
        } else {
            setError('Incorrect code. Please try again.');
            setOtp(['', '', '', '', '', '']);  // Clear all inputs
            inputRefs.current[0]?.focus();     // Focus first input
        }
    } finally {
        setLoading(false);
    }
};
```

#### Resend OTP with Countdown

```typescript
const [resendTimer, setResendTimer] = useState(60);
const [canResend, setCanResend] = useState(false);

// Countdown timer (starts on page load)
useEffect(() => {
    const timer = setInterval(() => {
        setResendTimer((prev) => {
            if (prev <= 1) {
                clearInterval(timer);
                setCanResend(true);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
}, []);

// Resend handler
const handleResend = async () => {
    if (!canResend) return;
    
    await api.post('/auth/send-otp', { email });
    setCanResend(false);
    setResendTimer(60);
    // Restart timer...
};
```

**UI display**: `"Resend code in 0:45"` → `"Resend code"` (clickable after countdown)

---

### 5.3 Token Storage & Session Management

After successful OTP verification, the following are stored:

| Key | Storage | Value | Purpose |
|---|---|---|---|
| `portal_token` | localStorage | JWT string | API authentication |
| `role` | localStorage | `admin` or `super_admin` | UI permission checks |
| `name` | localStorage | Display name | Navbar greeting |
| `email` | localStorage | User email | Display |
| `otp_email` | sessionStorage | ❌ Removed | Cleanup after successful auth |

**Session expiry handling**: If any API call returns `401`, the centralized API client:
1. Removes `portal_token` from localStorage
2. Sets `auth_message: "Session expired"` in sessionStorage
3. Redirects to `/login`
4. Login page displays the session-expired warning message

---

## 6. OTP Delivery Channels

### 6.1 SMS via Twilio

| Setting | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token |
| `TWILIO_PHONE_NUMBER` | The "From" phone number (Twilio number) |

**SMS message format:**
```
Your Delta Labs admin verification code is: 042817. It expires in 5 minutes.
```

**Phone number support:**
- Ethiopian numbers with `+251` international prefix
- Automatic formatting from local format (`09xxx`) to international format (`+2519xxx`)

**Failure behavior:**
- If Twilio credentials are not set → SMS is skipped silently
- If SMS delivery fails → Exception is raised, caught by the route, and logged
- SMS failure does NOT prevent the login flow (email backup exists)

### 6.2 Email Backup

The OTP is also sent via email as a secondary delivery channel:

**Email subject:** `"Your Delta Labs Verification Code"`

**Email body:**
```
Hi {admin_name},
Your verification code is: {otp}
This code expires in 5 minutes.
If you did not request this, please ignore this email.
```

**Provider cascade:** Resend → SendGrid → SMTP (same as all other emails)

**Failure behavior:** Email OTP failure is silently caught — it is a backup channel only.

---

## 7. Security Safeguards

| Safeguard | Implementation | Purpose |
|---|---|---|
| **No token before OTP** | Login returns `requires_otp`, not `access_token` | Prevents access without completing 2FA |
| **OTP expiration** | 5-minute TTL stored in `otp_expires_at` | Limits window of vulnerability |
| **OTP cleanup** | All OTP fields set to `None` after verification | Prevents OTP reuse |
| **Rate limiting** | 60-second cooldown on `/auth/send-otp` | Prevents OTP spam |
| **Approval gate** | Only `status: approved` users can log in | Blocks unauthorized 2FA attempts |
| **String sanitization** | Both sides `.strip()` + `str()` cast | Prevents whitespace/type mismatches |
| **Session-scoped email** | `sessionStorage` for OTP email | Email cleared when tab closes |
| **Input-level validation** | Only digits allowed, max 1 char per box | Prevents invalid OTP submissions |
| **Auto-clear on failure** | OTP inputs reset on incorrect code | Prevents accidental resubmission |
| **Expired code UX** | Specific message + enables resend button | Guides user to request new code |

---

## 8. Rate Limiting

### OTP Request Rate Limiting

```python
last_sent = admin.get('otp_last_sent_at')
if last_sent:
    diff = (datetime.utcnow() - last_sent).total_seconds()
    if diff < 60:
        raise HTTPException(
            status_code=429, 
            detail={
                "message": "Please wait before requesting a new code",
                "seconds_remaining": int(60 - diff)
            }
        )
```

- **Cooldown**: 60 seconds between OTP requests
- **Tracking**: `otp_last_sent_at` field in user document
- **Response**: HTTP 429 with `seconds_remaining` in the response body
- **Frontend**: Countdown timer prevents UI-level resend during cooldown

---

## 9. Database Schema for 2FA

### User Document (2FA-related fields)

```json
{
  "_id": ObjectId("..."),
  "name": "John Doe",
  "email": "john@deltalabs.com",
  "passwordHash": "...",
  "phone_number": "+251912345678",
  "role": "admin",
  "status": "approved",
  
  // 2FA Fields (set during OTP flow, cleared after verification)
  "otp": "042817",                                    // Current OTP code (null when not active)
  "otp_expires_at": ISODate("2026-03-30T17:15:00Z"),  // Expiration time (null when not active)
  "otp_last_sent_at": ISODate("2026-03-30T17:10:00Z") // Last send time for rate limiting (null when not active)
}
```

### Admin Pydantic Model

**File**: `backend/app/models/admin.py`

```python
class Admin(BaseModel):
    name: str
    email: EmailStr
    passwordHash: str
    role: str = Field(default="admin")          # "super_admin" | "admin"
    status: str = Field(default="pending")      # "pending" | "approved" | "rejected"
    phone_number: Optional[str] = None
    otp: Optional[str] = None                   # Current OTP code
    otp_expires_at: Optional[datetime] = None   # OTP expiration
    otp_last_sent_at: Optional[datetime] = None # Rate limit tracking
    createdAt: datetime = Field(default_factory=datetime.utcnow)
```

---

## 10. Configuration Requirements

### Required Environment Variables for 2FA

| Variable | Required | Provider | Description |
|---|---|---|---|
| `TWILIO_ACCOUNT_SID` | ⚠️ For SMS | Twilio | Account identifier |
| `TWILIO_AUTH_TOKEN` | ⚠️ For SMS | Twilio | Auth token |
| `TWILIO_PHONE_NUMBER` | ⚠️ For SMS | Twilio | Sender phone number |
| `RESEND_API_KEY` | ⚠️ For Email | Resend | Primary email API key |
| `FROM_EMAIL` | ⚠️ For Email | Resend | Sender email address |
| `SENDGRID_API_KEY` | Optional | SendGrid | Fallback email |
| `SMTP_HOST` | Optional | SMTP | Fallback email host |
| `SMTP_PORT` | Optional | SMTP | Default: 587 |
| `SMTP_USER` | Optional | SMTP | SMTP username |
| `SMTP_PASSWORD` | Optional | SMTP | SMTP password |

> **Note**: At minimum, either Twilio SMS OR one email provider must be configured for OTP delivery to work. Without any delivery channel, users will not receive their OTP codes.

---

## 11. Error Scenarios & Handling

### Backend Error Responses

| Scenario | Status | Response |
|---|---|---|
| Wrong password | 401 | `"Invalid email or password"` |
| Account not approved | 403 | `"Your account is pending approval"` |
| Admin not found (OTP) | 404 | `"Admin not found"` |
| No phone number | 400 | `"No phone number on this account"` |
| OTP cooldown | 429 | `{"message": "...", "seconds_remaining": N}` |
| Wrong OTP code | 400 | `"Invalid code. Please try again."` |
| Expired OTP | 400 | `"OTP has expired. Request a new code."` |
| SMS delivery failure | 500 | `"Failed to send OTP. Please check your phone number or try again."` |

### Frontend Error Handling

| Scenario | UI Behavior |
|---|---|
| Wrong password | Red error banner: "Invalid email or password" |
| Wrong OTP code | Error text + clear all 6 inputs + focus first input |
| Expired OTP code | Error text: "Your code has expired" + enable Resend button |
| Resend cooldown | Button disabled with countdown: "Resend code in 0:XX" |
| Session expired | Redirect to login with warning: "Session expired" |
| Network error | Error message from API client |

---

## 12. Flow Diagrams

### Happy Path Flow

```
User                    Frontend                    Backend                  Twilio/Email
 │                        │                           │                        │
 ├─ Enter email+pass ────►│                           │                        │
 │                        ├── POST /auth/login ──────►│                        │
 │                        │                           ├── Verify password      │
 │                        │                           ├── Generate OTP         │
 │                        │                           ├── Save to MongoDB      │
 │                        │                           ├── Send SMS ───────────►│
 │                        │                           ├── Send Email ─────────►│
 │                        │◄── {requires_otp} ────────│                        │
 │                        ├── Redirect /verify-otp    │                        │
 │◄── Show OTP page ──────│                           │                        │
 │                        │                           │                        │
 │── Receive SMS ─────────────────────────────────────────────────────────────►│
 │                        │                           │                        │
 ├─ Enter 6-digit code ──►│                           │                        │
 │                        ├── POST /auth/verify-otp ─►│                        │
 │                        │                           ├── Compare OTP          │
 │                        │                           ├── Check expiration     │
 │                        │                           ├── Clear OTP fields     │
 │                        │                           ├── Generate JWT         │
 │                        │◄── {access_token} ────────│                        │
 │                        ├── Store token             │                        │
 │◄── Redirect /docs ─────│                           │                        │
 │                        │                           │                        │
```

### Expired OTP Flow

```
User                    Frontend                    Backend
 │                        │                           │
 ├─ Enter expired code ──►│                           │
 │                        ├── POST /auth/verify-otp ─►│
 │                        │                           ├── Code matches BUT expired
 │                        │◄── 400 "OTP expired" ─────│
 │                        ├── Show error message       │
 │                        ├── Enable "Resend" button   │
 │◄── "Code expired" ─────│                           │
 │                        │                           │
 ├─ Click "Resend" ──────►│                           │
 │                        ├── POST /auth/send-otp ───►│
 │                        │                           ├── Generate new OTP
 │                        │                           ├── Save + Send SMS/Email
 │                        │◄── {message} ─────────────│
 │                        ├── Start 60s countdown      │
 │◄── "New code sent" ────│                           │
```

---

## 13. Files Involved

### Backend Files

| File | Role in 2FA |
|---|---|
| `app/routes/auth.py` | Login endpoint (password check → OTP trigger) |
| `app/routes/admin_auth.py` | OTP send, verify, and resend endpoints |
| `app/services/otp_service.py` | OTP generation, storage, and verification logic |
| `app/services/sms_service.py` | Twilio SMS delivery |
| `app/services/email_service.py` | Email OTP backup delivery |
| `app/auth/jwt.py` | JWT token creation (issued after OTP success) |
| `app/models/admin.py` | User model with OTP fields |
| `app/config.py` | Twilio + email provider configuration |
| `app/middleware/auth_guard.py` | Post-login authorization guards |

### Frontend Files

| File | Role in 2FA |
|---|---|
| `portal/src/app/login/page.tsx` | Login form → detects `requires_otp` → redirects |
| `portal/src/app/verify-otp/page.tsx` | 6-digit OTP input → verification → token storage |
| `portal/src/lib/api.ts` | API client → auto-logout on 401 |
| `portal/src/app/signup/page.tsx` | Signup with phone number field (required for SMS OTP) |

---

## Summary

The Delta Labs Docs 2FA implementation is a **server-side OTP system** with dual delivery (SMS + email) that enforces a mandatory second authentication factor before issuing JWT tokens. Key design decisions:

1. **OTP stored in user document** — No separate OTP collection; fields live on the user record and are cleared after use
2. **SMS-first, email-backup** — Twilio for primary delivery, email as a silent fallback
3. **Rate limited** — 60-second cooldown prevents abuse
4. **5-minute expiration** — Short TTL limits the attack window
5. **No token without OTP** — The login route explicitly returns `requires_otp` instead of a token
6. **Frontend UX** — Individual digit inputs with auto-focus, countdown timer, clear-on-error behavior
7. **Graceful degradation** — If SMS fails, email backup exists; if both fail, the user can retry
