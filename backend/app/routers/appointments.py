import uuid
from datetime import datetime, timezone, date, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_patient, require_doctor, require_staff
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus, UserRole
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentStatusUpdate,
    AppointmentDiagnosisUpdate,
    AppointmentOut,
)

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


def _to_out(appt: Appointment) -> AppointmentOut:
    return AppointmentOut(
        id=appt.id,
        patient_id=appt.patient_id,
        patient_name=appt.patient.user.full_name if appt.patient else None,
        doctor_id=appt.doctor_id,
        doctor_name=appt.doctor.user.full_name if appt.doctor else None,
        department_name=appt.doctor.department.name if appt.doctor and appt.doctor.department else None,
        scheduled_at=appt.scheduled_at,
        status=appt.status,
        reason=appt.reason,
        diagnosis=appt.diagnosis,
        notes=appt.notes,
        has_prescription=appt.prescription is not None,
        created_at=appt.created_at,
    )


def _base_query(db: Session):
    return db.query(Appointment).options(
        joinedload(Appointment.patient).joinedload(Patient.user),
        joinedload(Appointment.doctor).joinedload(Doctor.user),
        joinedload(Appointment.doctor).joinedload(Doctor.department),
        joinedload(Appointment.prescription),
    )


@router.post("", response_model=AppointmentOut, status_code=201)
def book_appointment(
    payload: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Patients book for themselves. Receptionists can book on behalf of a patient (patient_id required)."""
    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        patient_id = patient.id
    elif current_user.role == UserRole.RECEPTIONIST:
        if not payload.patient_id:
            raise HTTPException(status_code=422, detail="patient_id is required when a receptionist books")
        patient = db.get(Patient, payload.patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient_id = patient.id
    else:
        raise HTTPException(status_code=403, detail="Only patients or receptionists can book appointments")

    doctor = db.get(Doctor, payload.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if payload.scheduled_at.astimezone(timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail="Cannot book an appointment in the past")

    conflict = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.scheduled_at == payload.scheduled_at,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=409, detail="This doctor already has an appointment at that time")

    appt = Appointment(
        patient_id=patient_id,
        doctor_id=doctor.id,
        scheduled_at=payload.scheduled_at,
        reason=payload.reason,
        status=AppointmentStatus.PENDING,
        booked_by_user_id=current_user.id,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return _to_out(appt)


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    scope: str = Query(default="all", description="all | upcoming | history | today"),
    status_filter: AppointmentStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Role-scoped: patients see their own, doctors see their own, staff/admin see all."""
    query = _base_query(db)

    if current_user.role == UserRole.PATIENT:
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        query = query.filter(Appointment.patient_id == patient.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        query = query.filter(Appointment.doctor_id == doctor.id)
    # receptionist & admin: unfiltered by owner - full visibility

    now = datetime.now(timezone.utc)
    if scope == "upcoming":
        query = query.filter(
            Appointment.scheduled_at >= now,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        )
    elif scope == "history":
        query = query.filter(
            (Appointment.scheduled_at < now) | (Appointment.status == AppointmentStatus.COMPLETED)
        )
    elif scope == "today":
    # Hospital operates using Indian Standard Time (IST).
        ist = ZoneInfo("Asia/Kolkata")

        now_ist = datetime.now(ist)

        start_of_today_ist = datetime(
            now_ist.year,
            now_ist.month,
            now_ist.day,
            tzinfo=ist,
        )

        start_of_tomorrow_ist = (
            start_of_today_ist.replace(
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )
            + timedelta(days=1)
        )

        start_of_today_utc = start_of_today_ist.astimezone(timezone.utc)
        start_of_tomorrow_utc = start_of_tomorrow_ist.astimezone(timezone.utc)

        query = query.filter(
            Appointment.scheduled_at >= start_of_today_utc,
            Appointment.scheduled_at < start_of_tomorrow_utc,
        )
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appts = query.order_by(Appointment.scheduled_at.desc()).all()
    return [_to_out(a) for a in appts]


def _get_owned_or_staff(db: Session, appointment_id: uuid.UUID, current_user: User) -> Appointment:
    appt = _base_query(db).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == UserRole.PATIENT and appt.patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your appointment")
    if current_user.role == UserRole.DOCTOR and appt.doctor.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your appointment")
    return appt


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return _to_out(_get_owned_or_staff(db, appointment_id, current_user))


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Patients may cancel only before confirmation (PENDING). Receptionists/admin can cancel anytime."""
    appt = _get_owned_or_staff(db, appointment_id, current_user)

    if current_user.role == UserRole.PATIENT and appt.status != AppointmentStatus.PENDING:
        raise HTTPException(status_code=409, detail="Only pending appointments can be cancelled by a patient")
    if current_user.role == UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Doctors cannot cancel appointments")
    if appt.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
        raise HTTPException(status_code=409, detail=f"Appointment already {appt.status.value}")

    appt.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(appt)
    return _to_out(appt)


@router.put("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentReschedule,
    db: Session = Depends(get_db),
    _=Depends(require_staff),
):
    appt = _base_query(db).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
        raise HTTPException(status_code=409, detail=f"Cannot reschedule a {appt.status.value} appointment")

    appt.scheduled_at = payload.scheduled_at
    appt.status = AppointmentStatus.PENDING
    db.commit()
    db.refresh(appt)
    return _to_out(appt)


@router.put("/{appointment_id}/status", response_model=AppointmentOut)
def update_status(
    appointment_id: uuid.UUID,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doctors update status through the workflow; receptionists may confirm bookings."""
    if current_user.role not in (UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not permitted to update appointment status")

    appt = _get_owned_or_staff(db, appointment_id, current_user)

    valid_transitions = {
        AppointmentStatus.PENDING: {AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED},
        AppointmentStatus.CONFIRMED: {AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED},
        AppointmentStatus.COMPLETED: set(),
        AppointmentStatus.CANCELLED: set(),
    }
    if payload.status not in valid_transitions[appt.status]:
        raise HTTPException(
            status_code=409, detail=f"Cannot transition appointment from {appt.status.value} to {payload.status.value}"
        )

    appt.status = payload.status
    db.commit()
    db.refresh(appt)
    return _to_out(appt)


@router.put("/{appointment_id}/diagnosis", response_model=AppointmentOut)
def add_diagnosis(
    appointment_id: uuid.UUID,
    payload: AppointmentDiagnosisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    appt = _get_owned_or_staff(db, appointment_id, current_user)
    if appt.status not in (AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED):
        raise HTTPException(status_code=409, detail="Diagnosis can only be added to a confirmed appointment")

    appt.diagnosis = payload.diagnosis
    appt.notes = payload.notes
    db.commit()
    db.refresh(appt)
    return _to_out(appt)
