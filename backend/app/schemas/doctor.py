import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field


class DoctorCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str
    phone: str | None = None
    department_id: uuid.UUID
    specialization: str
    qualification: str | None = None
    license_number: str
    years_of_experience: int = 0
    consultation_fee: float | None = None
    bio: str | None = None
    available_days: str | None = None
    available_start_time: str | None = None
    available_end_time: str | None = None


class DoctorUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    department_id: uuid.UUID | None = None
    specialization: str | None = None
    qualification: str | None = None
    years_of_experience: int | None = None
    consultation_fee: float | None = None
    bio: str | None = None
    available_days: str | None = None
    available_start_time: str | None = None
    available_end_time: str | None = None
    is_active: bool | None = None


class DoctorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    department_id: uuid.UUID
    department_name: str | None = None
    specialization: str
    qualification: str | None = None
    license_number: str
    years_of_experience: int
    consultation_fee: float | None = None
    bio: str | None = None
    available_days: str | None = None
    available_start_time: str | None = None
    available_end_time: str | None = None
    created_at: datetime
