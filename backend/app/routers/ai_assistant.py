import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.auth.dependencies import require_patient
from app.models.user import User
from app.models.patient import Patient
from app.models.prescription import Prescription
from app.models.ai_conversation import AIConversation, AIMessage
from app.schemas.ai_assistant import (
    AIChatRequest,
    AIChatResponse,
    AIConversationOut,
    AIConversationDetailOut,
    PrescriptionExplainRequest,
)
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Health Assistant"])

SUGGESTED_QUESTIONS = [
    "I have a mild headache, what could help?",
    "What's the difference between a cold and the flu?",
    "How much water should I drink daily?",
    "What are some tips for better sleep?",
    "When should I see a doctor for a fever?",
]


def _get_patient(db: Session, user: User) -> Patient:
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


@router.get("/suggested-questions")
def get_suggested_questions():
    return {"questions": SUGGESTED_QUESTIONS}


@router.get("/conversations", response_model=list[AIConversationOut])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(require_patient)):
    patient = _get_patient(db, current_user)
    convs = (
        db.query(AIConversation)
        .filter(AIConversation.patient_id == patient.id)
        .order_by(AIConversation.updated_at.desc())
        .all()
    )
    return convs


@router.get("/conversations/{conversation_id}", response_model=AIConversationDetailOut)
def get_conversation(
    conversation_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_patient)
):
    patient = _get_patient(db, current_user)
    conv = (
        db.query(AIConversation)
        .options(joinedload(AIConversation.messages))
        .filter(AIConversation.id == conversation_id, AIConversation.patient_id == patient.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_patient)
):
    patient = _get_patient(db, current_user)
    conv = (
        db.query(AIConversation)
        .filter(AIConversation.id == conversation_id, AIConversation.patient_id == patient.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return None


@router.post("/chat", response_model=AIChatResponse)
def chat(payload: AIChatRequest, db: Session = Depends(get_db), current_user: User = Depends(require_patient)):
    patient = _get_patient(db, current_user)

    if payload.conversation_id:
        conv = (
            db.query(AIConversation)
            .filter(AIConversation.id == payload.conversation_id, AIConversation.patient_id == patient.id)
            .first()
        )
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        title = payload.message.strip()[:60] or "New conversation"
        conv = AIConversation(patient_id=patient.id, title=title)
        db.add(conv)
        db.flush()

    history = [{"role": m.role, "content": m.content} for m in conv.messages]

    user_msg = AIMessage(conversation_id=conv.id, role="user", content=payload.message)
    db.add(user_msg)

    reply, is_emergency = ai_service.get_ai_reply(history, payload.message)
    if is_emergency:
        user_msg.is_emergency_flagged = True

    assistant_msg = AIMessage(
        conversation_id=conv.id, role="assistant", content=reply, is_emergency_flagged=is_emergency
    )
    db.add(assistant_msg)
    db.commit()

    return AIChatResponse(conversation_id=conv.id, reply=reply, is_emergency=is_emergency)


@router.post("/explain-prescription", response_model=AIChatResponse)
def explain_prescription(
    payload: PrescriptionExplainRequest, db: Session = Depends(get_db), current_user: User = Depends(require_patient)
):
    patient = _get_patient(db, current_user)
    prescription = (
        db.query(Prescription)
        .options(joinedload(Prescription.items))
        .filter(Prescription.id == payload.prescription_id, Prescription.patient_id == patient.id)
        .first()
    )
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    items = [
        {
            "medicine_name": i.medicine_name,
            "dosage": i.dosage,
            "frequency": i.frequency,
            "duration_days": i.duration_days,
            "instructions": i.instructions,
        }
        for i in prescription.items
    ]
    explanation = ai_service.explain_prescription(items, prescription.notes)

    conv = AIConversation(patient_id=patient.id, title=f"Prescription explained ({prescription.created_at.date()})")
    db.add(conv)
    db.flush()
    db.add(AIMessage(conversation_id=conv.id, role="user", content="Please explain my prescription."))
    db.add(AIMessage(conversation_id=conv.id, role="assistant", content=explanation))
    db.commit()

    return AIChatResponse(conversation_id=conv.id, reply=explanation, is_emergency=False)
