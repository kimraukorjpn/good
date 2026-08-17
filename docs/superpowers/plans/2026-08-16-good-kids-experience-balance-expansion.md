# Good Kids Experience Balance Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the kids experience intake and upgrade the AI counseling report so the output feels like a polished elementary career counseling report.

**Architecture:** Keep the existing `/kids` public flow, but expand the intake payload with four lightweight choice-based inputs, then enrich the FastAPI response contract and fallback/APIM prompt so the frontend and PDF can render richer counseling sections. Deliver the work in vertical slices so each task leaves the product runnable and testable.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, FastAPI, Pydantic, Pytest, PyMuPDF

## Global Constraints

- Preserve the public no-login `/kids` flow.
- Keep the experience mostly choice-based and lightweight for elementary users.
- Recommended jobs must remain exactly 3.
- Use the label `다음에 해보면 좋은 활동` instead of `탐험 계획`.
- Results must read like counseling guidance, not fixed judgment.
- PDF download remains gated behind the existing extra confirmation.

---

## File Structure

- Modify `frontend/src/components/kids/types.ts` to extend the shared draft/result contracts.
- Modify `frontend/src/components/kids/kids-question-bank.ts` to add new balanced-expansion intake options.
- Modify `frontend/src/components/kids/kids-question-flow.tsx` to collect the new inputs in the first step while keeping personality as the second step.
- Modify `frontend/src/components/kids/kids-session.ts` to persist and hydrate the new fields safely.
- Modify `frontend/src/lib/api.ts` to send the expanded payload.
- Modify `frontend/src/components/kids/kids-result-view.tsx` and `frontend/src/app/globals.css` to improve the counseling-style report presentation.
- Modify `backend/schemas.py` to expand the request schema.
- Modify `backend/services/kids_experience.py` to use the new inputs in fallback generation and APIM prompting.
- Modify `backend/tests/test_kids_experience.py` to pin the expanded response behavior.
- Modify `frontend` kids tests to pin the new intake and report rendering.

### Task 1: Expand intake contract and first-step UI

**Files:**
- Modify: `frontend/src/components/kids/types.ts`
- Modify: `frontend/src/components/kids/kids-question-bank.ts`
- Modify: `frontend/src/components/kids/kids-question-flow.tsx`
- Modify: `frontend/src/components/kids/kids-session.ts`
- Modify: `frontend/src/lib/api.ts`
- Test: `frontend/src/components/kids/__tests__/kids-question-flow.test.tsx`
- Test: `frontend/src/components/kids/__tests__/kids-session.test.ts`

**Interfaces:**
- Consumes: existing `KidsDraft`, `readKidsDraft`, `writeKidsDraft`, `analyzeKidsExperience()`.
- Produces: expanded `KidsDraft` with `frequentActivities`, `comfortStyle`, `preferredOutcomeTypes`, `proudMomentType` fields; updated request payload used by backend in Task 2.

- [ ] **Step 1: Write the failing tests**

```tsx
expect(screen.getByText("요즘 자주 하는 건 뭐야?")).toBeInTheDocument();
expect(screen.getByText("어떨 때 더 편해?")).toBeInTheDocument();
expect(screen.getByText("무엇을 만들거나 보여주는 게 좋아?")).toBeInTheDocument();
expect(screen.getByText("최근에 스스로 뿌듯했던 순간은 언제야?")).toBeInTheDocument();
```

