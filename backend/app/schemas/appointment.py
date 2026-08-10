import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import AppointmentStatus


class AppointmentCreate(BaseModel):
    doctor_id: uuid.UUID
    scheduled_at: datetime
    reason: str | None = None
    patient_id: uuid.UUID | None = None  # only used when a receptionist books on behalf of a patient


class AppointmentReschedule(BaseModel):
    scheduled_at: datetime


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentDiagnosisUpdate(BaseModel):
    diagnosis: str
    notes: str | None = None


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: str | None = None
    doctor_id: uuid.UUID
    doctor_name: str | None = None
    department_name: str | None = None
    scheduled_at: datetime
    status: AppointmentStatus
    reason: str | None = None
    diagnosis: str | None = None
    notes: str | None = None
    has_prescription: bool = False
    created_at: datetime
