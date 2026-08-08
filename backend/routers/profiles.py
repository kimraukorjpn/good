from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import StudentProfile, User
from backend.schemas import StudentProfileResponse, StudentProfileUpdate
from backend.security import get_current_user

router = APIRouter(prefix="/api/profile", tags=["student-profile"])


@router.get("", response_model=StudentProfileResponse)
def get_profile(user: User = Depends(get_current_user)) -> StudentProfile:
    return user.profile


@router.put("", response_model=StudentProfileResponse)
def update_profile(
    payload: StudentProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudentProfile:
    profile = user.profile
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile