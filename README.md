# MediCore — Hospital Management System

A full-stack, multi-role Hospital Management System.

- **Backend:** FastAPI + SQLAlchemy + Alembic + PostgreSQL, JWT auth, RBAC, AI Health Assistant (OpenAI, configurable).
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + TanStack Query + React Router + React Hook Form + Recharts.

Verified end-to-end during development: migrations generate/apply cleanly against a real
Postgres database, and the full workflow (register → admin creates department/doctor →
patient books → doctor confirms/diagnoses/prescribes → patient views + AI explains it,
including AI emergency-keyword detection) was exercised against the running API.

---

## 1. Project structure

```
hms/
├── backend/                 FastAPI application
│   ├── app/
│   │   ├── core/             settings (pydantic-settings, reads .env)
│   │   ├── database/         SQLAlchemy engine/session
│   │   ├── models/            SQLAlchemy ORM models (Users, Patients, Doctors,
│   │   │                       Receptionists, Departments, Appointments, Prescriptions,
│   │   │                       AI conversation history)
│   │   ├── schemas/           Pydantic request/response schemas
│   │   ├── auth/              password hashing, JWT issuance/validation, RBAC dependencies
│   │   ├── services/          business logic (auth, password reset, AI assistant)
│   │   ├── routers/           API endpoints, grouped by resource
│   │   └── main.py            FastAPI app, CORS, error handlers, router wiring
│   ├── alembic/                migration environment (auto-generates from models)
│   ├── requirements.txt
│   └── .env.example
└── frontend/                 React + TypeScript SPA
    └── src/
        ├── components/        reusable UI (ui/, patient/, doctor/, receptionist/, ai/)
        ├── pages/              route-level pages, grouped by role (auth/, patient/, doctor/,
        │                       receptionist/, admin/)
        ├── layouts/            AppShell (sidebar+navbar), AuthLayout
        ├── context/            AuthContext, ToastContext
        ├── services/           axios client + typed API service functions
        ├── routes/             ProtectedRoute (auth + RBAC guard)
        └── types/              shared TypeScript types mirroring backend schemas
```

---

## 2. Backend setup

### Prerequisites
- Python 3.11+
- PostgreSQL 14+ running locally (or a connection string to a hosted instance)

### Steps

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET_KEY (use a long random value), and
# OPENAI_API_KEY if you want real AI responses (see section 4 below).

# Create the database (adjust to your local Postgres setup):
#   psql -c "CREATE USER hms_user WITH PASSWORD 'hms_password' CREATEDB;"
#   psql -c "CREATE DATABASE hms_db OWNER hms_user;"

alembic upgrade head               # applies the full schema

uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

### Creating the first Admin account

There's deliberately no public "sign up as Admin" endpoint (Doctors and Receptionists are
created by an Admin; only Patients can self-register). Bootstrap your first Admin directly:

```bash
cd backend
python3 - << 'EOF'
from app.database.session import SessionLocal
from app.models.user import User
from app.models.enums import UserRole
from app.auth.security import hash_password
import uuid

db = SessionLocal()
db.add(User(
    id=uuid.uuid4(),
    email="admin@yourhospital.com",
    hashed_password=hash_password("choose-a-strong-password"),
    full_name="System Admin",
    role=UserRole.ADMIN,
))
db.commit()
EOF
```

Log in with that account, then use the Admin portal to create Departments, Doctors, and
Receptionists.

---

## 3. Frontend setup

### Prerequisites
- Node.js 18+

### Steps

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL should point at your running backend (default http://localhost:8000)

npm run dev
```

The app is now at `http://localhost:5173`.

Build for production: `npm run build` (outputs to `frontend/dist`, deployable to any static host).

---

## 4. AI Health Assistant configuration

The AI provider is configurable via `AI_PROVIDER` / `OPENAI_MODEL` / `OPENAI_API_KEY` in the
backend `.env`. With no key configured, the assistant runs in a safe deterministic fallback
mode (still fully functional for demos — including emergency-keyword detection, which runs
independently of the model). Set `OPENAI_API_KEY` to enable real model responses via the
OpenAI API.

Safety design:
- The assistant is available to Patients only (enforced via RBAC on every `/api/ai/*` route).
- A deterministic keyword scan for emergency symptoms (chest pain, difficulty breathing,
  stroke symptoms, severe bleeding, loss of consciousness, etc.) runs on every message,
  independent of the model — so the "seek immediate medical attention" warning is never
  solely dependent on model behavior.
- The system prompt hard-constrains the model from diagnosing conditions.
- Every response includes the required informational-use disclaimer.

---

## 5. Roles & access control

| Role | Highlights |
|---|---|
| **Patient** | Self-registers. Search/book/cancel appointments, view prescriptions, AI Health Assistant, profile management. |
| **Doctor** | Created by Admin. Views own appointments, confirms/completes visits, records diagnosis, creates/edits prescriptions (editable until the appointment is completed). |
| **Receptionist** | Created by Admin. Registers patients, books/cancels/reschedules appointments on behalf of patients, checks doctor availability. |
| **Admin** | Full CRUD on Doctors, Receptionists, Departments; read access to all Patients/Appointments; dashboard analytics. |

Every protected endpoint is enforced server-side via JWT + role dependencies in
`app/auth/dependencies.py` (`require_patient`, `require_doctor`, `require_receptionist`,
`require_admin`, `require_staff`) — the frontend's route guards are a UX convenience, not the
security boundary.

Auth uses short-lived access tokens (30 min default) + longer-lived refresh tokens (7 days),
with refresh-token rotation and revocation on logout. Passwords are hashed with bcrypt.

---

## 6. Deployment notes

- **Backend:** any ASGI host (e.g. a container running `uvicorn app.main:app` behind a
  reverse proxy, or a platform like Render/Fly/ECS). Run `alembic upgrade head` as a release
  step. Set `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, and `OPENAI_API_KEY` as
  environment variables/secrets — never commit `.env`.
- **Frontend:** `npm run build` produces a static `dist/` bundle deployable to any static host
  (Vercel, Netlify, S3+CloudFront, etc.), with `VITE_API_BASE_URL` set at build time to your
  backend's public URL.
- **Database:** managed PostgreSQL (RDS, Cloud SQL, Supabase, etc.) works out of the box —
  only `DATABASE_URL` needs to change.

---

## 7. What's implemented vs. natural next steps

Implemented and verified: full auth flow (register/login/refresh/logout/forgot/reset),
RBAC across all 4 roles, department/doctor/receptionist CRUD, doctor search, appointment
booking/confirm/reschedule/cancel/complete workflow with valid state transitions, diagnosis
and prescription creation/editing, patient prescription viewing, AI Health Assistant chat with
history/suggested questions/emergency detection/prescription explanation, and admin analytics
dashboard with charts.

Natural next steps for a production rollout: rate limiting, an email/SMS provider wired into
the password-reset flow (currently logs the reset token server-side rather than emailing it),
audit logging, automated tests (pytest for the API, Vitest/RTL for the frontend), and
containerization (Dockerfile/docker-compose) for one-command local spin-up.
