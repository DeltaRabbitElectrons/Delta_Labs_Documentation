from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.database import get_db
from app.auth.jwt import hash_pw, verify_pw, make_token
from app.services import otp_service, email_service
from app.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class GoogleLoginIn(BaseModel):
    token: str

@router.post('/google')
async def google_login(body: GoogleLoginIn):
    try:
        # 1. Verify the Google ID Token
        id_info = id_token.verify_oauth2_token(
            body.token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )

        email = id_info['email']
        db = get_db()
        user = await db.users.find_one({'email': email})

        if not user:
             raise HTTPException(404, 'No account found with this email. Please register first.')
        
        if user.get('status', 'pending') != 'approved':
            raise HTTPException(403, 'Your account is pending approval by a super admin.')

        # 2. Trigger OTP (Factor 2)
        print(f"[GOOGLE-LOGIN] Google verified for {email}, triggering OTP")
        
        otp = otp_service.generate_otp()
        await otp_service.save_otp(str(user['_id']), otp)

        # Send Email OTP
        try:
            await email_service.send_otp_email(user.get('name', 'Admin'), user['email'], otp)
        except Exception as e:
            logger.error(f"[GOOGLE-LOGIN] OTP email failed for {user['email']}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Could not send verification code to {user['email']}. Error: {str(e)}"
            )

        return {
            'requires_otp': True,
            'email': user['email'],
            'message': "Verification code sent to your email"
        }

    except ValueError as e:
        logger.error(f"Google Token Verification Failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid Google token")
    except Exception as e:
        logger.error(f"Error during Google Login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during Google login")

# ─── TEMPORARY DEBUG ROUTE — remove after fixing email ────────────────────────
@router.get('/debug/test-email')
async def test_email():
    """Temporary endpoint to test SMTP config. Delete after debugging."""
    from app.config import settings
    import smtplib
    result = {
        "SMTP_HOST": settings.SMTP_HOST or "NOT SET",
        "SMTP_PORT": settings.SMTP_PORT,
        "SMTP_USER": settings.SMTP_USER or "NOT SET",
        "SMTP_PASSWORD": "SET" if settings.SMTP_PASSWORD else "NOT SET",
        "EMAIL_FROM_ADDRESS": settings.EMAIL_FROM_ADDRESS or "NOT SET",
    }
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        result["smtp_connection"] = "SUCCESS"
    except Exception as e:
        result["smtp_connection"] = "FAILED"
        result["error"] = str(e)
    return result
# ──────────────────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

@router.post('/register')
async def register(body: RegisterIn):
    db = get_db()
    if await db.users.find_one({'email': body.email}):
        raise HTTPException(400, 'Email already registered')
    await db.users.insert_one({
        'name': body.name,
        'email': body.email,
        'role': 'admin',
        'passwordHash': hash_pw(body.password),
        'status': 'pending',
        'createdAt': datetime.utcnow(),
    })
    
    # Notify super admins
    try:
        await email_service.send_new_signup_alert(body.name, body.email)
    except Exception as e:
        logger.error(f"Failed to send signup alert: {str(e)}")
        
    return {'message': 'Account created successfully'}

@router.post('/login')
async def login(body: LoginIn):
    db = get_db()
    user = await db.users.find_one({'email': body.email})
    if not user or not verify_pw(body.password, user['passwordHash']):
        raise HTTPException(401, 'Invalid email or password')
    
    if user.get('status', 'pending') != 'approved':
        raise HTTPException(403, 'Your account is pending approval')

    if user.get('role') not in ('admin', 'developer', 'super_admin'):
        raise HTTPException(403, 'Access denied. Administrator privileges required.')

    # Task 5: Password verified, trigger OTP
    print(f"[LOGIN] Password verified for {body.email}, OTP triggered")

    otp = otp_service.generate_otp()
    await otp_service.save_otp(str(user['_id']), otp)

    # Send Email OTP — raise error to frontend if this fails
    try:
        await email_service.send_otp_email(user.get('name', 'Admin'), user['email'], otp)
    except Exception as e:
        logger.error(f"[LOGIN] OTP email failed for {user['email']}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Could not send verification code to {user['email']}. Error: {str(e)}"
        )

    return {
        'requires_otp': True,
        'email': user['email'],
        'message': "Verification code sent to your email"
    }

