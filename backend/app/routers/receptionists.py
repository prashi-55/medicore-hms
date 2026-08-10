import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.auth.dependencies import require_admin
from app.models.user import User
from app.models.receptionist import Receptionist
from app.models.enums import UserRole
from app.schemas.receptionist import ReceptionistCreate, ReceptionistUpdate, ReceptionistOut
from app.auth.security import hash_password

router = APIRouter(prefix="/api/receptionists", tags=["Receptionists"])


def _to_out(r: Receptionist) -> ReceptionistOut:
    return ReceptionistOut(
        id=r.id,
        user_id=r.user_id,
        full_name=r.user.full_name,
        email=r.user.email,
        phone=r.user.phone,
        employee_code=r.employee_code,
        desk_location=r.desk_location,
        created_at=r.created_at,
    )


@router.get("", response_model=list[ReceptionistOut])
def list_receptionists(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(Receptionist).options(joinedload(Receptionist.user)).all()
    return [_to_out(r) for r in rows]


@router.post("", response_model=ReceptionistOut, status_code=201)
def create_receptionist(payload: ReceptionistCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(Receptionist).filter(Receptionist.employee_code == payload.employee_code).first():
        raise HTTPException(status_code=409, detail="Employee code already in use")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=UserRole.RECEPTIONIST,
    )
    db.add(user)
    db.flush()

    receptionist = Receptionist(
        user_id=user.id, employee_code=payload.employee_code, desk_location=payload.desk_location
    )
    db.add(receptionist)
    db.commit()
    db.refresh(receptionist)
    return _to_out(receptionist)


@router.put("/{receptionist_id}", response_model=ReceptionistOut)
def update_receptionist(
    receptionist_id: uuid.UUID, payload: ReceptionistUpdate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    r = db.get(Receptionist, receptionist_id)
    if not r:
        raise HTTPException(status_code=404, detail="Receptionist not found")
    data = payload.model_dump(exclude_unset=True)
    if "full_name" in data:
        r.user.full_name = data.pop("full_name")
    if "phone" in data:
        r.user.phone = data.pop("phone")
    if "is_active" in data:
        r.user.is_active = data.pop("is_active")
    for field, value in data.items():
        setattr(r, field, value)
    db.commit()
    db.refresh(r)
    return _to_out(r)


@router.delete("/{receptionist_id}", status_code=204)
def delete_receptionist(receptionist_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    r = db.get(Receptionist, receptionist_id)
    if not r:
        raise HTTPException(status_code=404, detail="Receptionist not found")
    user = r.user
    db.delete(r)
    db.delete(user)
    db.commit()
    return None
