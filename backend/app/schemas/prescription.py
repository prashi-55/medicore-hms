import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PrescriptionItemCreate(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration_days: int = Field(gt=0)
    instructions: str | None = None


class PrescriptionItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    medicine_name: str
    dosage: str
    frequency: str
    duration_days: int
    instructions: str | None = None


class PrescriptionCreate(BaseModel):
    appointment_id: uuid.UUID
    notes: str | None = None
    items: list[PrescriptionItemCreate] = Field(min_length=1)


class PrescriptionUpdate(BaseModel):
    notes: str | None = None
    items: list[PrescriptionItemCreate] | None = None


class PrescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    appointment_id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: str | None = None
    doctor_id: uuid.UUID
    doctor_name: str | None = None
    notes: str | None = None
    items: list[PrescriptionItemOut]
    created_at: datetime
