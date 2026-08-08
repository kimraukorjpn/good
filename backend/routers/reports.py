import json
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.security import get_current_user

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

APIM_BASE_URL = os.getenv("APIM_BASE_URL", "").rstrip("/")
APIM_KEY = os.getenv("APIM_KEY", "")
CHAT_MODEL = os.getenv("CHAT_MODEL", "")

router = APIRouter(prefix="/api/reports", tags=["admission-report"])


class Recommendation(BaseModel):
    title: str = Field(max_length=150)
    category: str = Field(default="", max_length=100)
    rationale: str = Field(default="", max_length=1000)
    evidence: list[str] = Field(default_factory=list, max_length=10)
    next_steps: list[str] = Field(default_factory=list, max_length=10)


class ActionItem(BaseModel):
    title: str = Field(max_length=150)
    priority: str = Field(default="보통", max_length=20)
    rationale: str = Field(default="", max_length=1000)
    actions: list[str] = Field(default_factory=list, max_length=10)


class AdmissionReportResponse(BaseModel):
    grade: int | None = None
    grade_strategy: str = ""
    overview: str = ""
    strengths: list[str] = Field(default_factory=list)
    careers: list[Recommendation] = Field(default_factory=list)
    majors: list[Recommendation] = Field(default_factory=list)
    record_directions: list[ActionItem] = Field(default_factory=list)
    subject_strategies: list[ActionItem] = Field(default_factory=list)
    application_story: str = ""
    cautions: list[str] = Field(default_factory=list)
    generation_mode: str = ""
    generated_at: datetime | None = None


GRADE_STRATEGIES = {
    1: "탐색형: 진로를 확정하지 않고 관심 계열을 넓히며 교과 기초와 활동 경험을 설계합니다.",
    2: "구체화형: 반복 관심사를 전공 후보로 좁히고 교과·세특·활동의 심화와 연결성을 강화합니다.",
    3: "지원전략형: 기존 기록의 근거를 지원 학과와 연결하고 남은 성적 관리와 지원 서사를 정리합니다.",
}


def build_context(user: User) -> dict:
    profile = user.profile
    return {
        "학년": profile.grade,
        "학교 유형": profile.school_type,
        "관심 분야": profile.interests,
        "선호 과목": profile.preferred_subjects,
        "희망 진로": profile.career_goals,
        "희망 지역": profile.preferred_regions,
        "관심 전형": profile.admission_types,
        "진로 설문": profile.survey_answers,
        "생기부 분석": profile.academic_record,
    }


def local_report(user: User) -> dict:
    profile = user.profile
    record = profile.academic_record or {}
    strengths = list(dict.fromkeys(record.get("competencies", [])))[:6]
    interests = profile.interests or profile.career_goals or ["관심 분야 탐색"]
    subjects = record.get("subjects", [])
    evidence = [item.get("details", "") for item in subjects if item.get("details")][:3]
    careers = [
        {
            "title": goal,
            "category": "희망 진로 기반",
            "rationale": f"입력한 관심 분야와 희망 진로에서 확인된 {goal} 방향을 우선 탐색할 수 있습니다.",
            "evidence": evidence or [f"프로필 관심 분야: {', '.join(interests[:3])}"],
            "next_steps": ["직무 인터뷰와 전공 교육과정을 조사하세요.", "관련 교과에서 작은 탐구 결과물을 만드세요."],
        }
        for goal in (profile.career_goals or interests)[:3]
    ]
    majors = [
        {
            "title": f"{interest} 관련 학과",
            "category": "전공 탐색 후보",
            "rationale": "현재 관심과 생기부 기록을 연결해 우선 탐색할 전공 후보입니다.",
            "evidence": evidence or [f"관심 분야: {interest}"],
            "next_steps": ["대학별 실제 개설 학과와 교육과정을 공식 입학처에서 확인하세요."],
        }
        for interest in interests[:3]
    ]
    subject_strategies = [
        {
            "title": item.get("subject", "교과 성적"),
            "priority": "높음" if item.get("subject") in profile.preferred_subjects else "보통",
            "rationale": item.get("details", "현재 성취도와 희망 전공의 연관성을 함께 확인해야 합니다."),
            "actions": ["최근 평가의 오답 유형을 분류하세요.", "다음 평가까지 주 단위 목표를 기록하세요."],
        }
        for item in subjects[:5]
    ]
    if not subject_strategies:
        subject_strategies = [{"title": subject, "priority": "높음", "rationale": "선호 과목으로 입력된 핵심 교과입니다.", "actions": ["현재 성취 수준을 입력하고 다음 학기 목표를 설정하세요."]} for subject in profile.preferred_subjects[:5]]
    return {
        "grade": profile.grade,
        "grade_strategy": GRADE_STRATEGIES[profile.grade],
        "overview": record.get("summary") or "입력된 프로필과 진로 설문을 바탕으로 탐색 방향을 정리했습니다. 생기부를 입력하면 근거가 강화됩니다.",
        "strengths": strengths,
        "careers": careers,
        "majors": majors,
        "record_directions": [{"title": "교과와 활동의 연결", "priority": "높음", "rationale": "관심 주제가 교과 세특과 창의적 체험활동에서 이어져야 합니다.", "actions": ["기존 활동에서 생긴 질문을 다음 교과 탐구로 확장하세요.", "활동 결과보다 탐구 과정과 배운 점을 정리하세요."]}],
        "subject_strategies": subject_strategies,
        "application_story": "관심 분야를 발견한 계기, 교과 탐구, 활동의 심화, 앞으로의 전공 탐색 순서로 자신의 성장 흐름을 정리하세요.",
        "cautions": ["이 결과는 합격 가능성을 보장하지 않습니다.", "대학·학과 및 전형 정보는 해당 연도 대학 공식 입학처 자료로 확인하세요.", "입력 기록에 없는 활동이나 성과를 만들지 마세요."],
        "generation_mode": "basic",
    }


