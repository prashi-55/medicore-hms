from app.database.session import SessionLocal
from app.models.user import User
from app.models.enums import UserRole
from app.auth.security import hash_password

db = SessionLocal()

existing = db.query(User).filter(User.email == "admin@hospital.com").first()

if existing:
    print("✅ Admin already exists!")
else:
    admin = User(
        email="admin@hospital.com",
        hashed_password=hash_password("Admin@123"),
        full_name="System Admin",
        phone="9999999999",
        role=UserRole.ADMIN,
        is_active=True,
    )

    db.add(admin)
    db.commit()

    print("✅ Admin created successfully!")