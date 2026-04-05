from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional

class ClientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    gstin: Optional[str] = None
    notes: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    avg_payment_delay_days: Optional[int] = None
    disputed_invoices: Optional[int] = None
    is_blacklisted: Optional[bool] = None

class ClientResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    company: Optional[str]
    gstin: Optional[str]
    notes: Optional[str]
    total_invoices: int
    paid_invoices: int
    overdue_invoices: int
    disputed_invoices: int
    avg_payment_delay_days: int
    total_billed: Decimal
    total_paid: Decimal
    risk_score: int
    is_blacklisted: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class RiskScoreResponse(BaseModel):
    client_id: UUID
    client_name: str
    risk_score: int
    risk_label: str
    risk_color: str
    breakdown: dict
    outstanding_amount: Decimal
    payment_rate_pct: float
    message: str

class HealthScoreResponse(BaseModel):
    health_score: int
    health_label: str
    breakdown: dict
    tips: list
