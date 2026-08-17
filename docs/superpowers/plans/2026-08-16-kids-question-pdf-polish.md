# Kids Question and PDF Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the kids question flow wording, move the summary panel lower on the report cover, and make print/PDF output fit an A4-style layout closer to the on-screen report.

**Architecture:** Keep the current kids experience flow and report component structure, but tighten the question-bank copy and the print CSS. Use the same result component for screen and print, with A4-specific layout rules only in print mode so the visual hierarchy stays consistent.

**Tech Stack:** Next.js, React, TypeScript, Vitest, CSS

## Global Constraints

- Preserve the existing two-step flow: profile inputs first, personality questions second.
- Keep the report component shared between result preview and print page.
- Adjust only the kids experience UI/copy and print styling needed for this request.

---

### Task 1: Refine Step 3 wording and options

**Files:**
- Modify: `frontend/src/components/kids/kids-question-bank.ts`
- Modify: `frontend/src/components/kids/kids-question-flow.tsx`
- Test: `frontend/src/components/kids/__tests__/kids-question-flow.test.tsx`

**Interfaces:**
- Consumes: existing `KidsDraft.frequentActivities`, `KidsDraft.freeTextNote`
- Produces: updated Step 3 labels/options and updated validation copy

- [ ] Update Step 3 heading/helper copy to focus on familiar play and everyday activities.
- [ ] Replace weak or confusing frequent-activity options with more child-appropriate exploration options.
- [ ] Reposition the free-text prompt copy so it complements Step 3 instead of duplicating it.
- [ ] Update tests to reflect the new wording and visible options.

### Task 2: Lower the report summary panel visually

**Files:**
- Modify: `frontend/src/components/kids/kids-result-view.tsx`
- Modify: `frontend/src/app/globals.css`
- Test: `frontend/src/components/kids/__tests__/kids-result-view.test.tsx`

**Interfaces:**
- Consumes: `KidsExperienceResult`
- Produces: report cover layout with the summary panel visually anchored lower

- [ ] Adjust the report cover layout so the right summary column sits lower and reads like a companion block rather than a top-pinned sidebar.
- [ ] Keep mobile stacking behavior intact.
- [ ] Update any tests affected by changed copy or structure.

### Task 3: Make print/PDF output A4-friendly

**Files:**
- Modify: `frontend/src/app/kids/report/page.tsx`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/components/kids/kids-report-download.tsx`
- Test: `frontend/src/components/kids/__tests__/kids-report-download.test.tsx`

**Interfaces:**
- Consumes: existing print snapshot flow and `/kids/report`
- Produces: A4-style print layout and preview closer to the live screen

- [ ] Add A4-oriented page sizing and margins for print mode.
- [ ] Reduce full-width stretching and oversized vertical flow in print.
- [ ] Keep preview iframe behavior aligned with the print page.
- [ ] Verify test coverage and build output after the layout changes.
