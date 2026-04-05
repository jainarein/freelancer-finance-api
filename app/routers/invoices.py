from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from datetime import date
from app.database import get_db
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceSummary
from app.services.gst import calculate_gst, generate_invoice_number
from app.services.dependencies import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.post("/", response_model=InvoiceResponse, status_code=201)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Count existing invoices to generate number
    count = db.query(func.count(Invoice.id))\
               .filter(Invoice.user_id == current_user.id)\
               .scalar() + 1

    invoice_number = generate_invoice_number(str(current_user.id), count)

    # Auto calculate GST based on user's registration status
    gst_data = calculate_gst(payload.base_amount, current_user.is_gst_registered)

    invoice = Invoice(
        user_id=current_user.id,
        client_name=payload.client_name,
        client_email=payload.client_email,
        client_gstin=payload.client_gstin,
        invoice_number=invoice_number,
        description=payload.description,
        due_date=payload.due_date,
        base_amount=payload.base_amount,
        **gst_data
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    status: Optional[InvoiceStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Invoice).filter(Invoice.user_id == current_user.id)

    if status:
        query = query.filter(Invoice.status == status)

    return query.order_by(Invoice.created_at.desc()).all()


@router.get("/summary", response_model=InvoiceSummary)
def get_invoice_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoices = db.query(Invoice)\
                 .filter(Invoice.user_id == current_user.id)\
                 .all()

    total_billed = sum(i.total_amount for i in invoices)
    total_gst = sum(i.gst_amount for i in invoices)
    total_received = sum(i.total_amount for i in invoices if i.status == InvoiceStatus.PAID)
    total_pending = sum(i.total_amount for i in invoices if i.status == InvoiceStatus.SENT)
    overdue_count = sum(1 for i in invoices if i.status == InvoiceStatus.OVERDUE)

    return InvoiceSummary(
        total_invoices=len(invoices),
        total_billed=total_billed,
        total_gst=total_gst,
        total_received=total_received,
        total_pending=total_pending,
        overdue_count=overdue_count,
    )


@router.get("/overdue", response_model=List[InvoiceResponse])
def get_overdue_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    invoices = db.query(Invoice).filter(
        Invoice.user_id == current_user.id,
        Invoice.due_date < today,
        Invoice.status != InvoiceStatus.PAID,
        Invoice.status != InvoiceStatus.CANCELLED,
    ).all()

    # Auto mark as overdue
    for invoice in invoices:
        if invoice.status != InvoiceStatus.OVERDUE:
            invoice.status = InvoiceStatus.OVERDUE

    db.commit()
    return invoices


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return invoice


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: UUID,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit a paid invoice"
        )

    update_data = payload.model_dump(exclude_unset=True)

    # Recalculate GST if base amount changed
    if "base_amount" in update_data:
        gst_data = calculate_gst(
            update_data["base_amount"],
            current_user.is_gst_registered
        )
        update_data.update(gst_data)

    for field, value in update_data.items():
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a paid invoice"
        )

    db.delete(invoice)
    db.commit()