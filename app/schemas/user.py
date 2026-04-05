from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional
import enum

class UserRole(str, enum.Enum):
    FREELANCER = "freelancer"
    ADMIN = "admin"

class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    pan_number: Optional[str] = None
    gstin: Optional[str] = None
    is_gst_registered: bool = False

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be under 72 characters")
        return v

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, v):
        if v and len(v) != 10:
            raise ValueError("PAN must be exactly 10 characters")
        return v.upper() if v else v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: Optional[str] = None
    pan_number: Optional[str] = None
    gstin: Optional[str] = None
    is_gst_registered: bool
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse