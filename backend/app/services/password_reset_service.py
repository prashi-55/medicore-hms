import logging
import uuid
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.auth.security import hash_password
from app.models.user import User

logger = logging.getLogger("hms.password_reset")

RESET_TOKEN_TYPE = "password_reset"
RESET_TOKEN_TTL_MINUTES = 30


def send_reset_email(email: str, token: str) -> None:
    """
    Send the password reset link to the user's email using Gmail SMTP.
    """

    reset_link = (
        f"{settings.FRONTEND_URL}/reset-password?token={token}"
    )

    message = EmailMessage()

    message["Subject"] = "MediCore - Reset Your Password"
    message["From"] = settings.SMTP_USERNAME
    message["To"] = email

    message.set_content(
        f"""
Hello,

We received a request to reset your MediCore Hospital Management System password.

Click the link below to reset your password:

{reset_link}

This link will expire in {RESET_TOKEN_TTL_MINUTES} minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
MediCore Hospital Management System
"""
    )

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
        ) as server:

            server.starttls()

            server.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )

            server.send_message(message)

        logger.info("Password reset email sent successfully to %s", email)

    except Exception:
        logger.exception(
            "Failed to send password reset email to %s",
            email,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send password reset email",
        )


def create_reset_token(db: Session, email: str) -> None:
    """
    Always returns successfully regardless of whether the email exists,
    to avoid leaking which emails are registered.

    If the email exists, a reset token is generated and sent
    through Gmail SMTP.
    """

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        logger.info(
            "Password reset requested for unknown email: %s",
            email,
        )
        return

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=RESET_TOKEN_TTL_MINUTES
    )

    token = jwt.encode(
        {
            "sub": str(user.id),
            "type": RESET_TOKEN_TYPE,
            "exp": expire,
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    # Send the reset link through Gmail
    send_reset_email(email, token)

    logger.info(
        "Password reset token generated for %s "
        "(expires in %s min)",
        email,
        RESET_TOKEN_TTL_MINUTES,
    )


def reset_password(
    db: Session,
    token: str,
    new_password: str,
) -> None:

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    if payload.get("type") != RESET_TOKEN_TYPE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token",
        )

    try:
        user_id = uuid.UUID(payload.get("sub"))

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token",
        )

    user.hashed_password = hash_password(new_password)

    db.commit()