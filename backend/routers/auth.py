from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import StudentProfile, User
from backend.schemas import LoginRequest, RegisterRequest, UserResponse
from backend.security import SESSION_COOKIE, clear_session, create_session, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        created_at=user.created_at,
        profile_completed=bool(user.profile and user.profile.grade and user.profile.graduation_year),
        grade=user.profile.grade if user.profile else None,
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)) -> UserResponse:
    email = payload.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 가입된 이메일입니다.")
    user = User(email=email, password_hash=hash_password(payload.password), full_name=payload.full_name.strip())
    db.add(user)
    db.flush()
    db.add(StudentProfile(user_id=user.id))
    db.commit()
    db.refresh(user)
    create_session(response, user, db)
    return user_response(user)


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> UserResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    create_session(response, user, db)
    return user_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    clear_session(response, request.cookies.get(SESSION_COOKIE), db)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return user_response(user)