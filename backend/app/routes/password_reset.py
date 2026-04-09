from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import secrets
from app.database import get_db
from app.auth.jwt import hash_pw
from app.services.email_service import _send_email

router = APIRouter()

class RequestOTP(BaseModel):
    email: EmailStr

class PasswordResetVerify(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(body: RequestOTP):
    db = get_db()
    user = await db.users.find_one({"email": body.email})

    # Always return success even if email not found or not approved (security best practice)
    if not user or user.get("status") != "approved":
        return {"message": "If that email exists, an OTP has been sent."}

    # Generate cryptographically secure 6-digit OTP
    otp = str(secrets.choice("0123456789"))
    for _ in range(5):
        otp += str(secrets.choice("0123456789"))
        
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Store OTP in database (upsert — one OTP per email at a time)
    await db.password_resets.update_one(
        {"email": body.email},
        {"$set": {
            "email": body.email,
            "otp": otp,
            "expiresAt": expires_at,
            "used": False,
            "createdAt": datetime.utcnow(),
        }},
        upsert=True
    )

    # Send email using unified fallback service
    subject = "Delta Labs — Your Password Reset Code"
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #f8fafc;">
      <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">Password Reset</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 32px; line-height: 1.6;">
           Use the code below to reset your Delta Labs admin password.
           This code expires in 10 minutes.
        </p>
        <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 32px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', monospace;">
            {otp}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.6;">
          If you didn't request this, ignore this email. Your password won't change.
        </p>
      </div>
    </div>
    """

    try:
        await _send_email(body.email, subject, html_content)
    except Exception as e:
        print(f"Email send failed: {e}")
        raise HTTPException(500, "Failed to send OTP email")

    return {"message": "If that email exists, an OTP has been sent."}


@router.post("/reset-password")
async def reset_password(body: PasswordResetVerify):
    db = get_db()

    if len(body.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    user = await db.users.find_one({"email": body.email})
    if not user or user.get("status") != "approved":
        raise HTTPException(400, "Account not found or not approved.")

    reset_doc = await db.password_resets.find_one({
        "email": body.email,
        "used": False,
    })

    if not reset_doc:
        raise HTTPException(400, "No active OTP found for this email. Request a new one.")

    if reset_doc["expiresAt"] < datetime.utcnow():
        raise HTTPException(400, "OTP has expired. Please request a new one.")

    if reset_doc["otp"] != body.otp.strip():
        raise HTTPException(400, "Incorrect OTP code.")

    # Mark OTP as used
    await db.password_resets.update_one(
        {"email": body.email},
        {"$set": {"used": True}}
    )

    # Update user password
    await db.users.update_one(
        {"email": body.email},
        {"$set": {"passwordHash": hash_pw(body.new_password)}}
    )

    return {"message": "Password updated successfully. You can now log in."}
