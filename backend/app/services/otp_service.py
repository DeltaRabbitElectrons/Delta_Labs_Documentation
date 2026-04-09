from datetime import datetime, timedelta
from app.database import get_db

import secrets
from app.auth.jwt import hash_pw, verify_pw

def generate_otp() -> str:
    """Returns a cryptographically secure 6-digit string."""
    return "".join(secrets.choice("0123456789") for _ in range(6))

async def save_otp(admin_id: str, otp: str):
    """
    Saves the OTP in the admin's MongoDB document with expiration and tracking.
    """
    db = get_db()
    from bson import ObjectId
    
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    await db.users.update_one(
        {'_id': ObjectId(admin_id)},
        {
            '$set': {
                'otp': hash_pw(otp),
                'otp_expires_at': expires_at,
                'otp_last_sent_at': datetime.utcnow(),
                'otp_attempts': 0
            }
        }
    )
    print(f"[OTP] Saved hashed OTP for {admin_id}, expires at {expires_at}")

from fastapi import HTTPException

async def verify_otp(admin: dict, otp_input: str) -> bool:
    """
    Verifies the OTP input against stored OTP and expiration.
    Raises specific HTTPException for every failure case so we can debug on the live server.
    """
    stored_otp = admin.get('otp')
    expires_at = admin.get('otp_expires_at')

    if not stored_otp or not expires_at:
        raise HTTPException(status_code=400, detail="Verification failed: No active code found. Please log in again to request a new code.")

    # Fix timezone issues: treat everything as UTC naive for comparison
    now = datetime.utcnow()
    if expires_at.tzinfo is not None:
        now = datetime.now(expires_at.tzinfo)

    if now > expires_at:
        raise HTTPException(status_code=400, detail="Verification failed: Code has expired (codes are only valid for 5 minutes).")

    attempts = admin.get('otp_attempts', 0)
    if attempts >= 3:
        raise HTTPException(status_code=400, detail="Verification failed: Too many invalid attempts. Your code is blocked.")

    # Ensure both are strictly stripped strings
    stored_str = str(stored_otp).strip()
    input_str = str(otp_input).strip()
    match = verify_pw(input_str, stored_str)

    db = get_db()
    
    if not match:
        # Increment attempts
        await db.users.update_one(
            {'_id': admin['_id']},
            {'$inc': {'otp_attempts': 1}}
        )
        raise HTTPException(status_code=400, detail=f"Verification failed: Incorrect code. You entered '{input_str}'.")

    # On success: clear OTP fields
    await db.users.update_one(
        {'_id': admin['_id']},
        {
            '$set': {
                'otp': None,
                'otp_expires_at': None,
                'otp_last_sent_at': None,
                'otp_attempts': 0
            }
        }
    )
    return True
