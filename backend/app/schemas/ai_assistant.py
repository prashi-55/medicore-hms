import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AIMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    content: str
    is_emergency_flagged: bool
    created_at: datetime


class AIConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime


class AIConversationDetailOut(AIConversationOut):
    messages: list[AIMessageOut]


class AIChatRequest(BaseModel):
    conversation_id: uuid.UUID | None = None
    message: str


class AIChatResponse(BaseModel):
    conversation_id: uuid.UUID
    reply: str
    is_emergency: bool
    disclaimer: str = (
        "This AI assistant is for informational purposes only and is not a substitute for "
        "professional medical advice."
    )


class PrescriptionExplainRequest(BaseModel):
    prescription_id: uuid.UUID
