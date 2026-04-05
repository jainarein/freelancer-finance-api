from sqlalchemy import Column, String, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin

class UserRole(enum.Enum):
    FREELANCER = "freelancer"
    ADMIN = "admin"

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=True)
    pan_number = Column(String(10), nullable=True)
    gstin = Column(String(15), nullable=True)
    is_gst_registered = Column(Boolean, default=False)
    role = Column(SAEnum(UserRole), default=UserRole.FREELANCER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    invoices = relationship("Invoice", back_populates="user")
    expenses = relationship("Expense", back_populates="user")
    clients = relationship("Client", back_populates="user")

    def __repr__(self):
        return f"<User {self.email}>"
