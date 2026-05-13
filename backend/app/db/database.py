from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from core.config import settings

# SQLite needs check_same_thread=False; PostgreSQL doesn't need connect_args
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ── FastAPI dependency ───────────────────────────────────────────────────────
def get_db():
    """Yields a SQLAlchemy session and ensures it is closed after each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
