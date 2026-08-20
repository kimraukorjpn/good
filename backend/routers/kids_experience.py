from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import (
    KidsExperienceAnalyzeRequest,
    KidsExperienceAnalyzeResponse,
    KidsExperienceReportRequest,
    KidsExperienceShareCreateRequest,
    KidsExperienceShareCreateResponse,
    KidsExperienceShareReadResponse,
)
from backend.services.kids_experience import maybe_generate_with_ai
from backend.services.kids_report import build_kids_report_pdf
from backend.services.kids_share_store import create_kids_share, read_kids_share

router = APIRouter(prefix="/api/kids-experience", tags=["kids-experience"])


@router.post("/analyze", response_model=KidsExperienceAnalyzeResponse)
async def analyze_kids_experience(
    request: KidsExperienceAnalyzeRequest,
) -> KidsExperienceAnalyzeResponse:
    return await maybe_generate_with_ai(request)


@router.post("/report")
async def create_kids_report(request: KidsExperienceReportRequest) -> StreamingResponse:
    pdf_bytes = build_kids_report_pdf(request.draft, request.result)
    safe_filename = "kids-future-report.pdf"
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"'
        },
    )


@router.post("/share", response_model=KidsExperienceShareCreateResponse)
async def create_kids_share_link(
    request: KidsExperienceShareCreateRequest,
    db: Session = Depends(get_db),
) -> KidsExperienceShareCreateResponse:
    token = create_kids_share(db, request.draft, request.result)
    return KidsExperienceShareCreateResponse(token=token)


@router.get("/share/{token}", response_model=KidsExperienceShareReadResponse)
async def read_kids_share_link(
    token: str,
    db: Session = Depends(get_db),
) -> KidsExperienceShareReadResponse:
    return read_kids_share(db, token)
