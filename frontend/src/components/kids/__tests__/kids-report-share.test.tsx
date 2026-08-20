import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KidsReportShare } from "@/components/kids/kids-report-share";
import { createKidsShare } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  createKidsShare: vi.fn(async () => ({ token: "share-token-123" })),
}));

beforeEach(() => {
  window.sessionStorage.clear();
  vi.clearAllMocks();
  vi.mocked(createKidsShare).mockResolvedValue({ token: "share-token-123" });
});

const draft = {
  participantName: "민지",
  favoriteTopics: ["동물", "우주", "로봇"],
  favoriteActivities: ["만들기", "관찰하기"],
  frequentActivities: ["레고 만들기"],
  comfortStyle: "혼자 천천히",
  preferredOutcomeTypes: ["작품 만들기"],
  proudMomentType: "내가 만든 걸 보여줬을 때",
  freeTextNote: "레고 만들기",
  personalityAnswers: {},
};

const result = {
  participant_name: "민지",
  personality_type: "상상력 발명가",
  personality_summary: "새로운 생각을 떠올리고 직접 만들어보는 걸 좋아하는 스타일이에요.",
  strength_keywords: ["상상력", "도전정신", "배려심"],
  recommended_jobs: [],
  suggested_activities: ["동물 도감 만들기"],
  quick_counsel: {
    why_this_fits: "좋아하는 주제와 활동이 추천 직업과 자연스럽게 이어져요.",
    strengths: "상상력과 도전정신이 큰 강점이에요.",
    alternative_jobs: "비슷한 직업으로 생태 해설가도 있어요.",
  },
  report_sections: {
    one_line_summary: "민지는 상상력과 관찰력을 바탕으로 동물과 로봇을 연결하는 탐험형 배움이 잘 맞아요.",
    profile_overview: "민지는 좋아하는 주제를 오래 붙잡고 직접 해보는 과정에서 몰입이 커지는 편이에요.",
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
  fallback_used: false,
};

test("opens QR share modal and shows reusable shared link", async () => {
  const user = userEvent.setup();

  render(<KidsReportShare draft={draft} result={result} />);

  await user.click(screen.getByRole("button", { name: "QR로 휴대폰에 가져가기" }));

  expect(await screen.findByRole("dialog", { name: "QR 공유하기" })).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByDisplayValue("http://localhost:3000/kids/shared/share-token-123")).toBeInTheDocument();
  });
  const qrImage = screen.getByAltText("휴대폰으로 결과 리포트를 열 수 있는 QR 코드");
  expect(qrImage).toHaveAttribute(
    "src",
    expect.stringContaining(encodeURIComponent("http://localhost:3000/kids/shared/share-token-123")),
  );
});

test("creates a new share token when the report content changes", async () => {
  const user = userEvent.setup();
  const createKidsShareMock = vi.mocked(createKidsShare);
  createKidsShareMock
    .mockResolvedValueOnce({ token: "share-token-aaa" })
    .mockResolvedValueOnce({ token: "share-token-bbb" });

  const firstResult = {
    ...result,
    participant_name: "민지",
  };

  const secondResult = {
    ...result,
    participant_name: "준호",
  };

  const { rerender } = render(<KidsReportShare draft={draft} result={firstResult} />);

  await user.click(screen.getByRole("button", { name: "QR로 휴대폰에 가져가기" }));

  await waitFor(() => {
    expect(screen.getByDisplayValue("http://localhost:3000/kids/shared/share-token-aaa")).toBeInTheDocument();
  });

  await user.click(screen.getByRole("button", { name: "닫기" }));

  rerender(<KidsReportShare draft={{ ...draft, participantName: "준호" }} result={secondResult} />);

  await user.click(screen.getByRole("button", { name: "QR로 휴대폰에 가져가기" }));

  await waitFor(() => {
    expect(screen.getByDisplayValue("http://localhost:3000/kids/shared/share-token-bbb")).toBeInTheDocument();
  });

  expect(createKidsShareMock).toHaveBeenCalledTimes(2);
});
