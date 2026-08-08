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

INTEREST_PATHS = {
    "인공지능·데이터": ("인공지능학과", "데이터 분석가"),
    "컴퓨터·소프트웨어": ("컴퓨터공학과", "소프트웨어 개발자"),
    "수학·통계": ("통계학과", "통계 전문가"),
    "물리·공학": ("기계공학과", "기계공학 엔지니어"),
    "화학·신소재": ("신소재공학과", "신소재 연구원"),
    "생명·의학": ("생명과학과", "생명과학 연구원"),
    "환경·에너지": ("환경공학과", "환경·에너지 전문가"),
    "심리·상담": ("심리학과", "상담·심리 전문가"),
    "교육": ("교육학과", "교육 전문가"),
    "경제·경영": ("경영학과", "경영·기획자"),
    "법·정책": ("행정학과", "공공정책 전문가"),
    "사회·문화": ("사회학과", "사회조사 분석가"),
    "언어·문학": ("국어국문학과", "작가·콘텐츠 기획자"),
    "역사·철학": ("사학과", "문화유산 연구원"),
    "미디어·콘텐츠": ("미디어커뮤니케이션학과", "미디어 콘텐츠 기획자"),
    "디자인·예술": ("시각디자인학과", "시각 디자이너"),
    "건축·도시": ("건축학과", "건축·도시 전문가"),
    "스포츠·건강": ("스포츠과학과", "스포츠 전문가"),
}


def unique_strings(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value.strip() for value in values if isinstance(value, str) and value.strip()))


def compact_record(record: dict) -> dict:
    fields_with_items = ("awards", "creative_activities", "behavior_opinions", "semester_grades")
    return {
        "summary": str(record.get("summary", ""))[:2000],
        "subjects": record.get("subjects", [])[:20],
        "activities": record.get("activities", [])[:15],
        "competencies": record.get("competencies", [])[:10],
        **{field: record.get(field, [])[:15] for field in fields_with_items},
    }


def has_duplicated_recommendation_basis(report: dict) -> bool:
    careers = report.get("careers", [])
    majors = report.get("majors", [])
    career_rationales = {str(item.get("rationale", "")).strip() for item in careers if isinstance(item, dict)} - {""}
    major_rationales = {str(item.get("rationale", "")).strip() for item in majors if isinstance(item, dict)} - {""}
    career_evidence = {
        tuple(unique_strings(item.get("evidence", [])))
        for item in careers
        if isinstance(item, dict) and item.get("evidence")
    }
    major_evidence = {
        tuple(unique_strings(item.get("evidence", [])))
        for item in majors
        if isinstance(item, dict) and item.get("evidence")
    }
    return bool(career_rationales & major_rationales or career_evidence & major_evidence)


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
        "생기부 분석": compact_record(profile.academic_record or {}),
    }


