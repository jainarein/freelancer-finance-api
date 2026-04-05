from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense, ExpenseCategory
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    ExpenseSummary, TaxEstimate, SafeToSpend
)
from app.services.tagger import tag_expense
from app.services.tax import calculate_44ada, calculate_advance_tax, calculate_safe_to_spend
from app.services.dependencies import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/", response_model=ExpenseResponse, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tags = tag_expense(payload.title)
    expense = Expense(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        amount=payload.amount,
        expense_date=payload.expense_date,
        vendor_name=payload.vendor_name,
        invoice_reference=payload.invoice_reference,
        gst_paid=payload.gst_paid,
        **tags
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[ExpenseCategory] = None,
    deductible_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if category:
        query = query.filter(Expense.category == category)
    if deductible_only:
        query = query.filter(Expense.is_tax_deductible == True)
    return query.order_by(Expense.expense_date.desc()).all()


@router.get("/summary", response_model=ExpenseSummary)
def get_expense_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    total_amount = sum(e.amount for e in expenses) if expenses else Decimal("0")
    total_deductible = sum(e.amount for e in expenses if e.is_tax_deductible) if expenses else Decimal("0")
    total_gst_paid = sum(e.gst_paid for e in expenses) if expenses else Decimal("0")
    by_category = {}
    for e in expenses:
        cat = e.category.value
        by_category[cat] = by_category.get(cat, Decimal("0")) + e.amount
    return ExpenseSummary(
        total_expenses=len(expenses),
        total_amount=total_amount,
        total_deductible=total_deductible,
        total_gst_paid=total_gst_paid,
        by_category={k: str(v) for k, v in by_category.items()},
    )


@router.get("/tax-estimate", response_model=TaxEstimate)
def get_tax_estimate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paid_invoices = db.query(Invoice).filter(
        Invoice.user_id == current_user.id,
        Invoice.status == InvoiceStatus.PAID
    ).all()

    gross_income = Decimal(str(sum(i.base_amount for i in paid_invoices))) if paid_invoices else Decimal("0")
    result = calculate_44ada(gross_income)

    # Safely get tax amount — never None
    tax_amount = result.get("presumptive_tax") or result.get("estimated_tax") or Decimal("0")
    advance = calculate_advance_tax(tax_amount)

    return TaxEstimate(
        gross_income=gross_income,
        is_44ada_eligible=result["is_eligible"],
        presumptive_income=result.get("presumptive_income"),
        taxable_income=result.get("taxable_income", gross_income),
        estimated_tax=result.get("normal_tax") or tax_amount,
        tax_saving=result.get("tax_saving", Decimal("0")),
        message=result["message"],
        advance_tax=advance,
    )


@router.get("/safe-to-spend", response_model=SafeToSpend)
def get_safe_to_spend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paid_invoices = db.query(Invoice).filter(
        Invoice.user_id == current_user.id,
        Invoice.status == InvoiceStatus.PAID
    ).all()

    total_received = Decimal(str(sum(i.total_amount for i in paid_invoices))) if paid_invoices else Decimal("0")
    gst_collected = Decimal(str(sum(i.gst_amount for i in paid_invoices))) if paid_invoices else Decimal("0")
    gross_income = Decimal(str(sum(i.base_amount for i in paid_invoices))) if paid_invoices else Decimal("0")

    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    total_expenses = Decimal(str(sum(e.amount for e in expenses))) if expenses else Decimal("0")

    tax_result = calculate_44ada(gross_income)
    tax_amount = tax_result.get("presumptive_tax") or tax_result.get("estimated_tax") or Decimal("0")
    advance_tax_reserve = (tax_amount * Decimal("15") / 100).quantize(Decimal("0.01"))

    result = calculate_safe_to_spend(
        total_received=total_received,
        gst_collected=gst_collected,
        advance_tax=advance_tax_reserve,
        total_expenses=total_expenses,
    )
    return SafeToSpend(**result)


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: UUID,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "title" in update_data:
        tags = tag_expense(update_data["title"])
        update_data.update(tags)
    for field, value in update_data.items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    db.delete(expense)
    db.commit()