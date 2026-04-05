from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin

class Client(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "clients"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Client info
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(15), nullable=True)
    company = Column(String(100), nullable=True)
    gstin = Column(String(15), nullable=True)
    notes = Column(Text, nullable=True)

    # Payment behavior (auto-updated from invoices)
    total_invoices = Column(Integer, default=0)
    paid_invoices = Column(Integer, default=0)
    overdue_invoices = Column(Integer, default=0)
    disputed_invoices = Column(Integer, default=0)
    avg_payment_delay_days = Column(Integer, default=0)
    total_billed = Column(Numeric(12, 2), default=0)
    total_paid = Column(Numeric(12, 2), default=0)

    # Risk score (0-100, higher = riskier)
    risk_score = Column(Integer, default=0)
    is_blacklisted = Column(Boolean, default=False)

    user = relationship("User", back_populates="clients")

    def __repr__(self):
        return f"<Client {self.name} - Risk:{self.risk_score}>"
