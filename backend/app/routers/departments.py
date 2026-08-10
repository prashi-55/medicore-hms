import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.department import Department
from app.models.doctor import Doctor
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut

router = APIRouter(prefix="/api/departments", tags=["Departments"])


def _to_out(db: Session, dept: Department) -> DepartmentOut:
    count = db.query(func.count(Doctor.id)).filter(Doctor.department_id == dept.id).scalar()
    return DepartmentOut(
        id=dept.id, name=dept.name, description=dept.description, doctor_count=count, created_at=dept.created_at
    )


@router.get("", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    depts = db.query(Department).order_by(Department.name).all()
    return [_to_out(db, d) for d in depts]


@router.post("", response_model=DepartmentOut, status_code=201)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(Department).filter(Department.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Department already exists")
    dept = Department(name=payload.name, description=payload.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return _to_out(db, dept)


@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(
    department_id: uuid.UUID, payload: DepartmentUpdate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    dept = db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
    db.commit()
    db.refresh(dept)
    return _to_out(db, dept)


@router.delete("/{department_id}", status_code=204)
def delete_department(department_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    dept = db.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if db.query(Doctor).filter(Doctor.department_id == department_id).first():
        raise HTTPException(status_code=409, detail="Cannot delete a department that has doctors assigned")
    db.delete(dept)
    db.commit()
    return None
