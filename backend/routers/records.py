import base64
import json
import os
import re
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import fitz
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from pypdf import PdfReader
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import StudentProfile, User
from backend.security import get_current_user

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

APIM_BASE_URL = os.getenv("APIM_BASE_URL", "").rstrip("/")
APIM_KEY = os.getenv("APIM_KEY", "")
CHAT_MODEL = os.getenv("CHAT_MODEL", "")
VISION_MODEL = os.getenv("VISION_MODEL", CHAT_MODEL)
MAX_FILE_SIZE = 15 * 1024 * 1024
ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "text/plain"}

router = APIRouter(prefix="/api/records", tags=["academic-record"])


class SubjectRecord(BaseModel):
    subject: str = Field(max_length=80)
    grade_or_achievement: str = Field(default="", max_length=120)
    details: str = Field(default="", max_length=1000)


class SchoolRecordItem(BaseModel):
    school_year: str = Field(default="", max_length=20)
    semester: str = Field(default="", max_length=20)
    title: str = Field(default="", max_length=150)
    value: str = Field(default="", max_length=200)
    details: str = Field(default="", max_length=1000)


class AcademicRecordResponse(BaseModel):
    summary: str = ""
    subjects: list[SubjectRecord] = Field(default_factory=list)
    activities: list[str] = Field(default_factory=list)
    competencies: list[str] = Field(default_factory=list)
    awards: list[SchoolRecordItem] = Field(default_factory=list)
    attendance: list[SchoolRecordItem] = Field(default_factory=list)
    certifications: list[SchoolRecordItem] = Field(default_factory=list)
    creative_activities: list[SchoolRecordItem] = Field(default_factory=list)
    behavior_opinions: list[SchoolRecordItem] = Field(default_factory=list)
    semester_grades: list[SchoolRecordItem] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    source_type: str = ""
    processed_at: datetime | None = None


def mask_personal_information(text: str, full_name: str) -> str:
    masked = text.replace(full_name, "[이름]") if full_name else text
    patterns = [
        (r"\b\d{6}-?[1-4]\d{6}\b", "[주민등록번호]"),
        (r"\b01[016789]-?\d{3,4}-?\d{4}\b", "[연락처]"),
        (r"[\w.+-]+@[\w-]+\.[\w.-]+", "[이메일]"),
        (r"\b\d{2,4}학년도?\s*\d{1,4}번\b", "[학번]"),
        (r"[가-힣A-Za-z0-9]+(?:고등학교|중학교)", "[학교명]"),
    ]
    for pattern, replacement in patterns:
        masked = re.sub(pattern, replacement, masked)
    return masked


def extract_pdf_text(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages).strip()


def pdf_to_images(content: bytes, max_pages: int = 8) -> list[bytes]:
    document = fitz.open(stream=content, filetype="pdf")
    images = []
    for page_number in range(min(document.page_count, max_pages)):
        page = document.load_page(page_number)
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
        images.append(pixmap.tobytes("jpeg"))
    document.close()
    return images


