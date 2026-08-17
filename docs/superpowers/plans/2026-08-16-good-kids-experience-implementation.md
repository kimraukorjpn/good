# good Kids Experience Event Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a login-free elementary-school event mode to `good` that collects name, interests, activity preferences, and an 8-question personality check, then returns 3-5 career recommendations with printable two-page PDF output.

**Architecture:** Keep the existing authenticated high-school flow untouched and add an isolated `/kids` experience slice in the Next.js frontend plus a public `/api/kids-experience/*` API surface in FastAPI. Start with a stable fallback generator in backend code and leave a clean seam where APIM-backed AI generation can replace or augment the fallback later.

**Tech Stack:** Next.js 16 App Router, React 19, FastAPI, Pydantic, existing `httpx`/APIM integration patterns, server-side PDF generation in Python.

## Global Constraints

- Existing home screen remains the entry point, with a new `초등 진로 체험` card added to `/`.
- Kids experience runs without sign-up or login.
- Kids experience must be fully separated from high-school login, profile, survey, records, and reports flows.
- Input consists of name/nickname, favorite topics, favorite activity styles, 8 personality questions, and one optional free-text answer.
- Favorite topics must support 3-5 selections.
- Favorite activity styles must support 2-4 selections.
- Personality check must contain exactly 8 questions.
- Result must return 3-5 job/career recommendations.
- Result UI must include 3 button-based AI follow-up answers, not free chat.
- PDF report must be two pages or less and printable in the event booth.
- No transcript upload, grades, mock exams, university recommendations, or long free-chat in this mode.
- No personally sensitive data beyond the participant name/nickname should be collected.
- Error handling must allow fallback demo output when live generation fails.

---

## File Structure

### Frontend units

- `frontend/src/app/page.tsx`
  - Add the kids experience entry card.
- `frontend/src/app/kids/page.tsx`
  - Intro page with name input and start CTA.
- `frontend/src/app/kids/questions/page.tsx`
  - Topics, activity styles, free-text prompt, and 8-question personality flow.
- `frontend/src/app/kids/result/page.tsx`
  - Result screen with summary, strength chips, recommendation cards, and quick-counsel buttons.
- `frontend/src/app/kids/report/page.tsx`
  - Report download screen or redirect helper.
- `frontend/src/components/kids/`
  - Isolated kids UI components and lightweight session helpers.
- `frontend/src/lib/api.ts`
  - Extend with kids experience API helpers.

### Backend units

- `backend/routers/kids_experience.py`
  - Public analyze/report endpoints.
- `backend/schemas.py`
  - Pydantic request/response models for kids experience.
- `backend/services/kids_experience.py`
  - Fallback result builder and APIM orchestration.
- `backend/services/kids_report.py`
  - PDF report generator.
- `backend/tests/test_kids_experience.py`
  - Analyze endpoint and fallback tests.
- `backend/tests/test_kids_report.py`
  - PDF output tests.

## Task 1: Add the public kids entry card and intro route

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/kids/page.tsx`
- Create: `frontend/src/components/kids/kids-intro-form.tsx`
- Create: `frontend/src/components/kids/kids-session.ts`
- Test: `frontend/src/components/kids/__tests__/kids-entry.test.tsx`
- Test: `frontend/src/components/kids/__tests__/kids-intro-form.test.tsx`

**Interfaces:**
- Consumes: existing home page layout and `Link` usage
- Produces:
  - `type KidsDraft = { participantName: string; favoriteTopics: string[]; favoriteActivities: string[]; freeTextNote: string; personalityAnswers: Record<string, string>; }`
  - `readKidsDraft(): KidsDraft`
  - `writeKidsDraft(next: KidsDraft): void`
  - `clearKidsDraft(): void`

- [ ] **Step 1: Write the failing home entry-card test**

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

test("renders the kids experience entry card on the home page", () => {
  render(<HomePage />);

  expect(screen.getByText("초등 진로 체험")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "초등 진로 체험 시작하기" }),
  ).toHaveAttribute("href", "/kids");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --runInBand kids-entry.test.tsx`

Expected: FAIL because the kids entry card and link do not exist yet.

- [ ] **Step 3: Write the failing intro form test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KidsIntroForm } from "@/components/kids/kids-intro-form";

