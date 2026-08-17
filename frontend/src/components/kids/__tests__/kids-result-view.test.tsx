import { render, screen } from "@testing-library/react";
import { KidsResultView } from "@/components/kids/kids-result-view";

const sampleResult = {
  participant_name: "민지",
  personality_type: "상상력 발명가",
  personality_summary: "새로운 생각을 떠올리고 직접 만들어보는 걸 좋아하는 스타일이에요.",
  strength_keywords: ["상상력", "도전정신", "배려심"],
  recommended_jobs: [
    {
      title: "동물 수의사",
      reason: "동물을 좋아하고 자세히 관찰하는 힘이 보여요.",
      fit_comment: "동물을 세심하게 살피는 민지의 모습이 이 직업과 특히 닮아 있어요.",
      tags: ["동물", "관찰하기"],
      school_hint: "학교에서는 동물 관찰 일지를 써보면 좋아요.",
      home_mission: "집에서는 좋아하는 동물을 소개하는 카드를 만들어봐요.",
      friend_fit: "동물을 아끼고 차분히 살피는 친구에게 잘 어울려요.",
    },
    {
      title: "우주 과학자",
      reason: "우주를 향한 큰 호기심이 잘 어울려요.",
      fit_comment: "궁금한 것을 그냥 지나치지 않는 민지의 성향이 우주 탐험과 잘 어울려요.",
      tags: ["우주", "호기심"],
      school_hint: "학교에서는 우주 주제 발표를 해보면 좋아요.",
      home_mission: "집에서는 별자리 그림을 그려봐요.",
      friend_fit: "궁금한 것이 생기면 끝까지 찾아보는 친구에게 잘 어울려요.",
    },
    {
      title: "로봇 발명가",
      reason: "직접 만들고 실험하는 걸 좋아해서 잘 맞아요.",
      fit_comment: "생각한 것을 손으로 만들어보는 민지의 즐거움이 로봇 발명과 이어질 수 있어요.",
      tags: ["로봇", "만들기"],
      school_hint: "학교에서는 만들기 활동 시간에 아이디어를 내보면 좋아요.",
      home_mission: "집에서는 레고나 종이로 움직이는 것을 만들어봐요.",
      friend_fit: "손으로 직접 만들고 고치는 걸 좋아하는 친구에게 잘 어울려요.",
    },
  ],
  suggested_activities: ["동물 도감 만들기", "우주 그림일기 쓰기", "레고 로봇 만들기"],
  quick_counsel: {
    why_this_fits: "좋아하는 주제와 활동이 추천 직업과 자연스럽게 이어져요.",
    strengths: "상상력과 도전정신이 큰 강점이에요.",
    alternative_jobs: "비슷한 직업으로 생태 해설가도 있어요.",
  },
  report_sections: {
    one_line_summary: "민지는 상상력과 관찰력을 바탕으로 동물과 로봇을 연결하는 탐험형 배움이 잘 맞아요.",
    profile_overview: "민지는 좋아하는 주제를 오래 붙잡고, 직접 만들어 보거나 자세히 살피는 과정에서 몰입이 커지는 편이에요. 새로운 생각이 떠오르면 바로 해보고 싶어 하는 힘도 함께 보여요.",
    strengths_summary: "민지는 좋아하는 것을 오래 붙잡고, 떠오른 생각을 직접 해보며 배워가는 힘이 보여요.",
    home_observation_points: [
      "레고나 만들기 활동을 할 때 얼마나 오래 몰입하는지 지켜봐 주세요.",
      "무엇이 재미있었는지 먼저 설명하는지 살펴봐 주세요.",
    ],
    school_support_points: [
      "학교에서는 관찰 기록이나 발표 활동으로 자신감을 키워주면 좋아요.",
      "친구와 함께하는 프로젝트에서 어떤 역할을 편해하는지 봐주면 좋아요.",
    ],
    parent_message: "부모님은 결과를 정답처럼 묻기보다, 오늘 가장 재미있었던 장면을 다시 물어봐 주시면 좋아요.",
    next_talk_question: "다음에는 동물, 우주, 로봇 중 어떤 걸 직접 만들어 보고 싶은지 이야기해 보세요.",
    hidden_potential_fields: ["생명 관찰", "창의 발명", "과학 스토리텔링"],
    closing_message: "민지야, 좋아하는 것을 계속 해보는 동안 너에게 잘 맞는 길이 더 또렷해질 거야.",
  },
  fallback_used: true,
};

