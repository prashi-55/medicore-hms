import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_patient, require_staff
from app.models.user import User
from app.models.patient import Patient
from app.schemas.patient import PatientProfileUpdate, PatientOut, PatientSummary

router = APIRouter(prefix="/api/patients", tags=["Patients"])


def _to_out(patient: Patient) -> PatientOut:
    return PatientOut(
        id=patient.id,
        user_id=patient.user_id,
        full_name=patient.user.full_name,
        email=patient.user.email,
        phone=patient.user.phone,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        address=patient.address,
        blood_group=patient.blood_group,
        emergency_contact_name=patient.emergency_contact_name,
        emergency_contact_phone=patient.emergency_contact_phone,
        allergies=patient.allergies,
        created_at=patient.created_at,
    )


@router.get("/me", response_model=PatientOut)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(require_patient)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return _to_out(patient)


@router.put("/me", response_model=PatientOut)
def update_my_profile(
    payload: PatientProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_patient)
):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    data = payload.model_dump(exclude_unset=True)
    if "full_name" in data:
        current_user.full_name = data.pop("full_name")
    if "phone" in data:
        current_user.phone = data.pop("phone")
    for field, value in data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return _to_out(patient)


@router.get("", response_model=list[PatientSummary])
def list_patients(
    q: str | None = Query(default=None, description="Search by name, email or phone"),
    db: Session = Depends(get_db),
    _=Depends(require_staff),
):
    """Receptionist / Doctor / Admin: search & list patients."""
    query = db.query(Patient).options(joinedload(Patient.user)).join(User, Patient.user_id == User.id)
    if q:
        like = f"%{q}%"
        query = query.filter((User.full_name.ilike(like)) | (User.email.ilike(like)) | (User.phone.ilike(like)))
    patients = query.order_by(User.full_name).all()
    return [
        PatientSummary(id=p.id, full_name=p.user.full_name, email=p.user.email, phone=p.user.phone)
        for p in patients
    ]


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_staff)):
    patient = db.query(Patient).options(joinedload(Patient.user)).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _to_out(patient)
