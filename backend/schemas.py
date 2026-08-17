import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=80)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(character.isalpha() for character in value) or not any(character.isdigit() for character in value):
            raise ValueError("비밀번호에는 영문과 숫자가 모두 포함되어야 합니다.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str
    created_at: datetime
    profile_completed: bool = False
    grade: Literal[1, 2, 3] | None = None


class StudentProfileUpdate(BaseModel):
    grade: Literal[1, 2, 3]
    graduation_year: int = Field(ge=2026, le=2040)
    school_type: str | None = Field(default=None, max_length=40)
    interests: list[str] = Field(default_factory=list, max_length=20)
    preferred_subjects: list[str] = Field(default_factory=list, max_length=20)
    career_goals: list[str] = Field(default_factory=list, max_length=20)
    preferred_regions: list[str] = Field(default_factory=list, max_length=20)
    admission_types: list[str] = Field(default_factory=list, max_length=20)
    survey_answers: dict[str, list[str]] = Field(default_factory=dict)

    @field_validator("interests", "preferred_subjects", "career_goals", "preferred_regions", "admission_types")
    @classmethod
    def clean_list(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(value.strip() for value in values if value.strip()))

    @field_validator("survey_answers")
    @classmethod
    def clean_survey_answers(cls, answers: dict[str, list[str]]) -> dict[str, list[str]]:
        if len(answers) > 20:
            raise ValueError("설문 문항은 최대 20개까지 저장할 수 있습니다.")
        return {
            key: list(dict.fromkeys(value.strip() for value in values if value.strip()))[:20]
            for key, values in answers.items()
            if key.strip()
        }


class StudentProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    grade: Literal[1, 2, 3] | None
    graduation_year: int | None
    school_type: str | None
    interests: list[str]
    preferred_subjects: list[str]
    career_goals: list[str]
    preferred_regions: list[str]
    admission_types: list[str]
    survey_answers: dict[str, list[str]]
    academic_record: dict
    record_processed_at: datetime | None
    updated_at: datetime


class KidsExperienceAnalyzeRequest(BaseModel):
    participant_name: str = Field(min_length=1, max_length=40)
    favorite_topics: list[str] = Field(min_length=3, max_length=5)
    favorite_activities: list[str] = Field(min_length=2, max_length=4)
    frequent_activities: list[str] = Field(min_length=1, max_length=3)
    comfort_style: str = Field(min_length=1, max_length=40)
    preferred_outcome_types: list[str] = Field(min_length=1, max_length=2)
    proud_moment_type: str = Field(min_length=1, max_length=80)
    free_text_note: str = Field(default="", max_length=120)
    personality_answers: dict[str, str] = Field(min_length=8, max_length=8)

    @field_validator("favorite_topics", "favorite_activities", "frequent_activities", "preferred_outcome_types")
    @classmethod
    def clean_string_list(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(value.strip() for value in values if value.strip()))

    @field_validator("comfort_style", "proud_moment_type")
    @classmethod
    def clean_string_value(cls, value: str) -> str:
        return value.strip()

    @field_validator("personality_answers")
    @classmethod
    def clean_personality_answers(cls, answers: dict[str, str]) -> dict[str, str]:
        return {
            key.strip(): value.strip()
            for key, value in answers.items()
            if key.strip() and value.strip()
        }


class KidsRecommendedJob(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    reason: str = Field(min_length=1, max_length=300)
    fit_comment: str = Field(min_length=1, max_length=220)
    tags: list[str] = Field(default_factory=list, max_length=5)
    school_hint: str = Field(min_length=1, max_length=200)
    home_mission: str = Field(min_length=1, max_length=200)
    friend_fit: str = Field(min_length=1, max_length=200)


class KidsQuickCounsel(BaseModel):
    why_this_fits: str = Field(min_length=1, max_length=400)
    strengths: str = Field(min_length=1, max_length=400)
    alternative_jobs: str = Field(min_length=1, max_length=400)


class KidsReportSections(BaseModel):
    one_line_summary: str = Field(min_length=1, max_length=400)
    profile_overview: str = Field(min_length=1, max_length=500)
    strengths_summary: str = Field(min_length=1, max_length=400)
    home_observation_points: list[str] = Field(default_factory=list, min_length=2, max_length=4)
    school_support_points: list[str] = Field(default_factory=list, min_length=2, max_length=4)
    parent_message: str = Field(min_length=1, max_length=400)
    next_talk_question: str = Field(min_length=1, max_length=400)
    hidden_potential_fields: list[str] = Field(default_factory=list, min_length=2, max_length=4)
    closing_message: str = Field(min_length=1, max_length=400)


class KidsExperienceAnalyzeResponse(BaseModel):
    participant_name: str
    personality_type: str
    personality_summary: str
    strength_keywords: list[str] = Field(default_factory=list, max_length=6)
    recommended_jobs: list[KidsRecommendedJob] = Field(default_factory=list, min_length=3, max_length=3)
    suggested_activities: list[str] = Field(default_factory=list, min_length=1, max_length=4)
    quick_counsel: KidsQuickCounsel
    report_sections: KidsReportSections
    fallback_used: bool = True


class KidsExperienceReportRequest(BaseModel):
    draft: KidsExperienceAnalyzeRequest
    result: KidsExperienceAnalyzeResponse
