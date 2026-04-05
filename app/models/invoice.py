from sqlalchemy import Column, String, Numeric, Boolean, Enum as SAEnum, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin

class InvoiceStatus(enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class Invoice(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "invoices"

    # Foreign key to user
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Client info
    client_name = Column(String(100), nullable=False)
    client_email = Column(String(255), nullable=True)
    client_gstin = Column(String(15), nullable=True)

    # Invoice details
    invoice_number = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=False)

    # Financials
    base_amount = Column(Numeric(12, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), default=0.00)
    gst_amount = Column(Numeric(12, 2), default=0.00)
    total_amount = Column(Numeric(12, 2), nullable=False)

    # Flags
    is_gst_applicable = Column(Boolean, default=False)
    status = Column(SAEnum(InvoiceStatus), default=InvoiceStatus.DRAFT)

    # Relationships
    user = relationship("User", back_populates="invoices")

    def __repr__(self):
        return f"<Invoice {self.invoice_number} - {self.status}>"
