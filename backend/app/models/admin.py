from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class Admin(BaseModel):
    name: str
    email: EmailStr
    passwordHash: str
    role: str = Field(default="admin")  # "super_admin" | "admin"
    status: str = Field(default="pending")  # "pending" | "approved" | "rejected"
    phone_number: Optional[str] = None
    otp: Optional[str] = None
    otp_expires_at: Optional[datetime] = None
    otp_last_sent_at: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
