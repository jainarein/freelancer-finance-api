from sqlalchemy import Column, String, Numeric, Boolean, Enum as SAEnum, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin

class ExpenseCategory(enum.Enum):
    EQUIPMENT = "equipment"
    SOFTWARE = "software"
    INTERNET = "internet"
    TRAVEL = "travel"
    COWORKING = "coworking"
    EDUCATION = "education"
    MARKETING = "marketing"
    UTILITIES = "utilities"
    FOOD = "food"
    OTHER = "other"

class Expense(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "expenses"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Expense details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(Date, nullable=False)

    # Auto-tagged category
    category = Column(
        SAEnum(ExpenseCategory),
        default=ExpenseCategory.OTHER
    )

    # Tax fields
    is_tax_deductible = Column(Boolean, default=False)
    gst_paid = Column(Numeric(12, 2), default=0.00)  # Input GST credit

    # Vendor info
    vendor_name = Column(String(100), nullable=True)
    invoice_reference = Column(String(50), nullable=True)

    # Relationship
    user = relationship("User", back_populates="expenses")

    def __repr__(self):
        return f"<Expense {self.title} - ₹{self.amount}>"
