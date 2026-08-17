import {
  clearKidsResult,
  readKidsDraft,
  readKidsResult,
  writeKidsResult,
} from "@/components/kids/kids-session";

beforeEach(() => {
  window.sessionStorage.clear();
});

test("hydrates legacy stored result with default report sections", () => {
  window.sessionStorage.setItem(
    "kids-experience-result",
    JSON.stringify({
      participant_name: "민지",
      personality_type: "상상력 발명가",
      personality_summary: "새로운 생각을 떠올리고 직접 만들어보는 걸 좋아하는 스타일이에요.",
      strength_keywords: ["상상력", "도전정신", "배려심"],
      recommended_jobs: [
        {
          title: "동물 수의사",
          reason: "동물을 좋아하고 자세히 관찰하는 힘이 보여요.",
          tags: ["동물", "관찰하기"],
          school_hint: "학교에서는 동물 관찰 일지를 써보면 좋아요.",
          home_mission: "집에서는 좋아하는 동물을 소개하는 카드를 만들어봐요.",
          friend_fit: "동물을 아끼고 차분히 살피는 친구에게 잘 어울려요.",
        },
      ],
      suggested_activities: ["동물 도감 만들기"],
      quick_counsel: {
        why_this_fits: "좋아하는 주제와 활동이 추천 직업과 자연스럽게 이어져요.",
        strengths: "상상력과 도전정신이 큰 강점이에요.",
        alternative_jobs: "비슷한 직업으로 생태 해설가도 있어요.",
      },
      fallback_used: true,
    }),
  );

  const result = readKidsResult();

  expect(result?.report_sections.one_line_summary).toContain("민지");
  expect(result?.report_sections.profile_overview).toContain("민지");
  expect(result?.report_sections.strengths_summary).toContain("상상력");
  expect(result?.report_sections.parent_message).toBeTruthy();
  expect(result?.report_sections.hidden_potential_fields.length).toBeGreaterThanOrEqual(2);
  expect(result?.recommended_jobs[0].fit_comment).toBeTruthy();
});

test("writes and reads expanded draft fields", () => {
  window.sessionStorage.setItem(
    "kids-experience-draft",
    JSON.stringify({
      participantName: "민지",
      favoriteTopics: ["동물", "우주", "로봇"],
      favoriteActivities: ["만들기", "관찰하기"],
      frequentActivities: ["레고 만들기"],
      comfortStyle: "혼자 천천히",
      preferredOutcomeTypes: ["작품 만들기"],
      proudMomentType: "내가 만든 걸 보여줬을 때",
      freeTextNote: "레고 만들기",
      personalityAnswers: {},
    }),
  );

  const draft = readKidsDraft();

  expect(draft.frequentActivities).toEqual(["레고 만들기"]);
  expect(draft.comfortStyle).toBe("혼자 천천히");
  expect(draft.preferredOutcomeTypes).toEqual(["작품 만들기"]);
  expect(draft.proudMomentType).toBe("내가 만든 걸 보여줬을 때");
});

test("writes and reads current result shape", () => {
  writeKidsResult({
    participant_name: "민지",
    personality_type: "상상력 발명가",
    personality_summary: "새로운 생각을 떠올리고 직접 만들어보는 걸 좋아하는 스타일이에요.",
    strength_keywords: ["상상력", "도전정신", "배려심"],
    recommended_jobs: [
      {
        title: "동물 수의사",
        reason: "동물을 좋아하고 자세히 관찰하는 힘이 보여요.",
        fit_comment: "동물을 세심하게 살피는 민지의 모습이 잘 드러나요.",
        tags: ["동물", "관찰하기"],
        school_hint: "학교에서는 동물 관찰 일지를 써보면 좋아요.",
        home_mission: "집에서는 좋아하는 동물을 소개하는 카드를 만들어봐요.",
        friend_fit: "동물을 아끼고 차분히 살피는 친구에게 잘 어울려요.",
      },
    ],
    suggested_activities: ["동물 도감 만들기"],
    quick_counsel: {
      why_this_fits: "좋아하는 주제와 활동이 추천 직업과 자연스럽게 이어져요.",
      strengths: "상상력과 도전정신이 큰 강점이에요.",
      alternative_jobs: "비슷한 직업으로 생태 해설가도 있어요.",
    },
    report_sections: {
      one_line_summary: "민지는 상상력과 관찰력을 바탕으로 탐험형 배움이 잘 맞아요.",
      profile_overview: "민지는 좋아하는 것을 오래 붙잡고 직접 해보는 과정에서 몰입이 커지는 편이에요.",
      strengths_summary: "좋아하는 것을 오래 붙잡고 직접 해보는 힘이 보여요.",
      home_observation_points: ["오래 집중하는지 지켜봐 주세요.", "재미있었던 장면을 다시 말하는지 봐 주세요."],
      school_support_points: ["학교에서 관찰 기록을 해보면 좋아요.", "친구와 함께 역할을 나눠보면 좋아요."],
      parent_message: "오늘 재미있었던 장면을 먼저 물어봐 주세요.",
      next_talk_question: "다음에는 무엇을 직접 만들어 보고 싶은지 물어봐 주세요.",
      hidden_potential_fields: ["몰입 탐구", "창의 표현", "생활 관찰"],
      closing_message: "민지야, 좋아하는 것을 계속 해보면 더 잘 맞는 길이 보일 거야.",
    },
    fallback_used: false,
  });

  const result = readKidsResult();

  expect(result?.report_sections.next_talk_question).toContain("다음에는");
  clearKidsResult();
  expect(readKidsResult()).toBeNull();
});
