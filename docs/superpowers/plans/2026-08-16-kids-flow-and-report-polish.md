# Kids Flow and Report Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초등 체험 흐름에서 step 전환 이동, 시작 입력 화면, 결과 리포트 카드 표현을 더 자연스럽고 상담형으로 개선한다.

**Architecture:** 기존 kids 전용 컴포넌트 구조를 유지하면서, 질문 플로우 컴포넌트에 step 전환 스크롤 제어를 추가하고, 시작 입력 컴포넌트와 결과 카드 컴포넌트의 마크업 및 스타일을 확장한다. 백엔드 응답 스키마는 유지하고 프론트 표현만 정교화해 리스크를 줄인다.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Testing Library, Vitest, global CSS

## Global Constraints

- 기존 kids 세션 저장 구조와 API payload 형식은 바꾸지 않는다.
- 결과 리포트는 “상담 레포트” 톤을 유지하되 기술적인 문구는 줄인다.
- 새 UI는 모바일에서도 기존 반응형 규칙을 깨지 않아야 한다.
- 테스트는 흐름 테스트와 렌더링 테스트 기준으로 유지·보강한다.

---

### Task 1: Step 전환 시 성향 질문 첫 위치로 이동시키기

**Files:**
- Modify: `frontend/src/components/kids/kids-question-flow.tsx`
- Test: `frontend/src/components/kids/__tests__/kids-question-flow.test.tsx`

**Interfaces:**
- Consumes: `KidsDraft`, `KIDS_PERSONALITY_QUESTIONS`
- Produces: step 1 → step 2 전환 시 성향 질문 섹션의 첫 카드가 화면 상단 근처로 노출되는 스크롤 동작

- [ ] **Step 1: 질문 플로우에 스크롤 기준 ref를 추가하는 failing test를 먼저 정리**

```tsx
test("moves viewport to the personality section when advancing from profile step", async () => {
  const user = userEvent.setup();
  const scrollIntoView = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

  render(
    <KidsQuestionFlow initialDraft={{ ...EMPTY_KIDS_DRAFT, participantName: "민지" }} onComplete={vi.fn()} />,
  );

  await user.click(screen.getByRole("button", { name: "동물" }));
  await user.click(screen.getByRole("button", { name: "우주" }));
  await user.click(screen.getByRole("button", { name: "로봇" }));
  await user.click(screen.getByRole("button", { name: "만들기" }));
  await user.click(screen.getByRole("button", { name: "관찰하기" }));
  await user.click(screen.getByRole("button", { name: "레고 만들기" }));
  await user.click(screen.getByRole("button", { name: "혼자 천천히" }));
  await user.click(screen.getByRole("button", { name: "작품 만들기" }));
  await user.click(screen.getByRole("button", { name: "내가 만든 걸 보여줬을 때" }));
  await user.type(screen.getByPlaceholderText("예: 강아지 돌보기, 레고 만들기, 축구하기"), "레고 만들기");
  await user.click(screen.getByRole("button", { name: "다음으로" }));

  expect(scrollIntoView).toHaveBeenCalled();
});
```

- [ ] **Step 2: 테스트를 실행해 현재 실패를 확인**

Run: `npm run test -- src/components/kids/__tests__/kids-question-flow.test.tsx`  
Expected: FAIL because no scroll handler exists

- [ ] **Step 3: 질문 플로우에 첫 성향 카드 ref와 step 전환 후 scrollIntoView 구현**

```tsx
const personalityStartRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (stepIndex === 1) {
    personalityStartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [stepIndex]);
```

- [ ] **Step 4: 첫 성향 질문 카드 또는 섹션 헤더에 ref 연결**

```tsx
<section ref={personalityStartRef} className="kids-card">
```

- [ ] **Step 5: 테스트 재실행**

Run: `npm run test -- src/components/kids/__tests__/kids-question-flow.test.tsx`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/kids/kids-question-flow.tsx frontend/src/components/kids/__tests__/kids-question-flow.test.tsx
git commit -m "feat: improve kids step transition scrolling"
```

### Task 2: 이름/별명 입력 화면을 더 친근하게 개선하기

**Files:**
- Modify: `frontend/src/components/kids/kids-intro-form.tsx`
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/src/components/kids/__tests__/kids-intro-form.test.tsx`

**Interfaces:**
- Consumes: `onStart(participantName: string)`
- Produces: 이름/별명 입력 카드의 새 안내 문구, 예시 텍스트, 시각 구조

- [ ] **Step 1: 시작 카드 표현을 검증하는 테스트 추가**

```tsx
test("renders welcoming copy for the kids intro form", () => {
  render(<KidsIntroForm onStart={vi.fn()} />);

  expect(screen.getByText("이름을 알려주면 더 다정하게 불러줄 수 있어요")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("예: 민재, 지우, 별이")).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실행으로 현재 실패 확인**

Run: `npm run test -- src/components/kids/__tests__/kids-intro-form.test.tsx`  
Expected: FAIL because new copy is not rendered

- [ ] **Step 3: 입력 화면 마크업을 안내형 카드로 확장**

```tsx
<form className="kids-card kids-intro-form kids-intro-welcome" onSubmit={submit}>
  <p className="eyebrow">START TOGETHER</p>
  <h2>먼저 어떻게 불러주면 좋을까?</h2>
  <p>이름을 알려주면 더 다정하게 불러줄 수 있어요.</p>
