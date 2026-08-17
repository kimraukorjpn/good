import type { KidsExperienceResult } from "@/components/kids/types";

export type CurrentUser = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  profile_completed: boolean;
  grade: 1 | 2 | 3 | null;
};

export type KidsDraftPayload = {
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

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`/backend-api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallbackMessage = response.status >= 500
      ? "서버 연결이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
      : "요청을 처리하지 못했습니다.";
    throw new ApiError(data.detail ?? fallbackMessage, response.status);
  }
  return data as T;
}

export async function analyzeKidsExperience(
  draft: KidsDraftPayload,
): Promise<KidsExperienceResult> {
  return apiRequest<KidsExperienceResult>("/kids-experience/analyze", {
    method: "POST",
    body: JSON.stringify({
      participant_name: draft.participantName,
      favorite_topics: draft.favoriteTopics,
      favorite_activities: draft.favoriteActivities,
      frequent_activities: draft.frequentActivities,
      comfort_style: draft.comfortStyle,
      preferred_outcome_types: draft.preferredOutcomeTypes,
      proud_moment_type: draft.proudMomentType,
      free_text_note: draft.freeTextNote,
      personality_answers: draft.personalityAnswers,
    }),
  });
}

export async function downloadKidsReport(payload: {
  draft: KidsDraftPayload;
  result: KidsExperienceResult;
}): Promise<Blob> {
  const response = await fetch("/backend-api/kids-experience/report", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draft: {
        participant_name: payload.draft.participantName,
        favorite_topics: payload.draft.favoriteTopics,
        favorite_activities: payload.draft.favoriteActivities,
        frequent_activities: payload.draft.frequentActivities,
        comfort_style: payload.draft.comfortStyle,
        preferred_outcome_types: payload.draft.preferredOutcomeTypes,
        proud_moment_type: payload.draft.proudMomentType,
        free_text_note: payload.draft.freeTextNote,
        personality_answers: payload.draft.personalityAnswers,
      },
      result: payload.result,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data.detail ?? "리포트를 만들지 못했습니다.", response.status);
  }

  return response.blob();
}
