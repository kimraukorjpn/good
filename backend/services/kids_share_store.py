import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.models import KidsExperienceShare
from backend.schemas import (
    KidsExperienceAnalyzeRequest,
    KidsExperienceAnalyzeResponse,
    KidsExperienceShareReadResponse,
)


def create_share_token() -> str:
    return secrets.token_urlsafe(16)


def create_kids_share(
    db: Session,
    draft: KidsExperienceAnalyzeRequest,
    result: KidsExperienceAnalyzeResponse,
) -> str:
    token = create_share_token()
    while db.query(KidsExperienceShare).filter_by(share_token=token).first():
        token = create_share_token()

    share = KidsExperienceShare(
        share_token=token,
        participant_name=draft.participant_name,
        draft_payload=draft.model_dump(mode="json"),
        result_payload=result.model_dump(mode="json"),
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return token


def read_kids_share(db: Session, token: str) -> KidsExperienceShareReadResponse:
    safe_token = token.strip()
    if not safe_token or any(character not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_" for character in safe_token):
        raise HTTPException(status_code=404, detail="공유 리포트를 찾지 못했습니다.")

    share = db.query(KidsExperienceShare).filter_by(share_token=safe_token).first()
    if not share:
        raise HTTPException(status_code=404, detail="공유 리포트를 찾지 못했습니다.")

    try:
        return KidsExperienceShareReadResponse(
            token=safe_token,
            draft=KidsExperienceAnalyzeRequest(**share.draft_payload),
            result=KidsExperienceAnalyzeResponse(**share.result_payload),
        )
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(status_code=500, detail="공유 리포트를 불러오지 못했습니다.") from error
