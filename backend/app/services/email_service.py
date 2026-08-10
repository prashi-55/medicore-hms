import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_password_reset_email(
    recipient_email: str,
    reset_url: str,
) -> None:
    message = EmailMessage()

    message["Subject"] = "MediCore - Reset Your Password"
    message["From"] = settings.SMTP_USERNAME
    message["To"] = recipient_email

    message.set_content(
        f"""
Hello,

We received a request to reset your MediCore password.

Click the link below to reset your password:

{reset_url}

This link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
MediCore Hospital Systems
"""
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )
        server.send_message(message)