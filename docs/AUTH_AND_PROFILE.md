# 인증 및 학생 프로필

FastAPI가 회원 인증과 학생 프로필을 함께 관리하며, PostgreSQL에 사용자와 프로필, 로그인 세션을 저장합니다.

## 로컬 실행

```bash
docker compose up -d db
python -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/alembic -c backend/alembic.ini upgrade head
.venv/bin/python -m uvicorn backend.main:app --reload --port 8000
```

별도 터미널에서 프론트엔드를 실행합니다.

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000/signup`으로 접속해 계정을 만든 뒤 학생 프로필을 입력합니다.

## 데이터 모델

- `users`: 이메일, Argon2 비밀번호 해시, 이름, 활성 상태
- `student_profiles`: 학년, 졸업연도, 관심 분야, 선호 과목, 진로 목표, 지역과 전형 조건
- `student_profiles.survey_answers`: 관심사, 학습 방식, 문제 접근, 협업 역할, 가치관 등 복수 선택 답변
- `auth_sessions`: 해시된 세션 토큰, 사용자, 만료 시각

로그인 토큰 원문은 데이터베이스에 저장하지 않습니다. 브라우저에는 7일 동안 유효한 `HttpOnly`, `SameSite=Lax` 쿠키로 전달됩니다. 운영 HTTPS 환경에서는 `.env`의 `COOKIE_SECURE`를 `true`로 설정해야 합니다.

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `POST` | `/api/auth/register` | 계정과 빈 학생 프로필 생성 |
| `POST` | `/api/auth/login` | 로그인 세션 생성 |
| `POST` | `/api/auth/logout` | 현재 세션 삭제 |
| `GET` | `/api/auth/me` | 현재 사용자와 프로필 완료 여부 조회 |
| `GET` | `/api/profile` | 현재 학생 프로필 조회 |
| `PUT` | `/api/profile` | 현재 학생 프로필 저장 |

프론트엔드는 `/backend-api` 경로를 사용하고 Next.js가 이를 FastAPI의 `/api` 경로로 전달합니다.

## 대시보드 기본정보 설문

대시보드에서 학년·졸업연도·학교 유형과 다음 영역을 복수 선택으로 저장할 수 있습니다.

- 관심 분야와 선호 과목
- 문제 접근 방식과 학습 방식
- 협업할 때 맡는 역할
- 선호하는 결과물과 활동 환경
- 진로에서 중요하게 생각하는 가치
- 관심 직업 역할과 현재 필요한 진로 도움

설문 답변은 `survey_answers`에 영역별 배열로 저장됩니다. AI 분석 API는 요청한 사용자의 프로필을 서버에서 조회해 학년, 관심 분야, 선호 과목, 희망 진로와 설문 답변을 프롬프트에 자동으로 포함합니다.

## 마이그레이션

모델 변경 후 새로운 리비전을 생성하고 적용합니다.

```bash
.venv/bin/alembic -c backend/alembic.ini revision --autogenerate -m "변경 설명"
.venv/bin/alembic -c backend/alembic.ini upgrade head
```