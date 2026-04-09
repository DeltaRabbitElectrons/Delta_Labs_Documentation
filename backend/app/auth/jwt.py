from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.config import settings
from app.database import get_db
from bson import ObjectId

oauth2 = OAuth2PasswordBearer(tokenUrl='/auth/login')

def make_token(user_id: str, role: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({'sub': user_id, 'role': role, 'exp': exp},
                     settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def hash_pw(password: str) -> str:
    # Storing as plain text per user request
    return password

def verify_pw(plain: str, stored: str) -> bool:
    # Plain text comparison
    return plain == stored

async def current_user(token: str = Depends(oauth2)):
    try:
        data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        uid = data.get('sub')
        if not uid:
            raise HTTPException(401, 'Invalid token payload')
    except JWTError:
        raise HTTPException(401, 'Invalid or expired token')
    
    db = get_db()
    if db is None:
        raise HTTPException(500, 'Database not initialized')
        
    user = await db.users.find_one({'_id': ObjectId(uid)})
    if not user:
        raise HTTPException(401, 'User not found')
        
    if user.get('status', 'pending') != 'approved':
        raise HTTPException(403, 'Account pending approval')
        
    return user

async def admin_only(user=Depends(current_user)):
    if user['role'] not in ('admin', 'super_admin'):
        raise HTTPException(403, 'Admin access required')
    return user

async def portal_user(user=Depends(current_user)):
    if user['role'] not in ('admin', 'developer', 'super_admin'):
        raise HTTPException(403, 'Access denied')
    return user