from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
from app.database import get_db
from app.auth.jwt import hash_pw, make_token
from app.middleware.auth_guard import require_super_admin
from app.services import otp_service, email_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None

class AdminUserItem(BaseModel):
    id: str
    name: str
    email: str
    phone_number: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime

class RoleUpdateIn(BaseModel):
    role: str # 'super_admin' or 'admin'

class EmailIn(BaseModel):
    email: EmailStr

class VerifyOTPIn(BaseModel):
    email: EmailStr
    otp: str

@router.get('/admin/users', response_model=List[AdminUserItem])
async def get_all_admins(current_user=Depends(require_super_admin)):
    """List all approved admins for management (Super Admin only)."""
    db = get_db()
    admins = await db.users.find({'status': 'approved'}).to_list(100)
    
    return [
        AdminUserItem(
            id=str(a['_id']),
            name=a.get('name', ''),
            email=a.get('email', ''),
            phone_number=a.get('phone_number'),
            role=a.get('role'),
            status=a.get('status'),
            created_at=a.get('createdAt', a.get('created_at', datetime.utcnow()))
        ) for a in admins
    ]

@router.patch('/admin/users/{admin_id}/role')
async def update_admin_role(admin_id: str, body: RoleUpdateIn, current_user=Depends(require_super_admin)):
    """Change an admin's role (Super Admin only)."""
    if body.role not in ['super_admin', 'admin']:
        raise HTTPException(400, "Invalid role. Use 'super_admin' or 'admin'.")
        
    db = get_db()
    
    # Check if target exists
    admin = await db.users.find_one({'_id': ObjectId(admin_id)})
    if not admin:
        raise HTTPException(404, "Admin not found")
        
    # Prevent demoting the ONLY super admin (could be soft-lock)
    if body.role == 'admin' and admin['role'] == 'super_admin':
        count = await db.users.count_documents({'role': 'super_admin'})
        if count <= 1:
            raise HTTPException(400, "Cannot demote the last remaining super admin")

    await db.users.update_one(
        {'_id': ObjectId(admin_id)},
        {'$set': {'role': body.role}}
    )
    
    return {'message': f"Role updated to {body.role}"}

@router.delete('/admin/users/{admin_id}')
async def delete_admin(admin_id: str, current_user=Depends(require_super_admin)):
    """Remove an admin (Super Admin only)."""
    db = get_db()
    
    # Don't allow deleting yourself
    if admin_id == str(current_user['_id']):
        raise HTTPException(400, "Cannot remove your own super admin account")

    res = await db.users.delete_one({'_id': ObjectId(admin_id)})
    if res.deleted_count == 0:
        raise HTTPException(404, "Admin not found")
        
    return {'message': 'Admin removed successfully'}

@router.post('/auth/signup')
async def signup(body: SignupIn):
    db = get_db()
    if await db.users.find_one({'email': body.email}):
        raise HTTPException(400, 'Email already registered')
    
    await db.users.insert_one({
        'name': body.name,
        'email': body.email,
        'phone_number': body.phone_number,
        'passwordHash': hash_pw(body.password),
        'role': 'admin',
        'status': 'pending',
        'createdAt': datetime.utcnow(),
    })
    
    # Notify super admins
    try:
        await email_service.send_new_signup_alert(body.name, body.email)
    except Exception as e:
        logger.error(f"Failed to send signup alert: {str(e)}")

    return {'message': 'Signup successful. Awaiting approval.'}

@router.post('/auth/send-otp')
async def send_otp(body: EmailIn):
    db = get_db()
    admin = await db.users.find_one({'email': body.email})
    if not admin or admin.get('status', 'pending') != 'approved':
        # Generic message to avoid enumeration
        return {'message': 'If your email is registered, an OTP has been sent.'}
        
    if admin.get('role') not in ('admin', 'developer', 'super_admin'):
        return {'message': 'If your email is registered, an OTP has been sent.'}
    

    print(f"[SEND-OTP] Request for: {body.email}")
    
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
    
    otp = otp_service.generate_otp()
    await otp_service.save_otp(str(admin['_id']), otp)
    
    try:
        await email_service.send_otp_email(admin.get('name', 'Admin'), admin['email'], otp)
        return {'message': 'OTP sent to your registered email'}
    except Exception as e:
        logger.error(f"Email delivery failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP to your email. Please try again later."
        )

@router.post('/auth/verify-otp')
async def verify_otp(body: VerifyOTPIn):
    print(f"[VERIFY-OTP] email={body.email}")

    db = get_db()
    admin_doc = await db.users.find_one({'email': body.email})
    
    if not admin_doc:
        raise HTTPException(400, "Invalid code or user. Please try again.")

    is_valid = await otp_service.verify_otp(admin_doc, body.otp)
    if not is_valid:
        raise HTTPException(400, "Invalid or expired code. Please try again.")

    return {
        'access_token': make_token(str(admin_doc['_id']), admin_doc['role']),
        'token_type': 'bearer',
        'role': admin_doc['role'],
        'name': admin_doc['name'],
    }

@router.get('/admin/approvals', response_model=List[AdminUserItem])
async def get_approvals(current_user=Depends(require_super_admin)):
    db = get_db()
    pending_admins = await db.users.find({'status': 'pending'}).to_list(100)
    
    return [
        AdminUserItem(
            id=str(a['_id']),
            name=a.get('name', ''),
            email=a.get('email', ''),
            phone_number=a.get('phone_number'),
            role=a.get('role'),
            status=a.get('status'),
            created_at=a.get('createdAt', datetime.utcnow())
        ) for a in pending_admins
    ]

@router.patch('/admin/approve/{admin_id}')
async def approve_admin(admin_id: str, current_user=Depends(require_super_admin)):
    db = get_db()
    admin = await db.users.find_one({'_id': ObjectId(admin_id)})
    if not admin:
        raise HTTPException(404, 'Admin not found')

    res = await db.users.update_one(
        {'_id': ObjectId(admin_id)},
        {'$set': {'status': 'approved'}}
    )
    if res.modified_count == 0:
        raise HTTPException(404, 'Admin already approved')
    
    try:
        await email_service.send_approval_email(admin.get('name', 'Admin'), admin['email'])
    except Exception as e:
        logger.error(f"Failed to send approval email: {str(e)}")

    return {'message': 'Admin approved successfully'}

@router.patch('/admin/reject/{admin_id}')
async def reject_admin(admin_id: str, current_user=Depends(require_super_admin)):
    db = get_db()
    admin = await db.users.find_one({'_id': ObjectId(admin_id)})
    if not admin:
        raise HTTPException(404, 'Admin not found')

    res = await db.users.update_one(
        {'_id': ObjectId(admin_id)},
        {'$set': {'status': 'rejected'}}
    )
    if res.modified_count == 0:
        raise HTTPException(404, 'Admin already rejected')
    
    try:
        await email_service.send_rejection_email(admin.get('name', 'Admin'), admin['email'])
    except Exception as e:
        logger.error(f"Failed to send rejection email: {str(e)}")

    return {'message': 'Admin rejected'}
