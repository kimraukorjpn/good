from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.schemas import (
    KidsExperienceAnalyzeRequest,
    KidsExperienceAnalyzeResponse,
    KidsExperienceReportRequest,
)
from backend.services.kids_experience import maybe_generate_with_ai
from backend.services.kids_report import build_kids_report_pdf

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
