import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    decode_token,
)
from app.models.user import User, RefreshToken
from app.models.patient import Patient
from app.models.enums import UserRole
from app.schemas.auth import PatientRegisterRequest, LoginRequest, TokenResponse, RefreshRequest


def register_patient(db: Session, payload: PatientRegisterRequest) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=UserRole.PATIENT,
    )
    db.add(user)
    db.flush()  # get user.id before creating dependent row

    patient = Patient(
        user_id=user.id,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
    )
    db.add(patient)
    db.commit()
    db.refresh(user)

    return _issue_tokens(db, user)


def login(db: Session, payload: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return _issue_tokens(db, user)


def refresh_access_token(db: Session, payload: RefreshRequest) -> TokenResponse:
    try:
        decoded = decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    token_row = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == hash_token(payload.refresh_token))
        .first()
    )
    if token_row is None or token_row.revoked or token_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")

    user = db.get(User, token_row.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    # Rotate: revoke old refresh token, issue a new pair
    token_row.revoked = True
    db.commit()

    return _issue_tokens(db, user)


def logout(db: Session, refresh_token: str) -> None:
    token_row = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(refresh_token)).first()
    if token_row:
        token_row.revoked = True
        db.commit()


def _issue_tokens(db: Session, user: User) -> TokenResponse:
    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token_str, expires_at = create_refresh_token(subject=str(user.id))

    db.add(
        RefreshToken(
            id=uuid.uuid4(),
            user_id=user.id,
            token_hash=hash_token(refresh_token_str),
            expires_at=expires_at,
        )
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
    )
