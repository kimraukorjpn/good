# Deployment Runbook

## 배포 목표

- 공개 주소: `https://good.youthai.site`
- Cloudflare Tunnel route: `good.youthai.site -> http://localhost:3000`
- 외부 공개: frontend only
- 내부 전용: backend, postgres

## 사전 준비

홈서버에 아래가 준비되어 있어야 합니다.

- Docker 와 Docker Compose
- Cloudflare Tunnel route `good.youthai.site -> http://localhost:3000`
- 이 저장소가 서버에 clone 되어 있는 작업 디렉토리

## 환경파일 만들기

서버 작업 디렉토리에서 예시 파일을 복사합니다.

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

그다음 `.env` 에 실제 값을 넣습니다.

- `APIM_BASE_URL`
- `APIM_KEY`
- `CHAT_MODEL`
- `DATABASE_URL`
- `COOKIE_SECURE=true`
- `CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://good.youthai.site`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

`frontend/.env` 는 기본값을 그대로 써도 됩니다.

```env
NEXT_PUBLIC_API_BASE_URL=/backend-api
INTERNAL_API_BASE_URL=http://backend:8000
```

## 최초 배포

### 1. 이미지 빌드와 컨테이너 실행

```bash
docker compose up -d --build
```

### 2. DB 마이그레이션 적용

```bash
docker compose exec backend alembic -c backend/alembic.ini upgrade head
```

### 3. 컨테이너 상태 확인

```bash
docker compose ps
```

기대 상태:

- `frontend` 가 `0.0.0.0:3000->3000/tcp` 로 표시
- `backend` 는 내부 네트워크에서만 실행
- `db` 는 외부 포트 없이 실행

## 업데이트 배포

GitHub 저장소에 수정이 생겼을 때는 아래 순서로 반영합니다.

### 프론트만 바뀐 경우

```bash
git pull
docker compose up -d --build frontend
```

### 백엔드만 바뀐 경우

```bash
git pull
docker compose up -d --build backend
```

### DB 스키마 변경이 포함된 경우

```bash
git pull
docker compose up -d --build backend db
docker compose exec backend alembic -c backend/alembic.ini upgrade head
```

### 어느 쪽이 바뀌었는지 헷갈릴 때

```bash
git pull
docker compose up -d --build
```

## 점검 항목

### 기본 점검

- `https://good.youthai.site` 접속
- 첫 화면 로딩
- 로그인/회원가입 동작
- 설문 입력 화면 로딩
- 기록/프로필 화면 로딩
- 목업데이터 흐름 정상 동작

### 상태 확인 명령

```bash
docker compose ps
docker compose logs backend --tail 100
docker compose logs frontend --tail 100
```

### 백엔드 헬스체크

```bash
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/api/health').read().decode())"
```

정상 예시:

- `configured: false` 이면 APIM 값이 아직 비어 있는 상태
- `configured: true` 이면 실제 APIM 설정까지 들어간 상태

## 문제 생길 때 먼저 볼 것

- `frontend/.env` 의 `INTERNAL_API_BASE_URL`
- `.env` 의 `CORS_ORIGINS`
- `.env` 의 `COOKIE_SECURE`
- Cloudflare Tunnel route 가 `localhost:3000` 으로 연결되어 있는지
- `docker compose ps` 에서 frontend 가 실제로 3000 포트에 바인딩됐는지

## 롤백 체크리스트

문제가 생기면 우선 아래 순서로 확인합니다.

1. 직전 커밋 해시 확인
2. 현재 변경이 frontend 전용인지 backend 전용인지 구분
3. 이전 정상 커밋으로 checkout 또는 reset 이 아니라 새 clone 디렉토리에서 재배포하는 방식 우선 검토
4. `docker compose up -d --build` 로 직전 정상 상태 재기동
5. `https://good.youthai.site` 재확인

홈서버 운영에서는 파괴적인 명령보다, 정상 커밋 기준으로 다시 빌드하는 쪽이 더 안전합니다.