test("renders playful guidance copy for recommended jobs", () => {
  render(<KidsResultView result={sampleResult} />);

  expect(screen.getByText("민지의 반짝이는 힘")).toBeInTheDocument();
  expect(screen.getAllByText("다음에 해보면 좋은 활동").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText("가장 잘 맞는 방향")).toBeInTheDocument();
  expect(screen.getAllByText("이 직업이 특히 잘 맞는 이유")).toHaveLength(3);
  expect(screen.getAllByText("상담 선생님 한마디")).toHaveLength(3);
  expect(screen.getByText(/직접 만들고 움직여 보는 순간이 즐거울 수 있어요\./)).toBeInTheDocument();
  expect(screen.getAllByText("학교에서 이렇게 해봐요")).toHaveLength(3);
  expect(screen.getAllByText("집에서는 이렇게 놀아봐요")).toHaveLength(3);
  expect(screen.getAllByText("이런 친구에게 잘 어울려요")).toHaveLength(3);
});

test("renders counseling report style sections", () => {
  render(<KidsResultView result={sampleResult} />);

  expect(screen.getByText("민지의 진로 상담 리포트")).toBeInTheDocument();
  expect(screen.getByText("리포트 표지")).toBeInTheDocument();
  expect(screen.getByText("핵심 요약")).toBeInTheDocument();
  expect(screen.getByText("오늘의 상담 한 줄 총평")).toBeInTheDocument();
  expect(screen.getByText("대표 추천 방향")).toBeInTheDocument();
  expect(screen.getAllByText("동물 수의사").length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText("민지는 상상력과 관찰력을 바탕으로 동물과 로봇을 연결하는 탐험형 배움이 잘 맞아요.")).toBeInTheDocument();
  expect(screen.getByText("민지는 좋아하는 주제를 오래 붙잡고, 직접 만들어 보거나 자세히 살피는 과정에서 몰입이 커지는 편이에요. 새로운 생각이 떠오르면 바로 해보고 싶어 하는 힘도 함께 보여요.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "다음에 해보면 좋은 활동" })).toBeInTheDocument();
  expect(screen.getByText("상담 선생님 정리 노트")).toBeInTheDocument();
  expect(screen.getByText("가장 잘 맞는 이유")).toBeInTheDocument();
  expect(screen.getByText("강점이 드러난 장면")).toBeInTheDocument();
  expect(screen.getByText("비슷한 가능성")).toBeInTheDocument();
  expect(screen.getByText("좋아하는 주제와 활동이 추천 직업과 자연스럽게 이어져요.")).toBeInTheDocument();
  expect(screen.getByText("민지는 좋아하는 것을 오래 붙잡고, 떠오른 생각을 직접 해보며 배워가는 힘이 보여요.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "앞으로 이렇게 이어가면 좋아요" })).toBeInTheDocument();
  expect(screen.getByText("집에서 이렇게 지켜봐 주세요")).toBeInTheDocument();
  expect(screen.getByText("학교에서 이렇게 응원해 주세요")).toBeInTheDocument();
  expect(screen.getByText("보호자에게 전하는 메시지")).toBeInTheDocument();
  expect(screen.getByText("다음 대화 질문")).toBeInTheDocument();
  expect(screen.getByText("집에서 이런 순간을 살펴봐 주세요")).toBeInTheDocument();
  expect(screen.getByText("학교에서는 이렇게 북돋아 주세요")).toBeInTheDocument();
  expect(screen.getByText("민지에게 전하는 한마디")).toBeInTheDocument();
  expect(screen.queryByText("지금은 체험용 예시 결과를 보여주고 있어요.")).not.toBeInTheDocument();
  expect(screen.queryByText("대표 키워드")).not.toBeInTheDocument();
  expect(screen.queryByText("숨은 가능성 분야")).not.toBeInTheDocument();
});
