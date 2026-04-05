from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from app.models.invoice import InvoiceStatus

class InvoiceCreate(BaseModel):
    client_name: str
    client_email: Optional[str] = None
    client_gstin: Optional[str] = None
    description: Optional[str] = None
    due_date: date
    base_amount: Decimal

    @field_validator("base_amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return v

class InvoiceUpdate(BaseModel):
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    base_amount: Optional[Decimal] = None
    status: Optional[InvoiceStatus] = None

class InvoiceResponse(BaseModel):
    id: UUID
    user_id: UUID
    client_name: str
    client_email: Optional[str]
    client_gstin: Optional[str]
    invoice_number: str
    description: Optional[str]
    due_date: date
    base_amount: Decimal
    gst_rate: Decimal
    gst_amount: Decimal
    total_amount: Decimal
    is_gst_applicable: bool
    status: InvoiceStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class InvoiceSummary(BaseModel):
    total_invoices: int
    total_billed: Decimal
    total_gst: Decimal
    total_received: Decimal
    total_pending: Decimal
    overdue_count: int
