from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from app.models.expense import ExpenseCategory

class ExpenseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: Decimal
    expense_date: date
    vendor_name: Optional[str] = None
    invoice_reference: Optional[str] = None
    gst_paid: Decimal = Decimal("0.00")

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return v

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    expense_date: Optional[date] = None
    category: Optional[ExpenseCategory] = None
    is_tax_deductible: Optional[bool] = None
    vendor_name: Optional[str] = None
    gst_paid: Optional[Decimal] = None

class ExpenseResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str]
    amount: Decimal
    expense_date: date
    category: ExpenseCategory
    is_tax_deductible: bool
    gst_paid: Decimal
    vendor_name: Optional[str]
    invoice_reference: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class ExpenseSummary(BaseModel):
    total_expenses: int
    total_amount: Decimal
    total_deductible: Decimal
    total_gst_paid: Decimal
    by_category: dict

class TaxEstimate(BaseModel):
    gross_income: Decimal
    is_44ada_eligible: bool
    presumptive_income: Optional[Decimal]
    taxable_income: Decimal
    estimated_tax: Decimal
    tax_saving: Decimal
    message: str
    advance_tax: dict

class SafeToSpend(BaseModel):
    total_received: Decimal
    gst_due: Decimal
    advance_tax_reserve: Decimal
    total_expenses: Decimal
    safe_to_spend: Decimal
    is_deficit: bool
    deficit_amount: Decimal