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