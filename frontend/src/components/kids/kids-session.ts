"use client";

import { KidsDraft, KidsExperienceResult } from "@/components/kids/types";

const DRAFT_KEY = "kids-experience-draft";
const RESULT_KEY = "kids-experience-result";
const PRINT_SNAPSHOT_KEY = "kids-experience-print-snapshot";
const SHARE_TOKEN_KEY = "kids-experience-share-token";

export const EMPTY_KIDS_DRAFT: KidsDraft = {
  participantName: "",
  favoriteTopics: [],
  favoriteActivities: [],
  frequentActivities: [],
  comfortStyle: "",
  preferredOutcomeTypes: [],
  proudMomentType: "",
  freeTextNote: "",
  personalityAnswers: {},
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return { ...fallback, ...JSON.parse(value) };
  } catch {
    return fallback;
  }
}

function buildLegacyReportSections(result: Omit<KidsExperienceResult, "report_sections">) {
  const firstKeyword = result.strength_keywords[0] ?? "호기심";
  const firstJob = result.recommended_jobs[0]?.title ?? "새로운 직업";
  const firstActivity = result.suggested_activities[0] ?? "작은 탐험 활동";
  const firstSchoolHint =
    result.recommended_jobs[0]?.school_hint ?? "학교에서 작은 발표나 관찰 기록을 해보면 좋아요.";

  return {
    one_line_summary: `${result.participant_name}는 ${firstKeyword}을(를) 바탕으로 ${firstJob}처럼 배우고 만들어 가는 힘이 보여요.`,
    profile_overview: `${result.participant_name}는 좋아하는 것을 오래 붙잡고 직접 해보는 과정에서 몰입이 커지는 편이에요. 특히 ${firstKeyword}이(가) 드러날 때 가장 자신답게 반짝일 가능성이 보여요.`,
    strengths_summary: `${result.participant_name}는 좋아하는 것을 오래 붙잡고 ${result.strength_keywords.slice(0, 2).join(" · ") || "자기만의 방식"}으로 직접 해보며 배워가는 힘이 보여요.`,
    home_observation_points: [
      `${firstActivity} 같은 활동을 할 때 스스로 오래 집중하는지 지켜봐 주세요.`,
      "무엇이 재미있었는지 먼저 설명하려는지, 직접 다시 해보려는지 살펴봐 주세요.",
    ],
    school_support_points: [
      firstSchoolHint,
      "친구와 함께할 때 아이디어를 내는지, 차분히 돕는지 역할 변화를 함께 봐주면 좋아요.",
    ],
    parent_message: "결과를 정답처럼 외우게 하기보다, 오늘 가장 재미있었던 장면을 다시 이야기하도록 도와주면 좋아요.",
    next_talk_question: "다음에는 어떤 걸 직접 만들어 보고 싶은지 먼저 물어봐 주세요.",
    hidden_potential_fields: ["몰입 탐구", "창의 표현", "생활 관찰"],
    closing_message: `${result.participant_name}, 너의 ${firstKeyword}은(는) 이미 멋진 시작이야. 좋아하는 것을 계속 해보는 동안 더 잘 맞는 길이 또렷해질 거야.`,
  };
}

function normalizeKidsResult(raw: unknown): KidsExperienceResult | null {
  if (!raw || typeof raw !== "object") return null;

  const candidate = raw as Partial<KidsExperienceResult> & {
    recommended_jobs?: Array<Record<string, unknown>>;
  };

  if (!candidate.participant_name || !candidate.quick_counsel) return null;

  const recommendedJobs = (candidate.recommended_jobs ?? []).map((job) => ({
    title: String(job.title ?? ""),
    reason: String(job.reason ?? ""),
    fit_comment: String(job.fit_comment ?? `${String(job.title ?? "이 직업")}과 잘 어울리는 모습이 보여요.`),
    tags: Array.isArray(job.tags) ? job.tags.map((tag) => String(tag)) : [],
    school_hint: String(job.school_hint ?? ""),
    home_mission: String(job.home_mission ?? ""),
    friend_fit: String(job.friend_fit ?? ""),
  }));

  const baseResult = {
    participant_name: String(candidate.participant_name),
    personality_type: String(candidate.personality_type ?? ""),
    personality_summary: String(candidate.personality_summary ?? ""),
    strength_keywords: Array.isArray(candidate.strength_keywords)
      ? candidate.strength_keywords.map((keyword) => String(keyword))
      : [],
    recommended_jobs: recommendedJobs,
    suggested_activities: Array.isArray(candidate.suggested_activities)
      ? candidate.suggested_activities.map((activity) => String(activity))
      : [],
    quick_counsel: {
      why_this_fits: String(candidate.quick_counsel.why_this_fits ?? ""),
      strengths: String(candidate.quick_counsel.strengths ?? ""),
      alternative_jobs: String(candidate.quick_counsel.alternative_jobs ?? ""),
    },
    fallback_used: Boolean(candidate.fallback_used),
  };

  return {
    ...baseResult,
    report_sections:
      candidate.report_sections && typeof candidate.report_sections === "object"
        ? {
            one_line_summary: String(candidate.report_sections.one_line_summary ?? ""),
            profile_overview: String(candidate.report_sections.profile_overview ?? ""),
            strengths_summary: String(candidate.report_sections.strengths_summary ?? ""),
            home_observation_points: Array.isArray(candidate.report_sections.home_observation_points)
              ? candidate.report_sections.home_observation_points.map((item) => String(item))
              : [],
            school_support_points: Array.isArray(candidate.report_sections.school_support_points)
              ? candidate.report_sections.school_support_points.map((item) => String(item))
              : [],
            parent_message: String(candidate.report_sections.parent_message ?? ""),
            next_talk_question: String(candidate.report_sections.next_talk_question ?? ""),
            hidden_potential_fields: Array.isArray(candidate.report_sections.hidden_potential_fields)
              ? candidate.report_sections.hidden_potential_fields.map((item) => String(item))
              : [],
            closing_message: String(candidate.report_sections.closing_message ?? ""),
          }
        : buildLegacyReportSections(baseResult),
  };
}

export function readKidsDraft(): KidsDraft {
  if (typeof window === "undefined") return EMPTY_KIDS_DRAFT;
  return safeParse(window.sessionStorage.getItem(DRAFT_KEY), EMPTY_KIDS_DRAFT);
}

export function writeKidsDraft(next: KidsDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
}

export function clearKidsDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DRAFT_KEY);
}

export function readKidsResult(): KidsExperienceResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(RESULT_KEY);
  if (!raw) return null;
  try {
    return normalizeKidsResult(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeKidsResult(result: KidsExperienceResult) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function clearKidsResult() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RESULT_KEY);
}

export function writeKidsPrintSnapshot(payload: {
  draft: KidsDraft;
  result: KidsExperienceResult;
}) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRINT_SNAPSHOT_KEY, JSON.stringify(payload));
}

export function readKidsPrintSnapshot(): {
  draft: KidsDraft;
  result: KidsExperienceResult;
} | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PRINT_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { draft?: KidsDraft; result?: unknown };
    if (!parsed.draft || !parsed.result) return null;
    const normalized = normalizeKidsResult(parsed.result);
    if (!normalized) return null;
    return {
      draft: { ...EMPTY_KIDS_DRAFT, ...parsed.draft },
      result: normalized,
    };
  } catch {
    return null;
  }
}

export function readKidsShareToken(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(SHARE_TOKEN_KEY) ?? "";
}

export function writeKidsShareToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SHARE_TOKEN_KEY, token);
}

export function clearKidsShareToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SHARE_TOKEN_KEY);
}