async def recognize_images(images: list[bytes]) -> str:
    if not APIM_BASE_URL or not APIM_KEY or not VISION_MODEL:
        raise HTTPException(status_code=503, detail="비전 OCR 환경변수가 설정되지 않았습니다.")
    content: list[dict] = [{"type": "text", "text": "이미지의 한국어 학교생활기록부 문자를 원문 순서대로 정확히 추출하세요. 설명은 하지 마세요."}]
    for image in images:
        encoded = base64.b64encode(image).decode()
        content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded}", "detail": "high"}})
    payload = {"messages": [{"role": "user", "content": content}], "max_completion_tokens": 5000}
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{APIM_BASE_URL}/{VISION_MODEL}/chat/completions",
                headers={"api-key": APIM_KEY, "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
        raise HTTPException(status_code=502, detail="이미지 OCR에 실패했습니다. 파일 상태와 비전 모델 연결을 확인하세요.") from error


def local_structure(text: str, source_type: str) -> dict:
    lines = [line.strip() for line in text.splitlines() if len(line.strip()) >= 4]
    subject_names = ["국어", "수학", "영어", "물리", "화학", "생명과학", "지구과학", "사회", "역사", "정보", "미술", "음악", "체육"]
    subjects = []
    for line in lines:
        matched = next((subject for subject in subject_names if subject in line), None)
        if matched and len(subjects) < 20:
            subjects.append({"subject": matched, "grade_or_achievement": "", "details": line[:700]})
    activity_keywords = ("동아리", "진로활동", "자율활동", "봉사", "독서", "탐구", "프로젝트")
    activities = [line[:500] for line in lines if any(keyword in line for keyword in activity_keywords)][:15]

    def matching_items(*keywords: str) -> list[dict]:
        return [
            {"school_year": "", "semester": "", "title": "", "value": "", "details": line[:1000]}
            for line in lines
            if any(keyword in line for keyword in keywords)
        ][:20]

    summary_source = subjects[:5] or [{"details": line} for line in lines[:5]]
    summary = " ".join(item["details"] for item in summary_source)[:1200]
    return {
        "summary": summary,
        "subjects": subjects,
        "activities": activities,
        "competencies": [],
        "awards": matching_items("수상", "표창", "상장"),
        "attendance": matching_items("출결", "결석", "지각", "조퇴", "수업일수"),
        "certifications": matching_items("자격증", "인증", "취득"),
        "creative_activities": matching_items("자율활동", "동아리활동", "봉사활동", "진로활동", "창의적 체험활동"),
        "behavior_opinions": matching_items("행동특성", "종합의견"),
        "semester_grades": matching_items("학기", "석차등급", "성취도", "원점수", "과목평균"),
        "warnings": ["자동 추출 결과입니다. 원문과 비교해 정확성을 확인하세요."],
        "source_type": source_type,
    }


async def structure_with_ai(text: str, source_type: str) -> dict:
    if not APIM_BASE_URL or not APIM_KEY or not CHAT_MODEL:
        return local_structure(text, source_type)
    schema = {
        "summary": "개인정보를 제외한 학업 및 활동 요약",
        "subjects": [{"subject": "과목명", "grade_or_achievement": "등급·성취도", "details": "세부능력 및 특기사항 요약"}],
        "activities": ["자율·동아리·진로·봉사·독서 활동 요약"],
        "competencies": ["근거가 명확한 역량"],
        "awards": [{"school_year": "학년도", "semester": "", "title": "수상명", "value": "등급·수상일·수여기관", "details": "수상 내용"}],
        "attendance": [{"school_year": "학년도", "semester": "", "title": "출결", "value": "수업일수·결석·지각·조퇴·결과", "details": "특기사항"}],
        "certifications": [{"school_year": "학년도", "semester": "", "title": "자격증·인증명", "value": "취득일·발급기관", "details": "관련 내용"}],
        "creative_activities": [{"school_year": "학년도", "semester": "", "title": "자율·동아리·봉사·진로 중 구분", "value": "시간", "details": "활동 내용"}],
        "behavior_opinions": [{"school_year": "학년도", "semester": "", "title": "행동특성 및 종합의견", "value": "", "details": "개인정보를 제외한 교사 의견"}],
        "semester_grades": [{"school_year": "학년도", "semester": "학기", "title": "과목명", "value": "원점수·과목평균·표준편차·성취도·수강자수·석차등급", "details": "비고"}],
        "warnings": ["확인이 필요한 내용"],
    }
    payload = {
        "messages": [
            {"role": "system", "content": "학교생활기록부를 사실만 사용해 JSON으로 구조화하세요. 이름, 학교, 학번, 연락처 등 개인정보는 출력하지 마세요."},
            {"role": "user", "content": f"다음 JSON 형식을 정확히 따르세요: {json.dumps(schema, ensure_ascii=False)}\n\n마스킹된 기록:\n{text[:30000]}"},
        ],
        "response_format": {"type": "json_object"},
        "max_completion_tokens": 3000,
    }
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                f"{APIM_BASE_URL}/{CHAT_MODEL}/chat/completions",
                headers={"api-key": APIM_KEY, "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            result = json.loads(response.json()["choices"][0]["message"]["content"])
            result["source_type"] = source_type
            return result
    except (httpx.HTTPError, json.JSONDecodeError, KeyError, IndexError, TypeError, ValueError):
        fallback = local_structure(text, source_type)
        fallback["warnings"].append("AI 정리에 연결하지 못해 기본 규칙으로 분류했습니다.")
        return fallback


@router.get("", response_model=AcademicRecordResponse)
def get_record(user: User = Depends(get_current_user)) -> dict:
    record = dict(user.profile.academic_record or {})
    record["processed_at"] = user.profile.record_processed_at
    return record


@router.post("/upload", response_model=AcademicRecordResponse)
async def upload_record(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="PDF, PNG, JPG 또는 TXT 파일만 업로드할 수 있습니다.")
    content = await file.read(MAX_FILE_SIZE + 1)
    await file.close()
    if not content or len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일은 15MB 이하여야 합니다.")

    if file.content_type == "application/pdf":
        text = extract_pdf_text(content)
        source_type = "pdf_text"
        if len(text) < 100:
            text = await recognize_images(pdf_to_images(content))
            source_type = "pdf_ocr"
    elif file.content_type in {"image/png", "image/jpeg"}:
        text = await recognize_images([content])
        source_type = "image_ocr"
    else:
        text = content.decode("utf-8", errors="replace")
        source_type = "text"

    masked_text = mask_personal_information(text, user.full_name)
    if len(masked_text.strip()) < 20:
        raise HTTPException(status_code=422, detail="분석할 수 있는 텍스트를 충분히 찾지 못했습니다.")
    result = await structure_with_ai(masked_text, source_type)
    validated = AcademicRecordResponse(**result)
    processed_at = datetime.now(timezone.utc)
    stored = validated.model_dump(exclude={"processed_at"}, mode="json")
    user.profile.academic_record = stored
    user.profile.record_processed_at = processed_at
    db.commit()
    stored["processed_at"] = processed_at
    return stored


@router.delete("", status_code=204)
def delete_record(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    user.profile.academic_record = {}
    user.profile.record_processed_at = None
    db.commit()