```

- [ ] **Step 4: placeholder와 label 문구 개선**

```tsx
placeholder="예: 민재, 지우, 별이"
```

- [ ] **Step 5: 전용 스타일 추가**

```css
.kids-intro-welcome h2 { margin: 4px 0 0; font-size: 28px; }
.kids-intro-welcome > p:last-of-type { margin: 8px 0 0; color: var(--muted); line-height: 1.7; }
```

- [ ] **Step 6: 테스트 재실행**

Run: `npm run test -- src/components/kids/__tests__/kids-intro-form.test.tsx`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/kids/kids-intro-form.tsx frontend/src/app/globals.css frontend/src/components/kids/__tests__/kids-intro-form.test.tsx
git commit -m "feat: refresh kids intro form copy and layout"
```

### Task 3: 결과 리포트 카드 표현을 상담형으로 다듬기

**Files:**
- Modify: `frontend/src/components/kids/kids-result-view.tsx`
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/src/components/kids/__tests__/kids-result-view.test.tsx`

**Interfaces:**
- Consumes: `KidsExperienceResult.report_sections`
- Produces: fallback 배너 제거, 숨은 가능성/관찰/응원/보호자 가이드/대화 질문의 더 읽기 쉬운 카드 표현

- [ ] **Step 1: 결과 리포트 기대 문구를 먼저 테스트에 반영**

```tsx
expect(screen.queryByText("지금은 체험용 예시 결과를 보여주고 있어요.")).not.toBeInTheDocument();
expect(screen.getByText("이런 모습으로 자라날 수 있어요")).toBeInTheDocument();
expect(screen.getByText("집에서 이런 순간을 살펴봐 주세요")).toBeInTheDocument();
expect(screen.getByText("학교에서는 이렇게 북돋아 주세요")).toBeInTheDocument();
expect(screen.getByText("보호자 가이드")).toBeInTheDocument();
expect(screen.getByText("다음 대화 시작 질문")).toBeInTheDocument();
```

- [ ] **Step 2: 테스트를 실행해 현재 실패 확인**

Run: `npm run test -- src/components/kids/__tests__/kids-result-view.test.tsx`  
Expected: FAIL because current headings/copy differ

- [ ] **Step 3: fallback 배너 제거**

```tsx
{result.fallback_used ? null : null}
```

- [ ] **Step 4: 숨은 가능성 / 관찰 / 응원 카드 제목과 보조 문구를 상담형으로 교체**

```tsx
<h2>숨은 가능성 분야</h2>
<strong className="kids-observation-caption">이런 모습으로 자라날 수 있어요</strong>
```

```tsx
<h2>집에서 이렇게 지켜봐 주세요</h2>
<strong className="kids-observation-caption">집에서 이런 순간을 살펴봐 주세요</strong>
```

```tsx
<h2>학교에서 이렇게 응원해 주세요</h2>
<strong className="kids-observation-caption">학교에서는 이렇게 북돋아 주세요</strong>
```

- [ ] **Step 5: 보호자 가이드 / 대화 질문 텍스트 블록을 메모형 카드로 정리**

```tsx
<p className="eyebrow">보호자 가이드</p>
<h2>부모님께 먼저 전하는 말</h2>
<p className="kids-note-paragraph">{parentMessage}</p>
```

```tsx
<p className="eyebrow">다음 대화</p>
<h2>다음 대화 시작 질문</h2>
<p className="kids-note-paragraph">{nextTalkQuestion}</p>
```

- [ ] **Step 6: 전용 스타일 보강**

```css
.kids-observation-card { display: grid; align-content: start; gap: 12px; }
.kids-note-paragraph { margin: 0; color: #44544d; font-size: 14px; line-height: 1.9; }
```

- [ ] **Step 7: 결과 리포트 테스트 재실행**

Run: `npm run test -- src/components/kids/__tests__/kids-result-view.test.tsx`  
Expected: PASS

- [ ] **Step 8: 프론트 kids 관련 테스트와 빌드 확인**

Run: `npm run test -- src/components/kids/__tests__/kids-intro-form.test.tsx src/components/kids/__tests__/kids-question-flow.test.tsx src/components/kids/__tests__/kids-result-view.test.tsx src/components/kids/__tests__/kids-report-download.test.tsx`  
Expected: PASS

Run: `npm run build`  
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/kids/kids-result-view.tsx frontend/src/app/globals.css frontend/src/components/kids/__tests__/kids-result-view.test.tsx
git commit -m "feat: polish kids counseling report presentation"
```

## Self-Review

- **Spec coverage:** step 전환 이동, 입력 UI 개선, fallback 문구 제거, 숨은 가능성/관찰/응원/보호자 가이드/대화 질문 표현 개선이 각 Task 1~3에 대응된다.
- **Placeholder scan:** TODO/TBD 없음. 모든 테스트/수정 파일/검증 명령 명시됨.
- **Type consistency:** `KidsDraft`, `KidsExperienceResult`, `onStart`, `report_sections` 등 기존 인터페이스 이름 유지.

