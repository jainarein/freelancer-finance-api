from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from decimal import Decimal
from app.database import get_db
from app.models.user import User
from app.models.client import Client
from app.models.invoice import Invoice, InvoiceStatus
from app.models.expense import Expense
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse, RiskScoreResponse, HealthScoreResponse
from app.services.risk import calculate_risk_score, calculate_health_score
from app.services.dependencies import get_current_user

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post("/", response_model=ClientResponse, status_code=201)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = Client(
        user_id=current_user.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        company=payload.company,
        gstin=payload.gstin,
        notes=payload.notes,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/", response_model=List[ClientResponse])
def get_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Client)\
             .filter(Client.user_id == current_user.id)\
             .order_by(Client.risk_score.desc())\
             .all()


@router.get("/health-score", response_model=HealthScoreResponse)
def get_health_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoices = db.query(Invoice)\
                 .filter(Invoice.user_id == current_user.id)\
                 .all()
    expenses = db.query(Expense)\
                 .filter(Expense.user_id == current_user.id)\
                 .all()
    clients = db.query(Client)\
                .filter(Client.user_id == current_user.id)\
                .all()

    total_invoices = len(invoices)
    paid_invoices = sum(1 for i in invoices if i.status == InvoiceStatus.PAID)
    overdue_invoices = sum(1 for i in invoices if i.status == InvoiceStatus.OVERDUE)
    total_income = Decimal(str(sum(i.base_amount for i in invoices if i.status == InvoiceStatus.PAID))) if invoices else Decimal("0")
    total_expenses = Decimal(str(sum(e.amount for e in expenses))) if expenses else Decimal("0")
    total_deductible = Decimal(str(sum(e.amount for e in expenses if e.is_tax_deductible))) if expenses else Decimal("0")
    client_count = len(clients)
    high_risk_clients = sum(1 for c in clients if c.risk_score >= 50)

    result = calculate_health_score(
        total_invoices=total_invoices,
        paid_invoices=paid_invoices,
        overdue_invoices=overdue_invoices,
        total_income=total_income,
        total_expenses=total_expenses,
        total_deductible=total_deductible,
        is_gst_registered=current_user.is_gst_registered,
        has_pan=current_user.pan_number is not None,
        client_count=client_count,
        high_risk_clients=high_risk_clients,
    )
    return HealthScoreResponse(**result)


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.get("/{client_id}/risk", response_model=RiskScoreResponse)
def get_client_risk(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    result = calculate_risk_score(
        total_invoices=client.total_invoices,
        paid_invoices=client.paid_invoices,
        overdue_invoices=client.overdue_invoices,
        disputed_invoices=client.disputed_invoices,
        avg_payment_delay_days=client.avg_payment_delay_days,
        total_billed=Decimal(str(client.total_billed)),
        total_paid=Decimal(str(client.total_paid)),
    )

    # Update stored risk score
    client.risk_score = result["risk_score"]
    db.commit()

    return RiskScoreResponse(
        client_id=client.id,
        client_name=client.name,
        **result
    )


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: UUID,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    # Recalculate risk score
    result = calculate_risk_score(
        total_invoices=client.total_invoices,
        paid_invoices=client.paid_invoices,
        overdue_invoices=client.overdue_invoices,
        disputed_invoices=client.disputed_invoices,
        avg_payment_delay_days=client.avg_payment_delay_days,
        total_billed=Decimal(str(client.total_billed)),
        total_paid=Decimal(str(client.total_paid)),
    )
    client.risk_score = result["risk_score"]

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
def delete_client(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
