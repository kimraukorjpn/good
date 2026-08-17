"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  KIDS_ACTIVITY_OPTIONS,
  KIDS_COMFORT_STYLE_OPTIONS,
  KIDS_FREQUENT_ACTIVITY_OPTIONS,
  KIDS_OUTCOME_TYPE_OPTIONS,
  KIDS_PERSONALITY_QUESTIONS,
  KIDS_PROUD_MOMENT_OPTIONS,
  KIDS_TOPIC_OPTIONS,
} from "@/components/kids/kids-question-bank";
import { KidsDraft } from "@/components/kids/types";

type ValidationSection =
  | "topics"
  | "activities"
  | "frequent"
  | "comfort"
  | "outcomes"
  | "proud"
  | "freeText"
  | "personality";

function toggleItem(items: string[], value: string, maxCount: number) {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }
  if (items.length >= maxCount) {
    return items;
  }
  return [...items, value];
}

export function KidsQuestionFlow({
  initialDraft,
  onComplete,
  loading = false,
}: {
  initialDraft: KidsDraft;
  onComplete: (draft: KidsDraft) => void;
  loading?: boolean;
}) {
  const [draft, setDraft] = useState<KidsDraft>(initialDraft);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const personalityStepRef = useRef<HTMLElement | null>(null);
  const topicsRef = useRef<HTMLElement | null>(null);
  const activitiesRef = useRef<HTMLElement | null>(null);
  const frequentRef = useRef<HTMLElement | null>(null);
  const comfortRef = useRef<HTMLElement | null>(null);
  const outcomesRef = useRef<HTMLElement | null>(null);
  const proudRef = useRef<HTMLElement | null>(null);
  const freeTextRef = useRef<HTMLElement | null>(null);
  const isProfileStep = stepIndex === 0;
  const answeredCount = useMemo(
    () =>
      KIDS_PERSONALITY_QUESTIONS.filter(
        (question) => draft.personalityAnswers[question.id],
      ).length,
    [draft.personalityAnswers],
  );
  const totalSteps = 2;

  useEffect(() => {
    if (stepIndex === 1) {
      personalityStepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stepIndex]);

  function scrollToSection(section: ValidationSection) {
    const target =
      section === "topics"
        ? topicsRef.current
        : section === "activities"
          ? activitiesRef.current
          : section === "frequent"
            ? frequentRef.current
            : section === "comfort"
              ? comfortRef.current
              : section === "outcomes"
                ? outcomesRef.current
                : section === "proud"
                  ? proudRef.current
                  : section === "freeText"
                    ? freeTextRef.current
                    : personalityStepRef.current;

    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function failWithError(message: string, section: ValidationSection) {
    setError(message);
    scrollToSection(section);
  }

  function goNext() {
    if (draft.favoriteTopics.length < 3) {
      failWithError("좋아하는 주제를 3개 이상 골라줘!", "topics");
      return;
    }
    if (draft.favoriteActivities.length < 2) {
      failWithError("좋아하는 활동을 2개 이상 골라줘!", "activities");
      return;
    }
    if (draft.frequentActivities.length < 1) {
      failWithError("요즘 자주 하는 놀이·활동도 골라주면 더 잘 맞는 결과를 만들 수 있어요!", "frequent");
      return;
    }
    if (!draft.comfortStyle) {
      failWithError("어떨 때 더 편한지도 골라주면 아이의 스타일을 더 잘 볼 수 있어요!", "comfort");
      return;
    }
    if (draft.preferredOutcomeTypes.length < 1) {
      failWithError("무엇을 만들거나 보여주는 게 좋은지도 골라줘!", "outcomes");
      return;
    }
    if (!draft.proudMomentType) {
      failWithError("최근에 뿌듯했던 순간도 골라주면 결과가 더 따뜻해져요!", "proud");
      return;
    }
    if (!draft.freeTextNote.trim()) {
      failWithError("한 줄로 지금 좋아하는 것을 적어주면 결과가 더 잘 나와요!", "freeText");
      return;
    }
    setError("");
    setStepIndex((current) => Math.min(current + 1, totalSteps - 1));
  }

  function goPrev() {
    setError("");
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function submit() {
    if (draft.favoriteTopics.length < 3) {
      failWithError("좋아하는 주제를 3개 이상 골라줘!", "topics");
      return;
    }
    if (draft.favoriteActivities.length < 2) {
      failWithError("좋아하는 활동을 2개 이상 골라줘!", "activities");
      return;
    }
    if (draft.frequentActivities.length < 1) {
      failWithError("요즘 자주 하는 놀이·활동도 골라주면 더 잘 맞는 결과를 만들 수 있어요!", "frequent");
      return;
    }
    if (!draft.comfortStyle) {
      failWithError("어떨 때 더 편한지도 골라주면 아이의 스타일을 더 잘 볼 수 있어요!", "comfort");
      return;
    }
    if (draft.preferredOutcomeTypes.length < 1) {
      failWithError("무엇을 만들거나 보여주는 게 좋은지도 골라줘!", "outcomes");
      return;
    }
    if (!draft.proudMomentType) {
      failWithError("최근에 뿌듯했던 순간도 골라주면 결과가 더 따뜻해져요!", "proud");
      return;
    }
    if (answeredCount !== KIDS_PERSONALITY_QUESTIONS.length) {
      failWithError("성향 질문 8개에 모두 답해줘!", "personality");
      return;
    }
    setError("");
    onComplete(draft);
  }

  return (
    <div className="kids-flow">
      <section className="kids-card kids-progress-card">
        <div className="kids-stepper">
          <div>
            <p className="eyebrow">STEP {stepIndex + 1}</p>
            <h2>한 단계씩 천천히 해볼까요?</h2>
            <p>
              {isProfileStep
                ? "좋아하는 것들을 먼저 한 번에 알려주고, 다음 화면에서 성향 질문을 이어가요."
                : "이제 마지막으로 성향 질문 8개에 답하면 상담 리포트를 만들 수 있어요."}
            </p>
          </div>
          <strong>{stepIndex + 1} / {totalSteps}</strong>
        </div>
        <div className="kids-progress-track" aria-hidden="true">
          <span style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }} />
        </div>
      </section>

      {isProfileStep ? (
        <>
        <section ref={topicsRef} className="kids-card">
          <div className="kids-section-head">
            <div>
              <p className="eyebrow">STEP 1</p>
              <h2>좋아하는 주제를 골라봐!</h2>
              <p>3개에서 5개까지 고를 수 있어요.</p>
            </div>
            <strong>{draft.favoriteTopics.length}/5</strong>
          </div>
          <div className="kids-chip-grid">
            {KIDS_TOPIC_OPTIONS.map((option) => {
              const selected = draft.favoriteTopics.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? "kids-chip kids-chip-selected" : "kids-chip"}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      favoriteTopics: toggleItem(current.favoriteTopics, option, 5),
                    }))
                  }
                  aria-pressed={selected}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <p className="kids-helper-text">많이 고를수록 더 다양한 직업을 추천할 수 있어요.</p>
        </section>

        <section ref={activitiesRef} className="kids-card">
          <div className="kids-section-head">
            <div>
              <p className="eyebrow">STEP 2</p>
              <h2>어떤 활동이 즐거워?</h2>
              <p>2개에서 4개까지 골라보세요.</p>
            </div>
            <strong>{draft.favoriteActivities.length}/4</strong>
          </div>
          <div className="kids-chip-grid">
            {KIDS_ACTIVITY_OPTIONS.map((option) => {
              const selected = draft.favoriteActivities.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? "kids-chip kids-chip-selected" : "kids-chip"}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      favoriteActivities: toggleItem(current.favoriteActivities, option, 4),
                    }))
                  }
                  aria-pressed={selected}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <p className="kids-helper-text">좋아하는 방식이 직업 추천 이유에 직접 반영돼요.</p>
        </section>

        <section ref={frequentRef} className="kids-card">
          <div className="kids-section-head">
            <div>
              <p className="eyebrow">STEP 3</p>
              <h2>요즘 자주 하거나 자꾸 손이 가는 놀이는 뭐야?</h2>
              <p>쉬는 시간이나 집에서 자연스럽게 많이 하게 되는 놀이를 골라보세요.</p>
            </div>
            <strong>{draft.frequentActivities.length}/3</strong>
          </div>
          <div className="kids-chip-grid">
            {KIDS_FREQUENT_ACTIVITY_OPTIONS.map((option) => {
              const selected = draft.frequentActivities.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? "kids-chip kids-chip-selected" : "kids-chip"}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      frequentActivities: toggleItem(current.frequentActivities, option, 3),
                    }))
                  }
                  aria-pressed={selected}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <p className="kids-helper-text">자꾸 하게 되는 놀이는 아이가 편하고 즐겁게 몰입하는 장면을 찾는 데 도움이 돼요.</p>
        </section>

        <section ref={comfortRef} className="kids-card">
          <div className="kids-section-head">
            <div>
              <p className="eyebrow">STEP 4</p>
              <h2>어떨 때 더 편해?</h2>
              <p>가장 마음이 편한 방식을 하나 골라봐요.</p>
            </div>
          </div>
          <div className="kids-chip-grid">
            {KIDS_COMFORT_STYLE_OPTIONS.map((option) => {
              const selected = draft.comfortStyle === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? "kids-chip kids-chip-selected" : "kids-chip"}
                  onClick={() => setDraft((current) => ({ ...current, comfortStyle: option }))}
                  aria-pressed={selected}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <section ref={outcomesRef} className="kids-card">
          <div className="kids-section-head">
            <div>
              <p className="eyebrow">STEP 5</p>
              <h2>무엇을 만들거나 보여주는 게 좋아?</h2>
              <p>결과로 남기고 싶은 모습을 1개에서 2개 골라봐요.</p>
            </div>
            <strong>{draft.preferredOutcomeTypes.length}/2</strong>
          </div>
          <div className="kids-chip-grid">
            {KIDS_OUTCOME_TYPE_OPTIONS.map((option) => {
              const selected = draft.preferredOutcomeTypes.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? "kids-chip kids-chip-selected" : "kids-chip"}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      preferredOutcomeTypes: toggleItem(current.preferredOutcomeTypes, option, 2),
                    }))
                  }
                  aria-pressed={selected}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <section ref={proudRef} className="kids-card">
          <div className="kids-section-head">
            <div>
              <p className="eyebrow">STEP 6</p>
              <h2>최근에 스스로 뿌듯했던 순간은 언제야?</h2>
              <p>가장 마음에 남는 순간을 하나 골라봐요.</p>
            </div>
          </div>
          <div className="kids-chip-grid">
            {KIDS_PROUD_MOMENT_OPTIONS.map((option) => {
              const selected = draft.proudMomentType === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? "kids-chip kids-chip-selected" : "kids-chip"}
                  onClick={() => setDraft((current) => ({ ...current, proudMomentType: option }))}
                  aria-pressed={selected}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <section ref={freeTextRef} className="kids-card">
          <div className="kids-section-head">
            <div>
              <p className="eyebrow">STEP 7</p>
              <h2>요즘 특히 빠져 있는 건 뭐야?</h2>
              <p>선택지에 없는 것도 좋아요. 요즘 자주 말하거나 계속 하고 싶은 걸 한 줄로 적어줘요.</p>
            </div>
          </div>
          <textarea
            className="kids-textarea"
            value={draft.freeTextNote}
            onChange={(event) =>
              setDraft((current) => ({ ...current, freeTextNote: event.target.value }))
            }
            placeholder="예: 우주 책 보기, 레고 자동차 만들기, 줄넘기 연습"
            rows={3}
          />
        </section>
        </>
      ) : null}

      {!isProfileStep ? (
        <section ref={personalityStepRef} className="kids-card">
          <div className="kids-section-head">
            <div>
              <p className="eyebrow">STEP 4</p>
              <h2>나의 스타일 알아보기</h2>
              <p>{answeredCount} / {KIDS_PERSONALITY_QUESTIONS.length}</p>
            </div>
          </div>
          <div className="kids-question-list">
            {KIDS_PERSONALITY_QUESTIONS.map((question, index) => (
              <article key={question.id} className="kids-question-card">
                <div>
                  <span>Q{index + 1}</span>
                  <h3>{question.title}</h3>
                </div>
                <div className="kids-option-column">
                  {question.options.map((option) => {
                    const selected = draft.personalityAnswers[question.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={selected ? "kids-option-button kids-option-selected" : "kids-option-button"}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            personalityAnswers: {
                              ...current.personalityAnswers,
                              [question.id]: option,
                            },
                          }))
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="kids-flow-actions">
        <button
          type="button"
          className="kids-secondary-button"
          onClick={goPrev}
          disabled={isProfileStep || loading}
        >
          이전으로
        </button>
        {isProfileStep ? (
          <button
            type="button"
            className="kids-primary-button"
            onClick={goNext}
            disabled={loading}
          >
            다음으로
          </button>
        ) : (
          <button
            type="button"
            className="kids-primary-button"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "결과 만드는 중..." : "결과 보기"}
          </button>
        )}
      </div>
    </div>
  );
}
