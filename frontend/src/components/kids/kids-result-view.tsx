"use client";

import { KidsExperienceResult } from "@/components/kids/types";

const JOB_LABELS = ["가장 잘 맞는 방향", "함께 볼 수 있는 방향", "또 다른 추천 방향"] as const;

function buildJobMoment(tags: string[]) {
  if (tags.includes("만들기")) {
    return "직접 만들고 움직여 보는 순간이 즐거울 수 있어요.";
  }
  if (tags.includes("관찰하기")) {
    return "작은 변화를 자세히 살펴보는 순간이 즐거울 수 있어요.";
  }
  if (tags.includes("호기심")) {
    return "새로운 질문을 떠올리고 답을 찾는 순간이 즐거울 수 있어요.";
  }
  if (tags.includes("친구와 함께하기")) {
    return "친구와 힘을 합쳐 같이 해내는 순간이 즐거울 수 있어요.";
  }

  return "좋아하는 것을 재미있게 이어 갈 때 더 반짝일 수 있어요.";
}

export function KidsResultView({
  result,
}: {
  result: KidsExperienceResult;
}) {
  const sections = result.report_sections ?? {
    one_line_summary: `${result.participant_name}에게 잘 맞는 방향을 함께 찾고 있어요.`,
    profile_overview: result.personality_summary,
    strengths_summary: result.quick_counsel.strengths,
    home_observation_points: [],
    school_support_points: [],
    parent_message: "",
    next_talk_question: "",
    hidden_potential_fields: [],
    closing_message: "",
  };
  const reportHeadline = sections.one_line_summary;
  const profileOverview = sections.profile_overview;
  const strengthsSummary = sections.strengths_summary;
  const homeObservation = sections.home_observation_points;
  const schoolObservation = sections.school_support_points;
  const parentMessage = sections.parent_message;
  const nextTalkQuestion = sections.next_talk_question;
  const encouragement = sections.closing_message;
  const topStrengths = result.strength_keywords.slice(0, 3);
  const primaryJob = result.recommended_jobs[0]?.title ?? "직업 탐색";
  const firstActivity = result.suggested_activities[0] ?? "작은 탐색 활동 시작하기";

  return (
    <div className="kids-result-layout">
      <section className="kids-card kids-hero-card kids-report-hero kids-report-cover kids-print-section kids-print-section-hero">
        <div className="kids-report-cover-main">
          <p className="eyebrow">리포트 표지</p>
          <span className="kids-report-cover-kicker">COUNSELING REPORT</span>
          <h1>{result.participant_name}의 진로 상담 리포트</h1>
          <h2>{result.personality_type}</h2>
          <p>{result.personality_summary}</p>
          <div className="kids-report-headline">
            <strong>오늘의 상담 한 줄 총평</strong>
            <p>{reportHeadline}</p>
          </div>
          <div className="kids-report-headline kids-report-headline-soft">
            <strong>한 번 더 풀어쓴 상담 요약</strong>
            <p>
              {result.participant_name}는 {profileOverview} 그래서 지금은 {primaryJob}처럼 배우고 표현하는 경험을
              넓혀가기에 좋은 시기예요.
            </p>
          </div>
        </div>

        <aside className="kids-report-cover-side">
          <div className="kids-report-cover-panel">
            <strong>핵심 요약</strong>
            <div className="kids-report-cover-summary">
              <article>
                <span>성향 타입</span>
                <p>{result.personality_type}</p>
              </article>
              <article>
                <span>대표 추천 방향</span>
                <p>{primaryJob}</p>
              </article>
              <article>
                <span>가장 잘 보이는 강점</span>
                <p>{topStrengths.join(" · ")}</p>
              </article>
              <article>
                <span>다음에 해보면 좋은 활동</span>
                <p>{firstActivity}</p>
              </article>
            </div>
          </div>
        </aside>
      </section>

      <section className="kids-card kids-summary-card kids-print-section">
        <div className="kids-section-head">
          <div>
            <p className="eyebrow">한눈에 보기</p>
            <h2>{result.participant_name}의 반짝이는 힘</h2>
          </div>
        </div>
        <div className="kids-report-headline">
          <strong>상담 선생님이 본 전체 모습</strong>
          <p>{profileOverview}</p>
        </div>
        <div className="kids-report-headline">
          <strong>상담 선생님이 본 강점</strong>
          <p>{strengthsSummary}</p>
        </div>
        <div className="kids-summary-grid">
          <article>
            <strong>가장 잘 보이는 힘</strong>
            <p>{topStrengths.join(" · ")}</p>
          </article>
          <article>
            <strong>성향 타입</strong>
            <p>{result.personality_type}</p>
          </article>
          <article>
            <strong>가장 끌린 직업</strong>
            <p>{result.recommended_jobs[0]?.title ?? "직업 탐색"}</p>
          </article>
          <article>
            <strong>다음에 해보면 좋은 활동</strong>
            <p>{firstActivity}</p>
          </article>
        </div>
      </section>

      <section className="kids-card kids-print-section">
        <div className="kids-section-head">
          <div>
            <p className="eyebrow">추천 직업</p>
            <h2>이런 미래가 잘 어울릴 수 있어요</h2>
            <p>하나만 정답처럼 고르는 게 아니라, 잘 맞는 가능성을 여러 개 보여주는 거예요.</p>
          </div>
        </div>
        <div className="kids-recommendation-grid">
          {result.recommended_jobs.map((job, index) => {
            return (
            <article key={`${job.title}-${index}`} className="kids-job-card">
              <span>{JOB_LABELS[index] ?? `추천 방향 ${index + 1}`}</span>
              <h3>{job.title}</h3>
              <strong className="kids-job-caption">이 직업이 특히 잘 맞는 이유</strong>
              <p>{job.reason}</p>
              <div className="kids-job-moment">
                <strong>상담 선생님 한마디</strong>
                <p>{job.fit_comment}</p>
              </div>
              <div className="tag-list">
                {job.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="kids-job-moment">
                <strong>이럴 때 더 재미있어요</strong>
                <p>{buildJobMoment(job.tags)}</p>
              </div>
              <dl className="kids-job-detail-list">
                <div>
                  <dt>학교에서 이렇게 해봐요</dt>
                  <dd>{job.school_hint}</dd>
                </div>
                <div>
                  <dt>집에서는 이렇게 놀아봐요</dt>
                  <dd>{job.home_mission}</dd>
                </div>
                <div>
                  <dt>이런 친구에게 잘 어울려요</dt>
                  <dd>{job.friend_fit}</dd>
                </div>
              </dl>
            </article>
          );
          })}
        </div>
      </section>

      <section className="kids-card kids-report-plan-card kids-print-section">
        <div className="kids-section-head">
          <div>
            <p className="eyebrow">다음 활동</p>
            <h2>다음에 해보면 좋은 활동</h2>
            <p>직업 이름보다 먼저, 직접 해보는 경험이 훨씬 더 큰 힌트를 줘요.</p>
          </div>
        </div>
        <ul className="kids-activity-list">
          {result.suggested_activities.map((activity) => (
            <li key={activity}>{activity}</li>
          ))}
        </ul>
      </section>

      <section className="kids-card kids-report-note-card kids-print-section">
        <div className="kids-section-head">
          <div>
            <p className="eyebrow">상담 노트</p>
            <h2>상담 선생님 정리 노트</h2>
            <p>지금 보이는 강점과 가능성을 한눈에 읽을 수 있게 정리했어요.</p>
          </div>
        </div>
        <div className="kids-counsel-grid">
          <article className="kids-counsel-panel">
            <strong>가장 잘 맞는 이유</strong>
            <p>{result.quick_counsel.why_this_fits}</p>
          </article>
          <article className="kids-counsel-panel">
            <strong>강점이 드러난 장면</strong>
            <p>{result.quick_counsel.strengths}</p>
          </article>
          <article className="kids-counsel-panel">
            <strong>비슷한 가능성</strong>
            <p>{result.quick_counsel.alternative_jobs}</p>
          </article>
        </div>
      </section>

      <section className="kids-report-observation-grid kids-print-section">
        <article className="kids-card kids-observation-card">
          <p className="eyebrow">관찰 포인트</p>
          <h2>집에서 이렇게 지켜봐 주세요</h2>
          <strong className="kids-observation-caption">집에서 이런 순간을 살펴봐 주세요</strong>
          <ul className="kids-activity-list">
            {homeObservation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="kids-card kids-observation-card">
          <p className="eyebrow">응원 포인트</p>
          <h2>학교에서 이렇게 응원해 주세요</h2>
          <strong className="kids-observation-caption">학교에서는 이렇게 북돋아 주세요</strong>
          <ul className="kids-activity-list">
            {schoolObservation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="kids-card kids-report-bridge-card kids-print-section">
        <div className="kids-section-head">
          <div>
            <p className="eyebrow">상담 메모</p>
            <h2>앞으로 이렇게 이어가면 좋아요</h2>
          </div>
        </div>
        <div className="kids-report-bridge-grid">
          <article>
            <strong>보호자에게 전하는 메시지</strong>
            <p>{parentMessage}</p>
          </article>
          <article>
            <strong>다음 대화 질문</strong>
            <p>{nextTalkQuestion}</p>
          </article>
        </div>
      </section>

      <section className="kids-card kids-report-closing-card kids-print-section">
        <p className="eyebrow">마무리 한마디</p>
        <h2>{result.participant_name}에게 전하는 한마디</h2>
        <p>{encouragement}</p>
      </section>
    </div>
  );
}
