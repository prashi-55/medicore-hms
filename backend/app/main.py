import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.routers import (
    auth,
    patients,
    doctors,
    receptionists,
    departments,
    appointments,
    prescriptions,
    ai_assistant,
    admin_dashboard,
)

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Hospital Management System API",
    description="Production-grade REST API for a multi-role Hospital Management System.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
def handle_integrity_error(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "A database constraint was violated (duplicate or invalid reference)."},
    )


@app.exception_handler(RequestValidationError)
def handle_validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": exc.errors()},
    )


app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(receptionists.router)
app.include_router(departments.router)
app.include_router(appointments.router)
app.include_router(prescriptions.router)
app.include_router(ai_assistant.router)
app.include_router(admin_dashboard.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
