import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_doctor, require_patient
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.prescription import Prescription, PrescriptionItem
from app.models.enums import AppointmentStatus, UserRole
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate, PrescriptionOut

router = APIRouter(prefix="/api/prescriptions", tags=["Prescriptions"])


def _to_out(p: Prescription) -> PrescriptionOut:
    return PrescriptionOut(
        id=p.id,
        appointment_id=p.appointment_id,
        patient_id=p.patient_id,
        patient_name=p.patient.user.full_name if p.patient else None,
        doctor_id=p.doctor_id,
        doctor_name=p.doctor.user.full_name if p.doctor else None,
        notes=p.notes,
        items=list(p.items),
        created_at=p.created_at,
    )


def _base_query(db: Session):
    return db.query(Prescription).options(
        joinedload(Prescription.patient).joinedload(Patient.user),
        joinedload(Prescription.doctor).joinedload(Doctor.user),
        joinedload(Prescription.items),
    )


@router.post("", response_model=PrescriptionOut, status_code=201)
def create_prescription(
    payload: PrescriptionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_doctor)
):
    appt = db.get(Appointment, payload.appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if appt.doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Not your appointment")
    if appt.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=409, detail="Cannot prescribe for a cancelled appointment")
    if appt.prescription is not None:
        raise HTTPException(status_code=409, detail="This appointment already has a prescription; use PUT to edit")

    prescription = Prescription(
        appointment_id=appt.id, patient_id=appt.patient_id, doctor_id=doctor.id, notes=payload.notes
    )
    db.add(prescription)
    db.flush()

    for item in payload.items:
        db.add(PrescriptionItem(prescription_id=prescription.id, **item.model_dump()))

    db.commit()
    db.refresh(prescription)
    return _to_out(prescription)


@router.put("/{prescription_id}", response_model=PrescriptionOut)
def update_prescription(
    prescription_id: uuid.UUID,
    payload: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """Doctor can edit a prescription only before the appointment is marked completed."""
    prescription = _base_query(db).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if prescription.doctor.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your prescription")

    appt = db.get(Appointment, prescription.appointment_id)
    if appt.status == AppointmentStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="Cannot edit a prescription after the appointment is completed")

    if payload.notes is not None:
        prescription.notes = payload.notes
    if payload.items is not None:
        for existing_item in list(prescription.items):
            db.delete(existing_item)
        db.flush()
        for item in payload.items:
            db.add(PrescriptionItem(prescription_id=prescription.id, **item.model_dump()))

    db.commit()
    db.refresh(prescription)
    return _to_out(prescription)


@router.get("/me", response_model=list[PrescriptionOut])
def my_prescriptions(db: Session = Depends(get_db), current_user: User = Depends(require_patient)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    rows = _base_query(db).filter(Prescription.patient_id == patient.id).order_by(Prescription.created_at.desc()).all()
    return [_to_out(p) for p in rows]


@router.get("/{prescription_id}", response_model=PrescriptionOut)
def get_prescription(
    prescription_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    prescription = _base_query(db).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if current_user.role == UserRole.PATIENT and prescription.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your prescription")
    if current_user.role == UserRole.DOCTOR and prescription.doctor.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your prescription")

    return _to_out(prescription)
