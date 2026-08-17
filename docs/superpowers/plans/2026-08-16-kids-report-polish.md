# Kids Report Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초등 진로 체험 결과 화면을 리포트 표지처럼 다듬고, PDF 미리보기를 모달형으로 개선하며, PDF 출력 구조를 결과 화면 흐름과 더 가깝게 맞춘다.

**Architecture:** 프론트에서는 결과 리포트 상단 히어로와 PDF 미리보기 컴포넌트의 구조를 조정하고, CSS를 통해 표지/모달 레이아웃을 강화한다. 백엔드에서는 기존 PDF 생성 함수를 유지하되 섹션 순서와 제목을 화면 흐름에 맞게 정렬한다.

**Tech Stack:** Next.js, React Testing Library, Vitest, FastAPI, PyMuPDF

## Global Constraints

- 기존 결과 데이터 스키마는 유지한다.
- PDF는 기존 `/api/kids-experience/report` 응답 방식을 유지한다.
- 프론트에서 PDF를 직접 그리지 않고, 백엔드 PDF를 미리보기/저장한다.
- 기존 테스트 패턴을 유지하며 UI 변경에 맞는 테스트를 추가한다.

---

### Task 1: 결과 화면 표지형 상단 강화

**Files:**
- Modify: `frontend/src/components/kids/kids-result-view.tsx`
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/src/components/kids/__tests__/kids-result-view.test.tsx`

**Interfaces:**
- Consumes: `KidsExperienceResult`
- Produces: 표지형 히어로 마크업과 관련 CSS 클래스

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByText("리포트 표지")).toBeInTheDocument();
expect(screen.getByText("핵심 요약")).toBeInTheDocument();
expect(screen.getByText("대표 키워드")).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/kids/__tests__/kids-result-view.test.tsx`
Expected: FAIL because the new cover labels are not rendered yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
<section className="kids-report-cover">
  <div className="kids-report-cover-main">...</div>
  <aside className="kids-report-cover-side">...</aside>
</section>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/kids/__tests__/kids-result-view.test.tsx`
Expected: PASS

### Task 2: PDF 미리보기 모달 전환

**Files:**
- Modify: `frontend/src/components/kids/kids-report-download.tsx`
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/src/components/kids/__tests__/kids-report-download.test.tsx`

**Interfaces:**
- Consumes: `downloadKidsReport({ draft, result }) => Promise<Blob>`
- Produces: 모달형 미리보기 UI, 닫기/저장 흐름

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByRole("dialog", { name: "PDF 미리보기" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "미리보기 닫기" })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/kids/__tests__/kids-report-download.test.tsx`
Expected: FAIL because the component still renders an inline preview instead of a dialog.

- [ ] **Step 3: Write minimal implementation**

```tsx
{previewUrl ? (
  <div className="kids-report-modal-backdrop">
    <div className="kids-report-modal" role="dialog" aria-label="PDF 미리보기">
      ...
    </div>
  </div>
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/kids/__tests__/kids-report-download.test.tsx`
Expected: PASS

### Task 3: PDF 섹션 순서와 카피 정렬

**Files:**
- Modify: `backend/services/kids_report.py`
- Test: `backend/tests/test_kids_report.py`

**Interfaces:**
- Consumes: `build_kids_report_pdf(draft: KidsExperienceAnalyzeRequest, result: KidsExperienceAnalyzeResponse) -> bytes`
- Produces: 화면 흐름과 더 닮은 PDF 텍스트 구조

- [ ] **Step 1: Write the failing test**

```python
assert "상담 선생님 정리 노트" in report_text
assert "숨은 가능성 분야" in report_text
assert "다음 대화 시작 질문" in report_text
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_kids_report.py -q`
Expected: FAIL because the old PDF headings/order do not fully match the updated report flow.

- [ ] **Step 3: Write minimal implementation**

```python
draw_title(...)
draw_labeled_box(..., "상담 선생님 정리 노트", ...)
draw_labeled_box(..., "다음 대화 시작 질문", ...)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_kids_report.py -q`
Expected: PASS

### Task 4: 통합 확인

**Files:**
- Modify: `frontend/src/components/kids/__tests__/kids-result-view.test.tsx`
- Modify: `frontend/src/components/kids/__tests__/kids-report-download.test.tsx`

**Interfaces:**
- Consumes: updated result view and modal preview behavior
- Produces: regression coverage for cover and preview UX

- [ ] **Step 1: Run targeted frontend tests**

Run: `npm run test -- src/components/kids/__tests__/kids-result-view.test.tsx src/components/kids/__tests__/kids-report-download.test.tsx`
Expected: PASS

- [ ] **Step 2: Run backend PDF test**

Run: `python -m pytest backend/tests/test_kids_report.py -q`
Expected: PASS

- [ ] **Step 3: Run frontend production build**

Run: `npm run build`
Expected: PASS
