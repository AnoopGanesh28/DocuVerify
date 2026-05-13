from typing import Optional

from sqlalchemy.orm import Session

from models.user import User
from core.security import hash_password, verify_password


def get_user_by_email(email: str, db: Session) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(username: str, db: Session) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(user_id: int, db: Session) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def register_user(username: str, email: str, password: str, db: Session) -> User:
    """
    Create a new user. Raises ValueError if the email or username is already taken.
    """
    if get_user_by_email(email, db):
        raise ValueError("A user with this email already exists")
    if get_user_by_username(username, db):
        raise ValueError("A user with this username already exists")

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(email: str, password: str, db: Session) -> Optional[User]:
    """
    Return the User if credentials are valid, otherwise None.
    """
    user = get_user_by_email(email, db)
    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
