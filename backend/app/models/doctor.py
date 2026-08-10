import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Text, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.session import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    specialization: Mapped[str] = mapped_column(String(150), nullable=False)
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    license_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    years_of_experience: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    consultation_fee: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    available_days: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g. "Mon,Tue,Wed"
    available_start_time: Mapped[str | None] = mapped_column(String(5), nullable=True)  # "09:00"
    available_end_time: Mapped[str | None] = mapped_column(String(5), nullable=True)  # "17:00"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="doctor", cascade="all, delete-orphan")
