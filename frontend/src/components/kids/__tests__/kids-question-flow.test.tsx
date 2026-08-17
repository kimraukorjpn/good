import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KidsQuestionFlow } from "@/components/kids/kids-question-flow";
import { EMPTY_KIDS_DRAFT } from "@/components/kids/kids-session";

test("shows step 1 to 3 together on the first screen and moves only personality step next", async () => {
  const user = userEvent.setup();
  const scrollIntoView = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
  render(
    <KidsQuestionFlow initialDraft={{ ...EMPTY_KIDS_DRAFT, participantName: "민지" }} onComplete={vi.fn()} />,
  );

  expect(screen.getByRole("heading", { name: "좋아하는 주제를 골라봐!" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "어떤 활동이 즐거워?" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "요즘 특히 빠져 있는 건 뭐야?" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "요즘 자주 하거나 자꾸 손이 가는 놀이는 뭐야?" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "어떨 때 더 편해?" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "무엇을 만들거나 보여주는 게 좋아?" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "최근에 스스로 뿌듯했던 순간은 언제야?" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "나의 스타일 알아보기" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "동물" }));
  await user.click(screen.getByRole("button", { name: "우주" }));
  await user.click(screen.getByRole("button", { name: "로봇" }));
  await user.click(screen.getByRole("button", { name: "만들기" }));
  await user.click(screen.getByRole("button", { name: "관찰하기" }));
  await user.click(screen.getByRole("button", { name: "레고 만들기" }));
  await user.click(screen.getByRole("button", { name: "혼자 천천히" }));
  await user.click(screen.getByRole("button", { name: "작품 만들기" }));
  await user.click(screen.getByRole("button", { name: "내가 만든 걸 보여줬을 때" }));
  await user.type(
    screen.getByPlaceholderText("예: 우주 책 보기, 레고 자동차 만들기, 줄넘기 연습"),
    "레고 만들기",
  );
  await user.click(screen.getByRole("button", { name: "다음으로" }));

  expect(screen.getByRole("heading", { name: "나의 스타일 알아보기" })).toBeInTheDocument();
  expect(scrollIntoView).toHaveBeenCalled();
});

test("shows an error if trying to continue without enough first-page answers", async () => {
  const user = userEvent.setup();
  const scrollIntoView = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
  render(
    <KidsQuestionFlow initialDraft={{ ...EMPTY_KIDS_DRAFT, participantName: "민지" }} onComplete={vi.fn()} />,
  );

  await user.click(screen.getByRole("button", { name: "동물" }));
  await user.click(screen.getByRole("button", { name: "다음으로" }));

  expect(screen.getByText("좋아하는 주제를 3개 이상 골라줘!")).toBeInTheDocument();
  expect(scrollIntoView).toHaveBeenCalled();
});

test("requires new balanced inputs before moving to the personality step", async () => {
  const user = userEvent.setup();
  render(
    <KidsQuestionFlow initialDraft={{ ...EMPTY_KIDS_DRAFT, participantName: "민지" }} onComplete={vi.fn()} />,
  );

  await user.click(screen.getByRole("button", { name: "동물" }));
  await user.click(screen.getByRole("button", { name: "우주" }));
  await user.click(screen.getByRole("button", { name: "로봇" }));
  await user.click(screen.getByRole("button", { name: "만들기" }));
  await user.click(screen.getByRole("button", { name: "관찰하기" }));
  await user.type(
    screen.getByPlaceholderText("예: 우주 책 보기, 레고 자동차 만들기, 줄넘기 연습"),
    "레고 만들기",
  );
  await user.click(screen.getByRole("button", { name: "다음으로" }));

  expect(screen.getByText("요즘 자주 하는 놀이·활동도 골라주면 더 잘 맞는 결과를 만들 수 있어요!")).toBeInTheDocument();
});