async def generate_report(user: User) -> dict:
    fallback = local_report(user)
    if not APIM_BASE_URL or not APIM_KEY or not CHAT_MODEL:
        return fallback
    schema = AdmissionReportResponse(**fallback).model_dump(exclude={"generated_at"})
    payload = {
        "messages": [
            {"role": "system", "content": "당신은 대한민국 고등학생 입시 컨설턴트입니다. 제공된 사실만 사용하고 합격을 단정하지 마세요. 학년에 맞는 실행 가능한 한국어 컨설팅 레포트를 JSON으로 작성하세요."},
            {"role": "user", "content": f"학년 전략: {GRADE_STRATEGIES[user.profile.grade]}\nJSON 구조 예시: {json.dumps(schema, ensure_ascii=False)}\n학생 입력 데이터: {json.dumps(build_context(user), ensure_ascii=False)[:50000]}"},
        ],
        "response_format": {"type": "json_object"},
        "max_completion_tokens": 6000,
    }
    try:
        timeout = httpx.Timeout(12, connect=4)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{APIM_BASE_URL}/{CHAT_MODEL}/chat/completions", headers={"api-key": APIM_KEY, "Content-Type": "application/json"}, json=payload)
            response.raise_for_status()
            result = json.loads(response.json()["choices"][0]["message"]["content"])
            result.update({"grade": user.profile.grade, "grade_strategy": GRADE_STRATEGIES[user.profile.grade], "generation_mode": "ai"})
            return result
    except (httpx.HTTPError, json.JSONDecodeError, KeyError, IndexError, TypeError, ValueError):
        fallback["cautions"].append("AI 서비스 연결에 실패해 입력 정보 기반 기본 레포트를 생성했습니다.")
        return fallback


@router.get("", response_model=AdmissionReportResponse)
def get_report(user: User = Depends(get_current_user)) -> dict:
    report = dict(user.profile.admission_report or {})
    report["generated_at"] = user.profile.report_generated_at
    return report


@router.post("/generate", response_model=AdmissionReportResponse)
async def create_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    if not user.profile or not user.profile.grade:
        raise HTTPException(status_code=400, detail="학생 기본정보를 먼저 입력하세요.")
    if not user.profile.survey_answers and not user.profile.academic_record:
        raise HTTPException(status_code=400, detail="진로 설문 또는 생기부 분석을 먼저 완료하세요.")
    result = AdmissionReportResponse(**await generate_report(user))
    generated_at = datetime.now(timezone.utc)
    stored = result.model_dump(exclude={"generated_at"}, mode="json")
    user.profile.admission_report = stored
    user.profile.report_generated_at = generated_at
    db.commit()
    stored["generated_at"] = generated_at
    return stored