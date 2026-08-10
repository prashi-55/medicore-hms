import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field


class ReceptionistCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str
    phone: str | None = None
    employee_code: str
    desk_location: str | None = None


class ReceptionistUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    desk_location: str | None = None
    is_active: bool | None = None


class ReceptionistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    employee_code: str
    desk_location: str | None = None
    created_at: datetime
