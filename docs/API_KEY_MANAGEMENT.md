# API 키 관리 가이드

이 프로젝트는 브라우저에서 실행되는 Next.js와 서버에서 실행되는 FastAPI 백엔드를 분리합니다. Azure APIM 공통 키는 반드시 FastAPI 백엔드에서만 사용해야 합니다.

## 환경 파일 구성

| 파일 | 용도 | Git 추적 |
| --- | --- | --- |
| `/.env` | Python 백엔드의 실제 키와 로컬 서비스 설정 | 제외 |
| `/.env.example` | 필요한 백엔드 변수의 이름과 예시 | 포함 |
| `/frontend/.env.local` | 프론트엔드의 로컬 공개 설정 | 제외 |
| `/frontend/.env.example` | 필요한 프론트엔드 변수의 예시 | 포함 |

새 환경에서는 다음과 같이 템플릿을 복사한 뒤 실제 값을 입력합니다.

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

## 키 입력 위치

백엔드 전용 APIM 설정은 루트 `.env`에 입력합니다.

```dotenv
APIM_BASE_URL=https://your-apim.azure-api.net/foundry
APIM_KEY=실제_APIM_키
CHAT_MODEL=사용할_채팅_모델
EMBEDDING_MODEL=사용할_임베딩_모델
VISION_MODEL=사용할_비전_모델
```

프론트엔드에는 브라우저에 공개되어도 되는 값만 입력합니다.

```dotenv
NEXT_PUBLIC_API_BASE_URL=/backend-api
```

Next.js에서 `NEXT_PUBLIC_`으로 시작하는 변수는 빌드 결과와 브라우저 개발자 도구에 노출됩니다. `APIM_KEY`에는 절대로 이 접두사를 사용하지 않습니다.

## 애플리케이션에서 읽는 방법

Python 백엔드는 환경변수에서 키를 읽고, 코드에 기본 비밀값을 넣지 않습니다.

```python
import os

apim_key = os.environ["APIM_KEY"]
```

Next.js는 공개 API 주소만 읽습니다.

```typescript
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
```

프론트엔드는 동일 출처의 `/backend-api`로 요청합니다. Next.js가 요청을 로컬 FastAPI의 `/api`로 전달하고, FastAPI가 서버 내부에서 APIM Foundry 프록시를 호출합니다. 브라우저에서 APIM을 직접 호출하지 않습니다.

## 로컬 실행

백엔드를 설치하고 실행합니다.

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

별도 터미널에서 프론트엔드를 실행합니다.

```bash
cd frontend
npm run dev
```

## 배포 환경

- Vercel에는 `NEXT_PUBLIC_API_BASE_URL`만 등록합니다.
- Cloud Run에는 Secret Manager를 연결해 백엔드 키를 주입합니다.
- 개발·스테이징·운영 환경별로 서로 다른 키를 사용합니다.
- 로그, 오류 메시지, 분석 결과에 키 또는 전체 요청 헤더를 남기지 않습니다.

## 키가 노출됐을 때

1. 해당 공급자 콘솔에서 키를 즉시 폐기합니다.
2. 새 키를 발급하고 로컬 및 배포 환경의 비밀값을 교체합니다.
3. Git 기록과 CI 로그 등 노출 범위를 확인합니다.
4. 사용량과 결제 내역에서 비정상 호출을 점검합니다.

이미 커밋된 키는 이후 `.gitignore`에 추가해도 Git 기록에서 사라지지 않습니다. 키를 먼저 폐기한 뒤 저장소 기록 정리 여부를 별도로 판단해야 합니다.