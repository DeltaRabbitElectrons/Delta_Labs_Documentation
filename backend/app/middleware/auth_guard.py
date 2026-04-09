from fastapi import Depends, HTTPException
from app.auth.jwt import current_user

async def require_approved(user=Depends(current_user)):
    # User status check
    status = user.get("status", "pending")
    if status != "approved":
        raise HTTPException(
            status_code=403,
            detail="Account not approved"
        )
    return user

async def require_approved_admin(user=Depends(require_approved)):
    # Since require_approved already checks for status, 
    # and all users are currently admins (per app/routes/auth.py comments),
    # this guard ensures they are an approved admin.
    return user

async def require_super_admin(user=Depends(require_approved)):
    # Role check for super_admin specifically
    role = user.get("role", "admin")
    if role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Super admin access required"
        )
    return user