test("submits the participant name when the start button is clicked", async () => {
  const user = userEvent.setup();
  const onStart = vi.fn();

  render(<KidsIntroForm onStart={onStart} />);

  await user.type(screen.getByLabelText("이름 또는 별명"), "민지");
  await user.click(screen.getByRole("button", { name: "시작하기" }));

  expect(onStart).toHaveBeenCalledWith("민지");
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd frontend && npm test -- --runInBand kids-intro-form.test.tsx`

Expected: FAIL because the component does not exist yet.

- [ ] **Step 5: Write the minimal draft-session helper**

```ts
// frontend/src/components/kids/kids-session.ts
export type KidsDraft = {
  participantName: string;
  favoriteTopics: string[];
  favoriteActivities: string[];
  freeTextNote: string;
  personalityAnswers: Record<string, string>;
};

const STORAGE_KEY = "kids-experience-draft";

const EMPTY_DRAFT: KidsDraft = {
  participantName: "",
  favoriteTopics: [],
  favoriteActivities: [],
  freeTextNote: "",
  personalityAnswers: {},
};

export function readKidsDraft(): KidsDraft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  return raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : EMPTY_DRAFT;
}

export function writeKidsDraft(next: KidsDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearKidsDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 6: Implement the minimal intro screen**

```tsx
// frontend/src/components/kids/kids-intro-form.tsx
"use client";

import { useState } from "react";

export function KidsIntroForm({
  onStart,
}: {
  onStart: (participantName: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        onStart(name.trim());
      }}
    >
      <label htmlFor="kids-name">이름 또는 별명</label>
      <input
        id="kids-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button type="submit">시작하기</button>
    </form>
  );
}
```

```tsx
// frontend/src/app/kids/page.tsx
import { KidsIntroForm } from "@/components/kids/kids-intro-form";

export default function KidsPage() {
  return (
    <main>
      <h1>나에게 어울리는 미래 직업을 찾아볼까?</h1>
      <p>좋아하는 것과 나의 스타일을 고르면 미래 직업을 추천해줄게!</p>
      <KidsIntroForm onStart={() => {}} />
    </main>
  );
}
```

```tsx
// frontend/src/app/page.tsx addition sketch
<Link href="/kids" aria-label="초등 진로 체험 시작하기">
  초등 진로 체험
</Link>
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd frontend && npm test -- --runInBand kids-entry.test.tsx kids-intro-form.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/page.tsx frontend/src/app/kids/page.tsx frontend/src/components/kids/kids-intro-form.tsx frontend/src/components/kids/kids-session.ts frontend/src/components/kids/__tests__/kids-entry.test.tsx frontend/src/components/kids/__tests__/kids-intro-form.test.tsx
git commit -m "feat: add kids experience entry and intro route"
```

### Task 2: Build the topics, activities, free-text, and 8-question flow

**Files:**
- Create: `frontend/src/app/kids/questions/page.tsx`
- Create: `frontend/src/components/kids/kids-question-bank.ts`
- Create: `frontend/src/components/kids/kids-question-flow.tsx`
- Create: `frontend/src/components/kids/kids-choice-chip.tsx`
- Modify: `frontend/src/components/kids/kids-session.ts`
- Test: `frontend/src/components/kids/__tests__/kids-question-flow.test.tsx`
- Test: `frontend/src/components/kids/__tests__/kids-personality-progress.test.tsx`

**Interfaces:**
- Consumes:
  - `readKidsDraft(): KidsDraft`
  - `writeKidsDraft(next: KidsDraft): void`
- Produces:
  - `KIDS_TOPIC_OPTIONS`
  - `KIDS_ACTIVITY_OPTIONS`
  - `KIDS_PERSONALITY_QUESTIONS`

- [ ] **Step 1: Write the failing selection-limit test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KidsQuestionFlow } from "@/components/kids/kids-question-flow";

test("requires at least three topics and two activities before continuing", async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();

  render(<KidsQuestionFlow onComplete={onComplete} />);

  await user.click(screen.getByRole("button", { name: "동물" }));
  await user.click(screen.getByRole("button", { name: "우주" }));
  await user.click(screen.getByRole("button", { name: "다음" }));

  expect(screen.getByText("좋아하는 주제를 3개 이상 골라줘!")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --runInBand kids-question-flow.test.tsx`

Expected: FAIL because the flow component does not exist yet.

- [ ] **Step 3: Write the failing 8-question progress test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KidsQuestionFlow } from "@/components/kids/kids-question-flow";

test("shows 1 / 8 when the personality section starts", async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();

  render(<KidsQuestionFlow onComplete={onComplete} />);

  for (const label of ["동물", "우주", "로봇"]) {
    await user.click(screen.getByRole("button", { name: label }));
  }
  for (const label of ["만들기", "관찰하기"]) {
    await user.click(screen.getByRole("button", { name: label }));
  }
  await user.click(screen.getByRole("button", { name: "다음" }));

  expect(screen.getByText("1 / 8")).toBeInTheDocument();
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd frontend && npm test -- --runInBand kids-personality-progress.test.tsx`

Expected: FAIL because the personality sequence does not exist yet.

- [ ] **Step 5: Define the question bank**

```ts
// frontend/src/components/kids/kids-question-bank.ts
export const KIDS_TOPIC_OPTIONS = [
  "동물",
  "우주",
  "공룡",
  "로봇",
  "발명",
  "그림",
  "음악",
  "운동",
  "요리",
  "자연",
  "게임/컴퓨터",
  "사람 돕기",
  "이야기 만들기",
  "실험하기",
] as const;

export const KIDS_ACTIVITY_OPTIONS = [
  "만들기",
  "관찰하기",
  "발표하기",
  "친구와 함께하기",
  "문제 풀기",
  "상상하기",
  "몸으로 움직이기",
  "꾸미기",
  "설명하기",
  "도와주기",
] as const;

export const KIDS_PERSONALITY_QUESTIONS = [
  {
    code: "KQ1",
    prompt: "어떤 시간이 더 좋아?",
    choices: [
      { code: "solo", label: "혼자 차분히 하는 시간" },
      { code: "team", label: "친구와 함께하는 시간" },
    ],
  },
  // KQ2 ~ KQ8 from the approved spec
] as const;
```

- [ ] **Step 6: Implement the minimal flow**

```tsx
// frontend/src/components/kids/kids-question-flow.tsx
"use client";

import { useState } from "react";
import {
  KIDS_ACTIVITY_OPTIONS,
  KIDS_PERSONALITY_QUESTIONS,
  KIDS_TOPIC_OPTIONS,
} from "@/components/kids/kids-question-bank";

export function KidsQuestionFlow({
  onComplete,
}: {
  onComplete: (payload: {
    favoriteTopics: string[];
    favoriteActivities: string[];
    freeTextNote: string;
    personalityAnswers: Record<string, string>;
  }) => void;
}) {
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  const [favoriteActivities, setFavoriteActivities] = useState<string[]>([]);
  const [freeTextNote, setFreeTextNote] = useState("");
  const [error, setError] = useState("");
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, string>>({});

  if (questionIndex === null) {
    return (
      <div>
        <button
          onClick={() => {
            if (favoriteTopics.length < 3) {
              setError("좋아하는 주제를 3개 이상 골라줘!");
              return;
            }
            if (favoriteActivities.length < 2) {
              setError("좋아하는 활동을 2개 이상 골라줘!");
              return;
            }
            setError("");
            setQuestionIndex(0);
          }}
        >
          다음
        </button>
        {error ? <p>{error}</p> : null}
      </div>
    );
  }

  const question = KIDS_PERSONALITY_QUESTIONS[questionIndex];

  return (
    <div>
      <p>{questionIndex + 1} / 8</p>
      <p>{question.prompt}</p>
      {question.choices.map((choice) => (
        <button
          key={choice.code}
          onClick={() => {
            const next = { ...personalityAnswers, [question.code]: choice.code };
            if (questionIndex === 7) {
              onComplete({
                favoriteTopics,
                favoriteActivities,
                freeTextNote,
                personalityAnswers: next,
              });
            } else {
              setPersonalityAnswers(next);
              setQuestionIndex(questionIndex + 1);
            }
          }}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd frontend && npm test -- --runInBand kids-question-flow.test.tsx kids-personality-progress.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/kids/questions/page.tsx frontend/src/components/kids/kids-question-bank.ts frontend/src/components/kids/kids-question-flow.tsx frontend/src/components/kids/kids-choice-chip.tsx frontend/src/components/kids/kids-session.ts frontend/src/components/kids/__tests__/kids-question-flow.test.tsx frontend/src/components/kids/__tests__/kids-personality-progress.test.tsx
git commit -m "feat: add kids interests and personality flow"
```

### Task 3: Add the public FastAPI kids-experience analyze API with fallback output

**Files:**
- Create: `backend/routers/kids_experience.py`
- Create: `backend/services/kids_experience.py`
- Modify: `backend/main.py`
- Modify: `backend/schemas.py`
- Test: `backend/tests/test_kids_experience.py`

**Interfaces:**
- Consumes: public JSON payload from frontend
- Produces:
  - `POST /api/kids-experience/analyze`
  - `KidsExperienceAnalyzeRequest`
  - `KidsExperienceAnalyzeResponse`

- [ ] **Step 1: Write the failing API contract test**

```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_kids_experience_analyze_returns_three_recommendations():
    response = client.post(
        "/api/kids-experience/analyze",
        json={
            "participant_name": "민지",
            "favorite_topics": ["동물", "우주", "로봇"],
            "favorite_activities": ["만들기", "관찰하기"],
            "free_text_note": "레고 만들기",
            "personality_answers": {
                "KQ1": "solo",
                "KQ2": "try-first",
                "KQ3": "make",
                "KQ4": "observe",
                "KQ5": "plan",
                "KQ6": "solve",
                "KQ7": "new",
                "KQ8": "careful",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["participant_name"] == "민지"
    assert 3 <= len(body["recommended_jobs"]) <= 5
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ../.venv/bin/python -m pytest tests/test_kids_experience.py -q`

Expected: FAIL because the router and schema do not exist yet.

- [ ] **Step 3: Add the request/response schema types**

```python
# backend/schemas.py
class KidsExperienceAnalyzeRequest(BaseModel):
    participant_name: str = Field(min_length=1, max_length=40)
    favorite_topics: list[str] = Field(min_length=3, max_length=5)
    favorite_activities: list[str] = Field(min_length=2, max_length=4)
    free_text_note: str = Field(default="", max_length=200)
    personality_answers: dict[str, str] = Field(min_length=8, max_length=8)


class KidsRecommendedJob(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    reason: str = Field(min_length=1, max_length=300)
    tags: list[str] = Field(min_length=2, max_length=3)


class KidsQuickCounsel(BaseModel):
    why_this_fits: str
    strengths: str
    alternative_jobs: str


class KidsExperienceAnalyzeResponse(BaseModel):
    participant_name: str
    personality_type: str
    personality_summary: str
    strength_keywords: list[str] = Field(min_length=3, max_length=5)
    recommended_jobs: list[KidsRecommendedJob] = Field(min_length=3, max_length=5)
    suggested_activities: list[str] = Field(min_length=3, max_length=5)
    quick_counsel: KidsQuickCounsel
    fallback_used: bool = True
```

- [ ] **Step 4: Implement the minimal fallback builder and router**

```python
# backend/services/kids_experience.py
from backend.schemas import (
    KidsExperienceAnalyzeRequest,
    KidsExperienceAnalyzeResponse,
    KidsQuickCounsel,
    KidsRecommendedJob,
)


def build_kids_experience_result(
    request: KidsExperienceAnalyzeRequest,
) -> KidsExperienceAnalyzeResponse:
    return KidsExperienceAnalyzeResponse(
        participant_name=request.participant_name,
        personality_type="호기심 탐험가",
        personality_summary="새로운 것을 궁금해하고 직접 해보며 배우는 걸 좋아하는 스타일이에요.",
        strength_keywords=["호기심", "관찰력", "도전정신"],
        recommended_jobs=[
            KidsRecommendedJob(
                title="동물 수의사",
                reason="동물을 좋아하고 자세히 살펴보는 힘이 보여요.",
                tags=["동물", "관찰하기"],
            ),
            KidsRecommendedJob(
                title="로봇 발명가",
                reason="직접 만들고 실험하는 걸 좋아해서 잘 어울려요.",
                tags=["로봇", "만들기"],
            ),
            KidsRecommendedJob(
                title="우주 과학자",
                reason="우주를 좋아하고 궁금한 걸 끝까지 파고드는 모습이 보여요.",
                tags=["우주", "호기심"],
            ),
        ],
        suggested_activities=["동물 도감 만들기", "레고 로봇 만들기", "우주 그림일기 쓰기"],
        quick_counsel=KidsQuickCounsel(
            why_this_fits="좋아하는 주제와 활동이 추천 직업들과 자연스럽게 이어져요.",
            strengths="새로운 것을 궁금해하고 직접 해보는 힘이 커요.",
            alternative_jobs="비슷한 직업으로 해양 연구원, 생태 해설가, 게임 디자이너도 있어요.",
        ),
        fallback_used=True,
    )
```

```python
# backend/routers/kids_experience.py
from fastapi import APIRouter
from backend.schemas import KidsExperienceAnalyzeRequest, KidsExperienceAnalyzeResponse
from backend.services.kids_experience import build_kids_experience_result

router = APIRouter(prefix="/api/kids-experience", tags=["kids-experience"])


@router.post("/analyze", response_model=KidsExperienceAnalyzeResponse)
def analyze_kids_experience(
    payload: KidsExperienceAnalyzeRequest,
) -> KidsExperienceAnalyzeResponse:
    return build_kids_experience_result(payload)
```

```python
# backend/main.py addition sketch
from backend.routers.kids_experience import router as kids_experience_router
app.include_router(kids_experience_router)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && ../.venv/bin/python -m pytest tests/test_kids_experience.py -q`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/main.py backend/routers/kids_experience.py backend/services/kids_experience.py backend/schemas.py backend/tests/test_kids_experience.py
git commit -m "feat: add kids experience analyze API with fallback output"
```

### Task 4: Connect the frontend question flow to the public analyze endpoint

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/app/kids/result/page.tsx`
- Create: `frontend/src/components/kids/kids-result-view.tsx`
- Create: `frontend/src/components/kids/kids-job-card.tsx`
- Create: `frontend/src/components/kids/kids-quick-counsel.tsx`
- Test: `frontend/src/components/kids/__tests__/kids-result-view.test.tsx`
- Test: `frontend/src/components/kids/__tests__/kids-quick-counsel.test.tsx`

**Interfaces:**
- Consumes:
  - `POST /api/kids-experience/analyze`
- Produces:
  - `submitKidsExperience(payload)`
  - `KidsResultView`

- [ ] **Step 1: Write the failing result rendering test**

```tsx
import { render, screen } from "@testing-library/react";
import { KidsResultView } from "@/components/kids/kids-result-view";

test("renders the personality summary and three recommendation cards", () => {
  render(
    <KidsResultView
      result={{
        participant_name: "민지",
        personality_type: "호기심 탐험가",
        personality_summary: "새로운 것을 궁금해하고 직접 해보며 배우는 걸 좋아하는 스타일이에요.",
        strength_keywords: ["호기심", "관찰력", "도전정신"],
        recommended_jobs: [
          { title: "동물 수의사", reason: "동물을 좋아하고 자세히 살펴보는 힘이 보여요.", tags: ["동물", "관찰하기"] },
          { title: "로봇 발명가", reason: "직접 만들고 실험하는 걸 좋아해서 잘 어울려요.", tags: ["로봇", "만들기"] },
          { title: "우주 과학자", reason: "우주를 좋아하고 궁금한 걸 끝까지 파고드는 모습이 보여요.", tags: ["우주", "호기심"] },
        ],
        suggested_activities: ["동물 도감 만들기", "레고 로봇 만들기", "우주 그림일기 쓰기"],
        quick_counsel: {
          why_this_fits: "좋아하는 주제와 활동이 추천 직업들과 자연스럽게 이어져요.",
          strengths: "새로운 것을 궁금해하고 직접 해보는 힘이 커요.",
          alternative_jobs: "비슷한 직업으로 해양 연구원, 생태 해설가, 게임 디자이너도 있어요.",
        },
        fallback_used: true,
      }}
    />,
  );

  expect(screen.getByText("호기심 탐험가")).toBeInTheDocument();
  expect(screen.getByText("동물 수의사")).toBeInTheDocument();
  expect(screen.getByText("로봇 발명가")).toBeInTheDocument();
  expect(screen.getByText("우주 과학자")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --runInBand kids-result-view.test.tsx`

Expected: FAIL because the result components do not exist yet.

- [ ] **Step 3: Write the failing quick-counsel interaction test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KidsQuickCounsel } from "@/components/kids/kids-quick-counsel";

test("reveals the selected quick counsel answer", async () => {
  const user = userEvent.setup();

  render(
    <KidsQuickCounsel
      quickCounsel={{
        why_this_fits: "좋아하는 주제와 활동이 추천 직업들과 자연스럽게 이어져요.",
        strengths: "새로운 것을 궁금해하고 직접 해보는 힘이 커요.",
        alternative_jobs: "비슷한 직업으로 해양 연구원, 생태 해설가, 게임 디자이너도 있어요.",
      }}
    />,
  );

  await user.click(screen.getByRole("button", { name: "왜 이 직업이 어울려?" }));

  expect(
    screen.getByText("좋아하는 주제와 활동이 추천 직업들과 자연스럽게 이어져요."),
  ).toBeInTheDocument();
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd frontend && npm test -- --runInBand kids-quick-counsel.test.tsx`

Expected: FAIL because the component does not exist yet.

- [ ] **Step 5: Extend the shared API client**

```ts
// frontend/src/lib/api.ts addition sketch
export type KidsExperienceAnalyzeRequest = {
  participant_name: string;
  favorite_topics: string[];
  favorite_activities: string[];
  free_text_note: string;
  personality_answers: Record<string, string>;
};

export type KidsExperienceAnalyzeResponse = {
  participant_name: string;
  personality_type: string;
  personality_summary: string;
  strength_keywords: string[];
  recommended_jobs: { title: string; reason: string; tags: string[] }[];
  suggested_activities: string[];
  quick_counsel: {
    why_this_fits: string;
    strengths: string;
    alternative_jobs: string;
  };
  fallback_used: boolean;
};

export async function submitKidsExperience(
  payload: KidsExperienceAnalyzeRequest,
): Promise<KidsExperienceAnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/kids-experience/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("kids_experience_failed");
  return response.json();
}
```

- [ ] **Step 6: Implement the minimal result screen**

```tsx
// frontend/src/components/kids/kids-quick-counsel.tsx
"use client";

import { useState } from "react";

type CounselKey = "why_this_fits" | "strengths" | "alternative_jobs";

export function KidsQuickCounsel({
  quickCounsel,
}: {
  quickCounsel: Record<CounselKey, string>;
}) {
  const [active, setActive] = useState<CounselKey | null>(null);

  return (
    <section>
      <button onClick={() => setActive("why_this_fits")}>왜 이 직업이 어울려?</button>
      <button onClick={() => setActive("strengths")}>내가 잘하는 점은 뭐야?</button>
      <button onClick={() => setActive("alternative_jobs")}>비슷한 다른 직업도 알려줘</button>
      {active ? <p>{quickCounsel[active]}</p> : null}
    </section>
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd frontend && npm test -- --runInBand kids-result-view.test.tsx kids-quick-counsel.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/app/kids/result/page.tsx frontend/src/components/kids/kids-result-view.tsx frontend/src/components/kids/kids-job-card.tsx frontend/src/components/kids/kids-quick-counsel.tsx frontend/src/components/kids/__tests__/kids-result-view.test.tsx frontend/src/components/kids/__tests__/kids-quick-counsel.test.tsx
git commit -m "feat: add kids experience result screen"
```

### Task 5: Add a server-side PDF report endpoint and download UI

**Files:**
- Create: `backend/services/kids_report.py`
- Modify: `backend/routers/kids_experience.py`
- Test: `backend/tests/test_kids_report.py`
- Create: `frontend/src/app/kids/report/page.tsx`
- Create: `frontend/src/components/kids/kids-report-download.tsx`
- Modify: `frontend/src/lib/api.ts`
- Test: `frontend/src/components/kids/__tests__/kids-report-download.test.tsx`

**Interfaces:**
- Consumes:
  - `KidsExperienceAnalyzeResponse`
- Produces:
  - `POST /api/kids-experience/report`
  - `downloadKidsExperienceReport(payload): Promise<Blob>`

- [ ] **Step 1: Write the failing backend PDF test**

```python
from backend.services.kids_report import render_kids_report_pdf

def test_render_kids_report_pdf_returns_pdf_bytes():
    pdf_bytes = render_kids_report_pdf(
        {
            "participant_name": "민지",
            "personality_type": "호기심 탐험가",
            "personality_summary": "새로운 것을 궁금해하고 직접 해보며 배우는 걸 좋아하는 스타일이에요.",
            "strength_keywords": ["호기심", "관찰력", "도전정신"],
            "recommended_jobs": [
                {"title": "동물 수의사", "reason": "동물을 좋아하고 자세히 살펴보는 힘이 보여요.", "tags": ["동물", "관찰하기"]},
                {"title": "로봇 발명가", "reason": "직접 만들고 실험하는 걸 좋아해서 잘 어울려요.", "tags": ["로봇", "만들기"]},
                {"title": "우주 과학자", "reason": "우주를 좋아하고 궁금한 걸 끝까지 파고드는 모습이 보여요.", "tags": ["우주", "호기심"]},
            ],
            "suggested_activities": ["동물 도감 만들기", "레고 로봇 만들기", "우주 그림일기 쓰기"],
            "quick_counsel": {
                "why_this_fits": "좋아하는 주제와 활동이 추천 직업들과 자연스럽게 이어져요.",
                "strengths": "새로운 것을 궁금해하고 직접 해보는 힘이 커요.",
                "alternative_jobs": "비슷한 직업으로 해양 연구원, 생태 해설가, 게임 디자이너도 있어요.",
            },
            "fallback_used": True,
        }
    )

    assert pdf_bytes.startswith(b"%PDF")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ../.venv/bin/python -m pytest tests/test_kids_report.py -q`

Expected: FAIL because the PDF renderer does not exist yet.

- [ ] **Step 3: Implement the minimal PDF renderer and route**

```python
# backend/services/kids_report.py
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

def render_kids_report_pdf(result: dict) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.drawString(72, 800, f"{result['participant_name']}의 미래 직업 탐험 리포트")
    pdf.drawString(72, 770, result["personality_type"])
    pdf.drawString(72, 750, result["personality_summary"])
    pdf.showPage()
    pdf.drawString(72, 800, "추천 직업과 해보면 좋은 활동")
    pdf.save()
    return buffer.getvalue()
```

```python
# backend/routers/kids_experience.py addition sketch
from fastapi import Response
from backend.services.kids_report import render_kids_report_pdf

@router.post("/report")
def create_kids_report(
    payload: KidsExperienceAnalyzeResponse,
) -> Response:
    pdf_bytes = render_kids_report_pdf(payload.model_dump())
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="kids-report.pdf"',
        },
    )
```

- [ ] **Step 4: Write the failing frontend download test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KidsReportDownload } from "@/components/kids/kids-report-download";

test("calls the download action when the PDF button is clicked", async () => {
  const user = userEvent.setup();
  const onDownload = vi.fn();

  render(<KidsReportDownload onDownload={onDownload} />);

  await user.click(screen.getByRole("button", { name: "PDF로 저장하기" }));

  expect(onDownload).toHaveBeenCalled();
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd frontend && npm test -- --runInBand kids-report-download.test.tsx`

Expected: FAIL because the component does not exist yet.

- [ ] **Step 6: Implement the minimal download helper**

```ts
// frontend/src/lib/api.ts addition sketch
export async function downloadKidsExperienceReport(
  payload: KidsExperienceAnalyzeResponse,
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/kids-experience/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("kids_report_failed");
  return response.blob();
}
```

```tsx
// frontend/src/components/kids/kids-report-download.tsx
"use client";

export function KidsReportDownload({
  onDownload,
}: {
  onDownload: () => Promise<void> | void;
}) {
  return <button onClick={() => void onDownload()}>PDF로 저장하기</button>;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd backend && ../.venv/bin/python -m pytest tests/test_kids_report.py -q && cd ../frontend && npm test -- --runInBand kids-report-download.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/services/kids_report.py backend/routers/kids_experience.py backend/tests/test_kids_report.py frontend/src/app/kids/report/page.tsx frontend/src/components/kids/kids-report-download.tsx frontend/src/lib/api.ts frontend/src/components/kids/__tests__/kids-report-download.test.tsx
git commit -m "feat: add kids experience pdf report flow"
```

### Task 6: Add fallback messaging, route integration, and targeted regression verification

**Files:**
- Modify: `frontend/src/components/kids/kids-result-view.tsx`
- Modify: `frontend/src/app/kids/result/page.tsx`
- Modify: `backend/services/kids_experience.py`
- Test: `frontend/src/components/kids/__tests__/kids-fallback-banner.test.tsx`
- Test: `backend/tests/test_kids_experience.py`

**Interfaces:**
- Consumes:
  - `fallback_used: boolean`
- Produces:
  - Fallback banner copy
  - Stable end-to-end flow checks

- [ ] **Step 1: Write the failing fallback banner test**

```tsx
import { render, screen } from "@testing-library/react";
import { KidsResultView } from "@/components/kids/kids-result-view";

test("shows the demo fallback banner when fallback_used is true", () => {
  render(
    <KidsResultView
      result={{
        participant_name: "민지",
        personality_type: "호기심 탐험가",
        personality_summary: "새로운 것을 궁금해하고 직접 해보며 배우는 걸 좋아하는 스타일이에요.",
        strength_keywords: ["호기심", "관찰력", "도전정신"],
        recommended_jobs: [
          { title: "동물 수의사", reason: "동물을 좋아하고 자세히 살펴보는 힘이 보여요.", tags: ["동물", "관찰하기"] },
          { title: "로봇 발명가", reason: "직접 만들고 실험하는 걸 좋아해서 잘 어울려요.", tags: ["로봇", "만들기"] },
          { title: "우주 과학자", reason: "우주를 좋아하고 궁금한 걸 끝까지 파고드는 모습이 보여요.", tags: ["우주", "호기심"] },
        ],
        suggested_activities: ["동물 도감 만들기", "레고 로봇 만들기", "우주 그림일기 쓰기"],
        quick_counsel: {
          why_this_fits: "좋아하는 주제와 활동이 추천 직업들과 자연스럽게 이어져요.",
          strengths: "새로운 것을 궁금해하고 직접 해보는 힘이 커요.",
          alternative_jobs: "비슷한 직업으로 해양 연구원, 생태 해설가, 게임 디자이너도 있어요.",
        },
        fallback_used: true,
      }}
    />,
  );

  expect(screen.getByText("지금은 체험용 예시 결과를 보여주고 있어요.")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --runInBand kids-fallback-banner.test.tsx`

Expected: FAIL because the banner is not rendered yet.

- [ ] **Step 3: Add the minimal fallback banner**

```tsx
// kids-result-view.tsx addition sketch
{result.fallback_used ? (
  <p>지금은 체험용 예시 결과를 보여주고 있어요.</p>
) : null}
```

- [ ] **Step 4: Run targeted regression verification**

Run:

```bash
cd backend && ../.venv/bin/python -m pytest tests/test_kids_experience.py tests/test_kids_report.py -q
cd ../frontend && npm test -- --runInBand kids-entry.test.tsx kids-intro-form.test.tsx kids-question-flow.test.tsx kids-personality-progress.test.tsx kids-result-view.test.tsx kids-quick-counsel.test.tsx kids-report-download.test.tsx kids-fallback-banner.test.tsx
```

Expected:

- Backend tests: PASS
- Frontend tests: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/kids/kids-result-view.tsx frontend/src/app/kids/result/page.tsx backend/services/kids_experience.py frontend/src/components/kids/__tests__/kids-fallback-banner.test.tsx backend/tests/test_kids_experience.py
git commit -m "feat: finalize kids experience event flow"
```

## Self-Review

### Spec coverage

- Home entry point: covered by Task 1.
- Login-free isolated `/kids` flow: covered by Tasks 1 and 2.
- Input structure with topics, activities, free text, and 8 questions: covered by Task 2.
- 3-5 recommendation result structure: covered by Tasks 3, 4, and 6.
- Button-based AI quick counsel: covered by Task 4.
- Public FastAPI `kids-experience` API: covered by Tasks 3 and 5.
- Two-page PDF output path: covered by Task 5.
- Fallback demo behavior: covered by Tasks 3 and 6.

### Placeholder scan

- No `TBD`/`TODO` placeholders remain inside the task steps.
- Each task includes concrete file paths, commands, and expected results.

### Type consistency

- Frontend request/response keys use snake_case to match FastAPI/Pydantic defaults.
- Backend public schema names remain `KidsExperienceAnalyzeRequest` and `KidsExperienceAnalyzeResponse`.
- PDF generation consumes the exact analyze response payload, so result rendering and report generation share one structure.

