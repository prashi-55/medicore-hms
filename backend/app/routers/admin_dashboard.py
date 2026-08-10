from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.auth.dependencies import require_admin
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.receptionist import Receptionist
from app.models.department import Department
from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus

router = APIRouter(prefix="/api/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    total_patients = db.query(func.count(Patient.id)).scalar()
    total_doctors = db.query(func.count(Doctor.id)).scalar()
    total_receptionists = db.query(func.count(Receptionist.id)).scalar()
    total_departments = db.query(func.count(Department.id)).scalar()
    todays_appointments = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.scheduled_at >= today_start, Appointment.scheduled_at < today_end)
        .scalar()
    )

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_receptionists": total_receptionists,
        "total_departments": total_departments,
        "todays_appointments": todays_appointments,
    }


@router.get("/charts/patients-per-month")
def patients_per_month(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(func.to_char(Patient.created_at, "YYYY-MM").label("month"), func.count(Patient.id).label("count"))
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": r.month, "count": r.count} for r in rows]


@router.get("/charts/appointments-per-month")
def appointments_per_month(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(
            func.to_char(Appointment.scheduled_at, "YYYY-MM").label("month"),
            func.count(Appointment.id).label("count"),
        )
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": r.month, "count": r.count} for r in rows]


@router.get("/charts/doctors-per-department")
def doctors_per_department(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(Department.name.label("department"), func.count(Doctor.id).label("count"))
        .outerjoin(Doctor, Doctor.department_id == Department.id)
        .group_by(Department.name)
        .order_by(Department.name)
        .all()
    )
    return [{"department": r.department, "count": r.count} for r in rows]


@router.get("/charts/appointment-status-breakdown")
def appointment_status_breakdown(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(Appointment.status.label("status"), func.count(Appointment.id).label("count"))
        .group_by(Appointment.status)
        .all()
    )
    return [{"status": r.status.value, "count": r.count} for r in rows]
