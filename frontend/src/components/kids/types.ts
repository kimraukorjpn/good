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

export type KidsJobRecommendation = {
  title: string;
  reason: string;
  fit_comment: string;
  tags: string[];
  school_hint: string;
  home_mission: string;
  friend_fit: string;
};

export type KidsQuickCounsel = {
  why_this_fits: string;
  strengths: string;
  alternative_jobs: string;
};

export type KidsReportSections = {
  one_line_summary: string;
  profile_overview: string;
  strengths_summary: string;
  home_observation_points: string[];
  school_support_points: string[];
  parent_message: string;
  next_talk_question: string;
  hidden_potential_fields: string[];
  closing_message: string;
};

export type KidsExperienceResult = {
  participant_name: string;
  personality_type: string;
  personality_summary: string;
  strength_keywords: string[];
  recommended_jobs: KidsJobRecommendation[];
  suggested_activities: string[];
  quick_counsel: KidsQuickCounsel;
  report_sections: KidsReportSections;
  fallback_used: boolean;
};
