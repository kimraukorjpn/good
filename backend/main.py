import os
from pathlib import Path
import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.routers.auth import router as auth_router
from backend.routers.profiles import router as profiles_router
from backend.routers.records import router as records_router
from backend.routers.reports import router as reports_router
from backend.models import User
from backend.security import get_current_user

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

APIM_BASE_URL = os.getenv("APIM_BASE_URL", "").rstrip("/")
APIM_KEY = os.getenv("APIM_KEY", "")
CHAT_MODEL = os.getenv("CHAT_MODEL", "")

app = FastAPI(title="길잡이 API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)
app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(records_router)
app.include_router(reports_router)


class AnalysisRequest(BaseModel):
    record_summary: str = Field(min_length=10, max_length=4000)


class AnalysisResponse(BaseModel):
    analysis: str
    model: str


def require_apim_settings() -> None:
    missing = [
        name
        for name, value in {
            "APIM_BASE_URL": APIM_BASE_URL,
            "APIM_KEY": APIM_KEY,
            "CHAT_MODEL": CHAT_MODEL,
        }.items()
        if not value
    ]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"서버 환경변수가 설정되지 않았습니다: {', '.join(missing)}",
        )


@app.get("/api/health")
async def health() -> dict[str, str | bool]:
    configured = bool(APIM_BASE_URL and APIM_KEY and CHAT_MODEL)
    return {
        "status": "ready" if configured else "configuration_required",
        "configured": configured,
        "model": CHAT_MODEL if configured else "",
    }


@app.post("/api/analysis", response_model=AnalysisResponse)
async def analyze_record(
    request: AnalysisRequest,
    user: User = Depends(get_current_user),
) -> AnalysisResponse:
    require_apim_settings()
    if not user.profile or not user.profile.grade:
        raise HTTPException(status_code=400, detail="학생 기본정보를 먼저 입력하세요.")
    grade = user.profile.grade
    grade_policy = {
        1: "관심과 가능성을 넓게 탐색하고 다음 활동을 제안",
        2: "활동의 반복성, 심화, 교과 연결성을 중심으로 진로를 구체화",
        3: "학업·진로 역량과 지원 서사를 중심으로 분석",
    }[grade]
    profile_context = {
        "관심 분야": user.profile.interests,
        "선호 과목": user.profile.preferred_subjects,
        "희망 진로": user.profile.career_goals,
        "성향 설문": user.profile.survey_answers,
    }
    payload = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "당신은 대한민국 고등학생의 진로 탐색을 돕는 분석가입니다. "
                    "입력에 없는 경험이나 성과를 만들지 말고, 근거가 부족하면 명시하세요. "
                    "합격 가능성을 단정하지 말고 3개의 짧은 문단으로 한국어로 답하세요."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"학년: 고등학교 {grade}학년\n"
                    f"분석 관점: {grade_policy}\n"
                    f"학생 기본정보와 성향: {profile_context}\n"
                    f"학생 기록 요약:\n{request.record_summary}\n\n"
                    "반복 관심 주제, 근거가 확인된 역량, 다음 탐색 방향을 분석하세요."
                ),
            },
        ],
        "max_completion_tokens": 700,
    }
    endpoint = f"{APIM_BASE_URL}/{CHAT_MODEL}/chat/completions"

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                endpoint,
                headers={"api-key": APIM_KEY, "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="AI 분석 서비스 호출에 실패했습니다. APIM 설정과 모델 경로를 확인하세요.",
        ) from error

    return AnalysisResponse(analysis=content, model=CHAT_MODEL)