```ts
expect(result?.frequentActivities).toEqual(["레고 만들기"]);
expect(result?.comfortStyle).toBe("혼자 천천히");
expect(result?.preferredOutcomeTypes).toEqual(["작품 만들기"]);
expect(result?.proudMomentType).toBe("내가 만든 걸 보여줬을 때");
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm run test -- src/components/kids/__tests__/kids-question-flow.test.tsx src/components/kids/__tests__/kids-session.test.ts`
Expected: FAIL because the new fields and copy are not rendered or persisted yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type KidsDraft = {
  participantName: string;
  favoriteTopics: string[];
  favoriteActivities: string[];
  frequentActivities: string[];
  comfortStyle: string;
  preferredOutcomeTypes: string[];
  proudMomentType: string;
  freeTextNote: string;
  personalityAnswers: Record<string, string>;
};
```

```ts
export const KIDS_BALANCED_INPUTS = {
  frequentActivities: ["레고 만들기", "그림 그리기", "책 읽기", "운동하기", "블록 놀이", "동생 챙기기", "만들기 놀이"],
  comfortStyles: ["혼자 천천히", "친구와 함께", "둘 다 좋아"],
  preferredOutcomeTypes: ["작품 만들기", "이야기 들려주기", "발표하기", "문제 해결하기", "사람 돕기", "꾸미기", "관찰 기록 남기기"],
  proudMomentTypes: ["내가 만든 걸 보여줬을 때", "친구를 도와줬을 때", "어려운 걸 해냈을 때", "새로운 걸 해봤을 때", "오래 집중했을 때"],
} as const;
```

```tsx
// first step section sketch inside KidsQuestionFlow
<KidsMultiSelectQuestion title="요즘 자주 하는 건 뭐야?" ... />
<KidsSingleSelectQuestion title="어떨 때 더 편해?" ... />
<KidsMultiSelectQuestion title="무엇을 만들거나 보여주는 게 좋아?" ... />
<KidsSingleSelectQuestion title="최근에 스스로 뿌듯했던 순간은 언제야?" ... />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm run test -- src/components/kids/__tests__/kids-question-flow.test.tsx src/components/kids/__tests__/kids-session.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/kids/types.ts frontend/src/components/kids/kids-question-bank.ts frontend/src/components/kids/kids-question-flow.tsx frontend/src/components/kids/kids-session.ts frontend/src/lib/api.ts frontend/src/components/kids/__tests__/kids-question-flow.test.tsx frontend/src/components/kids/__tests__/kids-session.test.ts
git commit -m "feat: expand kids intake inputs"
```

### Task 2: Expand backend request schema and AI/fallback reasoning

**Files:**
- Modify: `backend/schemas.py`
- Modify: `backend/services/kids_experience.py`
- Test: `backend/tests/test_kids_experience.py`

**Interfaces:**
- Consumes: expanded draft payload from Task 1.
- Produces: backend request schema with `frequent_activities`, `comfort_style`, `preferred_outcome_types`, `proud_moment_type`; richer response prose and hidden potential fields used by Task 3.

- [ ] **Step 1: Write the failing tests**

```python
assert captured_input["frequent_activities"] == ["레고 만들기"]
assert payload["report_sections"]["profile_overview"]
assert payload["report_sections"]["hidden_potential_fields"]
assert "혼자 천천히" in payload["report_sections"]["profile_overview"] or payload["personality_summary"]
```

```python
assert "frequent_activities" in captured["json"]["messages"][1]["content"]
assert "comfort_style" in captured["json"]["messages"][1]["content"]
assert "preferred_outcome_types" in captured["json"]["messages"][1]["content"]
assert "proud_moment_type" in captured["json"]["messages"][1]["content"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m pytest backend/tests/test_kids_experience.py -q`
Expected: FAIL because the backend does not accept or use the new fields yet.

- [ ] **Step 3: Write minimal implementation**

```python
class KidsExperienceAnalyzeRequest(BaseModel):
    participant_name: str = Field(min_length=1, max_length=40)
    favorite_topics: list[str] = Field(min_length=3, max_length=5)
    favorite_activities: list[str] = Field(min_length=2, max_length=4)
    frequent_activities: list[str] = Field(default_factory=list, max_length=2)
    comfort_style: str = Field(default="", max_length=30)
    preferred_outcome_types: list[str] = Field(default_factory=list, max_length=2)
    proud_moment_type: str = Field(default="", max_length=60)
    free_text_note: str = Field(default="", max_length=120)
    personality_answers: dict[str, str] = Field(min_length=8, max_length=8)
```

```python
profile_overview = (
    f"{request.participant_name}는 {topic_summary}처럼 좋아하는 주제를 오래 붙잡고, "
    f"{activity_summary} 과정에서 몰입이 커지는 편이에요. "
    f"특히 {request.comfort_style or '자기에게 편한 방식'}으로 움직일 때 더 자연스럽게 강점이 보여요."
)
```

```python
# APIM prompt fragment
"입력에는 frequent_activities, comfort_style, preferred_outcome_types, proud_moment_type이 포함됩니다. 이 정보를 상담형 문장에 자연스럽게 반영하세요."
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m pytest backend/tests/test_kids_experience.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/schemas.py backend/services/kids_experience.py backend/tests/test_kids_experience.py
git commit -m "feat: enrich kids analysis inputs"
```

### Task 3: Upgrade counseling report presentation and PDF-facing data shape

**Files:**
- Modify: `frontend/src/components/kids/kids-result-view.tsx`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/components/kids/__tests__/kids-result-view.test.tsx`
- Modify: `frontend/src/components/kids/__tests__/kids-report-download.test.tsx`
- Modify: `backend/services/kids_report.py`
- Modify: `backend/tests/test_kids_report.py`

**Interfaces:**
- Consumes: enriched response from Task 2.
- Produces: more polished counseling-style UI and PDF with stronger hierarchy and the new hidden-potential/support sections.

- [ ] **Step 1: Write the failing tests**

```tsx
expect(screen.getByText("상담 선생님이 본 전체 모습")).toBeInTheDocument();
expect(screen.getByText("숨은 가능성 분야")).toBeInTheDocument();
expect(screen.getByText("부모님께 먼저 전하는 말")).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "다음에 해보면 좋은 활동" })).toBeInTheDocument();
```

```python
assert "상담 선생님이 본 전체 모습" in report_text
assert "숨은 가능성 분야" in report_text
assert "부모님께 먼저 전하는 말" in report_text
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm run test -- src/components/kids/__tests__/kids-result-view.test.tsx src/components/kids/__tests__/kids-report-download.test.tsx && cd .. && python3 -m pytest backend/tests/test_kids_report.py -q`
Expected: FAIL if any new presentation block is missing.

- [ ] **Step 3: Write minimal implementation**

```tsx
<section className="kids-card kids-summary-card">
  <div className="kids-report-headline">
    <strong>상담 선생님이 본 전체 모습</strong>
    <p>{profileOverview}</p>
  </div>
</section>
```

```tsx
<section className="kids-report-observation-grid">
  <article className="kids-card kids-observation-card">
    <p className="eyebrow">숨은 가능성</p>
    <h2>숨은 가능성 분야</h2>
    <div className="tag-list">...</div>
  </article>
</section>
```

```python
draw_labeled_box(page3, fontname, fitz.Rect(...), "숨은 가능성 분야", "\n".join(result.report_sections.hidden_potential_fields))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm run test -- src/components/kids/__tests__/kids-result-view.test.tsx src/components/kids/__tests__/kids-report-download.test.tsx && cd .. && python3 -m pytest backend/tests/test_kids_report.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/kids/kids-result-view.tsx frontend/src/app/globals.css frontend/src/components/kids/__tests__/kids-result-view.test.tsx frontend/src/components/kids/__tests__/kids-report-download.test.tsx backend/services/kids_report.py backend/tests/test_kids_report.py
git commit -m "feat: polish kids counseling report"
```

### Task 4: Full verification and local handoff

**Files:**
- Modify: `docs/API_KEY_MANAGEMENT.md`
- Modify: `docs/superpowers/plans/2026-08-16-good-kids-experience-balance-expansion.md`

**Interfaces:**
- Consumes: completed code from Tasks 1-3.
- Produces: updated local/dev verification notes and a clean verification checklist for the user.

- [ ] **Step 1: Write the failing docs check**

```text
Confirm that docs mention the new kids input fields and how they influence APIM output.
```

- [ ] **Step 2: Run current verification before doc updates**

Run: `python3 -m pytest backend/tests/test_kids_experience.py backend/tests/test_kids_report.py -q && cd frontend && npm run test -- src/components/kids/__tests__/kids-session.test.ts src/components/kids/__tests__/kids-question-flow.test.tsx src/components/kids/__tests__/kids-result-view.test.tsx src/components/kids/__tests__/kids-report-download.test.tsx && npm run build`
Expected: PASS for code, docs still missing the new balanced expansion details.

- [ ] **Step 3: Write minimal documentation updates**

```md
## Kids Balanced Expansion Inputs
- frequent_activities
- comfort_style
- preferred_outcome_types
- proud_moment_type

These fields are included in the APIM prompt and should influence profile overview, hidden potential fields, and suggested activities.
```

- [ ] **Step 4: Run final verification**

Run: `python3 -m pytest backend/tests/test_kids_experience.py backend/tests/test_kids_report.py -q && cd frontend && npm run test -- src/components/kids/__tests__/kids-session.test.ts src/components/kids/__tests__/kids-question-flow.test.tsx src/components/kids/__tests__/kids-result-view.test.tsx src/components/kids/__tests__/kids-report-download.test.tsx && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/API_KEY_MANAGEMENT.md docs/superpowers/plans/2026-08-16-good-kids-experience-balance-expansion.md
git commit -m "docs: update kids experience rollout notes"
```