def local_report(user: User) -> dict:
    profile = user.profile
    record = profile.academic_record or {}
    strengths = list(dict.fromkeys(record.get("competencies", [])))[:6]
    interests = profile.interests or profile.career_goals or ["관심 분야 탐색"]
    subjects = record.get("subjects", [])
    survey = profile.survey_answers or {}
    survey_work_signals = unique_strings(
        survey.get("problem_approach", [])
        + survey.get("team_role", [])
        + survey.get("preferred_output", [])
        + survey.get("activity_environment", [])
    )
    survey_value_signals = unique_strings(survey.get("values", []) + survey.get("learning_style", []))
    subject_evidence = [
        f"[생기부-교과] {item.get('subject', '교과')}: {item.get('details', '')}"
        for item in subjects
        if isinstance(item, dict) and item.get("details")
    ]
    activity_evidence = [f"[생기부-활동] {activity}" for activity in record.get("activities", []) if isinstance(activity, str) and activity.strip()]
    for item in record.get("creative_activities", []):
        if isinstance(item, dict) and item.get("details"):
            activity_evidence.append(f"[생기부-활동] {item.get('title') or '창의적 체험활동'}: {item['details']}")
    career_titles = unique_strings(profile.career_goals or [INTEREST_PATHS.get(interest, ("", interest))[1] for interest in interests])[:3]
    major_titles = unique_strings([INTEREST_PATHS[interest][0] for interest in interests if interest in INTEREST_PATHS])[:3]
    if not major_titles:
        major_titles = [f"{interest} 관련 학과" for interest in interests[:3]]
    careers = [
        {
            "title": goal,
            "category": "직무 적합성 탐색",
            "rationale": (
                f"{goal}의 실제 업무 방식이 설문에서 선택한 "
                f"{', '.join(survey_work_signals[:2]) or '문제 해결 방식'}과 맞는지 우선 확인할 직업 후보입니다. "
                + ("생기부 활동에서도 관련 탐구 경험이 확인됩니다." if activity_evidence else "현재 생기부 활동 근거는 부족하므로 직무 체험으로 적합성을 추가 확인해야 합니다.")
            ),
            "evidence": unique_strings(
                [f"[설문] 관심 직업 역할: {goal}"]
                + ([f"[설문] 선호하는 업무·결과물: {', '.join(survey_work_signals[:3])}"] if survey_work_signals else [])
                + activity_evidence[:1]
            ),
            "next_steps": ["직무 인터뷰와 전공 교육과정을 조사하세요.", "관련 교과에서 작은 탐구 결과물을 만드세요."],
        }
        for goal in career_titles
    ]
    majors = [
        {
            "title": major,
            "category": "교과·학업 적합성 탐색",
            "rationale": (
                f"{major}는 관심 분야를 학문적으로 탐색하면서 "
                f"{', '.join(profile.preferred_subjects[:2]) or '관련 기초 교과'}의 학업 기록을 심화할 전공 후보입니다. "
                + ("생기부 교과 기록을 바탕으로 교육과정 적합성을 비교할 수 있습니다." if subject_evidence else "현재 교과 세부 근거가 부족하므로 대학별 핵심 교과와 교육과정을 먼저 비교해야 합니다.")
            ),
            "evidence": unique_strings(
                [f"[설문] 관심 분야: {', '.join(interests[:3])}"]
                + ([f"[설문] 선호 교과: {', '.join(profile.preferred_subjects[:3])}"] if profile.preferred_subjects else [])
                + subject_evidence[:1]
                + ([f"[설문] 학습 방식·가치: {', '.join(survey_value_signals[:2])}"] if survey_value_signals else [])
            ),
            "next_steps": ["대학별 실제 개설 학과와 교육과정을 공식 입학처에서 확인하세요."],
        }
        for major in major_titles
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
    output_shape = {
        "overview": "학생 데이터에 근거한 전체 요약",
        "strengths": ["근거가 확인된 강점"],
        "careers": [{"title": "구체적인 직업명", "category": "직업 분야", "rationale": "직무 적합성 판단", "evidence": ["[설문] 또는 [생기부] 출처가 표시된 근거"], "next_steps": ["직업 탐색 행동"]}],
        "majors": [{"title": "실제 대학 전공·학과명", "category": "전공 계열", "rationale": "교과 및 학업 적합성 판단", "evidence": ["[설문] 또는 [생기부] 출처가 표시된 근거"], "next_steps": ["전공 탐색 행동"]}],
        "record_directions": [{"title": "생기부 보완 방향", "priority": "높음|보통|낮음", "rationale": "판단 근거", "actions": ["실행 방법"]}],
        "subject_strategies": [{"title": "교과명", "priority": "높음|보통|낮음", "rationale": "판단 근거", "actions": ["실행 방법"]}],
        "application_story": "학생 기록으로 구성한 지원 서사",
        "cautions": ["해석 시 주의점"],
    }
    student_context = json.dumps(build_context(user), ensure_ascii=False)
    payload = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "당신은 대한민국 고등학생의 설문과 학교생활기록부를 교차 분석하는 입시 컨설턴트입니다. "
                    "입력에 없는 활동·성취·적성을 만들지 말고, 근거가 부족하면 부족하다고 명시하세요. "
                    "추천 직업은 실제 업무·역할·업무 환경 적합성을, 추천 전공은 교육과정·핵심 교과·학업 준비도를 판단하세요. "
                    "직업과 전공의 rationale을 재사용하거나 evidence 목록을 동일하게 작성하지 마세요. "
                    "각 추천의 evidence에는 [설문], [생기부-교과], [생기부-활동] 중 실제 출처를 붙이고 입력의 구체 내용을 인용·요약하세요. "
                    "설문 선호만으로 생기부 역량이 확인됐다고 표현하지 마세요. 합격 가능성도 단정하지 마세요. "
                    "설명 문장 없이 지정된 JSON 객체만 한국어로 출력하세요."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"학년 전략: {GRADE_STRATEGIES[user.profile.grade]}\n"
                    "careers와 majors는 각각 최대 3개만 제안하세요. 각 항목은 서로 다른 학생 근거로 설명하고, "
                    "생기부가 있으면 최소 1개의 생기부 근거를 포함하세요. 관련 근거가 없는 추천은 만들지 마세요.\n"
                    f"출력 JSON 구조: {json.dumps(output_shape, ensure_ascii=False)}\n"
                    f"학생 입력 데이터: {student_context}"
                ),
            },
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
            AdmissionReportResponse(**result)
            if has_duplicated_recommendation_basis(result):
                result["careers"] = fallback["careers"]
                result["majors"] = fallback["majors"]
                result["generation_mode"] = "ai_with_grounded_recommendations"
                result.setdefault("cautions", []).append("중복된 AI 추천 근거를 제외하고 설문·생기부 기반 추천으로 교체했습니다.")
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