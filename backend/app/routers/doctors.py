import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.doctor import Doctor
from app.models.department import Department
from app.models.enums import UserRole
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorOut
from app.auth.security import hash_password

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])


def _to_out(doctor: Doctor) -> DoctorOut:
    return DoctorOut(
        id=doctor.id,
        user_id=doctor.user_id,
        full_name=doctor.user.full_name,
        email=doctor.user.email,
        phone=doctor.user.phone,
        department_id=doctor.department_id,
        department_name=doctor.department.name if doctor.department else None,
        specialization=doctor.specialization,
        qualification=doctor.qualification,
        license_number=doctor.license_number,
        years_of_experience=doctor.years_of_experience,
        consultation_fee=float(doctor.consultation_fee) if doctor.consultation_fee is not None else None,
        bio=doctor.bio,
        available_days=doctor.available_days,
        available_start_time=doctor.available_start_time,
        available_end_time=doctor.available_end_time,
        created_at=doctor.created_at,
    )


@router.get("", response_model=list[DoctorOut])
def search_doctors(
    q: str | None = Query(default=None, description="Search by name or specialization"),
    department_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Available to any authenticated role - patients search doctors to book appointments."""
    query = db.query(Doctor).options(joinedload(Doctor.user), joinedload(Doctor.department))
    if department_id:
        query = query.filter(Doctor.department_id == department_id)
    if q:
        like = f"%{q}%"
        query = query.join(User, Doctor.user_id == User.id).filter(
            (User.full_name.ilike(like)) | (Doctor.specialization.ilike(like))
        )
    doctors = query.order_by(Doctor.years_of_experience.desc()).all()
    return [_to_out(d) for d in doctors]


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    doctor = (
        db.query(Doctor)
        .options(joinedload(Doctor.user), joinedload(Doctor.department))
        .filter(Doctor.id == doctor_id)
        .first()
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return _to_out(doctor)


@router.post("", response_model=DoctorOut, status_code=201)
def create_doctor(payload: DoctorCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if not db.get(Department, payload.department_id):
        raise HTTPException(status_code=404, detail="Department not found")
    if db.query(Doctor).filter(Doctor.license_number == payload.license_number).first():
        raise HTTPException(status_code=409, detail="License number already in use")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=UserRole.DOCTOR,
    )
    db.add(user)
    db.flush()

    doctor = Doctor(
        user_id=user.id,
        department_id=payload.department_id,
        specialization=payload.specialization,
        qualification=payload.qualification,
        license_number=payload.license_number,
        years_of_experience=payload.years_of_experience,
        consultation_fee=payload.consultation_fee,
        bio=payload.bio,
        available_days=payload.available_days,
        available_start_time=payload.available_start_time,
        available_end_time=payload.available_end_time,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return _to_out(doctor)


@router.put("/{doctor_id}", response_model=DoctorOut)
def update_doctor(
    doctor_id: uuid.UUID, payload: DoctorUpdate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    doctor = db.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    data = payload.model_dump(exclude_unset=True)
    is_active = data.pop("is_active", None)
    full_name = data.pop("full_name", None)
    phone = data.pop("phone", None)

    for field, value in data.items():
        setattr(doctor, field, value)

    if full_name is not None:
        doctor.user.full_name = full_name
    if phone is not None:
        doctor.user.phone = phone
    if is_active is not None:
        doctor.user.is_active = is_active

    db.commit()
    db.refresh(doctor)
    return _to_out(doctor)


@router.delete("/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    doctor = db.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    user = doctor.user
    db.delete(doctor)
    db.delete(user)
    db.commit()
    return None
