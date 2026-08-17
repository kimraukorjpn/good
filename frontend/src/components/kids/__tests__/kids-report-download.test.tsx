import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KidsReportDownload } from "@/components/kids/kids-report-download";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

vi.mock("html2canvas", () => ({ default: vi.fn() }));
vi.mock("jspdf", () => ({ jsPDF: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
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
  suggested_activities: [],
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

test("opens preview first and downloads only after explicit save", async () => {
  const user = userEvent.setup();
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = 1000;
  sourceCanvas.height = 1600;

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,mock-page");

  vi.mocked(html2canvas).mockResolvedValue(sourceCanvas);

  const addImage = vi.fn();
  const addPage = vi.fn();
  const output = vi.fn(() => new Blob(["pdf"], { type: "application/pdf" }));
  vi.mocked(jsPDF).mockImplementation(
    () =>
      ({
        addImage,
        addPage,
        output,
      }) as never,
  );

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
  URL.revokeObjectURL = vi.fn();
  const appendSpy = vi.spyOn(document.body, "appendChild");
  const removeSpy = vi.spyOn(HTMLElement.prototype, "remove").mockImplementation(() => {});
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  render(
    <>
      <div id="kids-report-capture">리포트 화면</div>
      <KidsReportDownload draft={draft} result={result} captureTargetId="kids-report-capture" />
    </>,
  );

  await user.click(screen.getByRole("button", { name: "PDF 미리보기 열기" }));

  expect(screen.getByRole("dialog", { name: "PDF 미리보기" })).toBeInTheDocument();
  const preview = screen.getByAltText("진로 상담 리포트 PDF 미리보기 1페이지");
  expect(preview).toBeInTheDocument();
  expect(preview).toHaveAttribute("src", "data:image/png;base64,mock-page");
  expect(screen.getByText(/지금 보고 있는 리포트 화면을 그대로 담은 모습이에요\./)).toBeInTheDocument();
  expect(html2canvas).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "이 PDF 저장하기" }));

  expect(html2canvas).toHaveBeenCalledTimes(1);
  expect(output).toHaveBeenCalledTimes(1);
  expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  expect(appendSpy).toHaveBeenCalled();
  expect(clickSpy).toHaveBeenCalled();
  const appendedAnchor = appendSpy.mock.calls.at(-1)?.[0] as HTMLAnchorElement;
  expect(appendedAnchor.download).toBe("민지_진로리포트.pdf");

  removeSpy.mockRestore();
  appendSpy.mockRestore();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
});

test("reuses generated preview when reopening without content changes", async () => {
  const user = userEvent.setup();
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = 1000;
  sourceCanvas.height = 1600;

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,mock-page");

  vi.mocked(html2canvas).mockResolvedValue(sourceCanvas);
  vi.mocked(jsPDF).mockImplementation(
    () =>
      ({
        addImage: vi.fn(),
        addPage: vi.fn(),
        output: vi.fn(() => new Blob(["pdf"], { type: "application/pdf" })),
      }) as never,
  );

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
  URL.revokeObjectURL = vi.fn();

  render(
    <>
      <div id="kids-report-capture">리포트 화면</div>
      <KidsReportDownload draft={draft} result={result} captureTargetId="kids-report-capture" />
    </>,
  );

  await user.click(screen.getByRole("button", { name: "PDF 미리보기 열기" }));
  expect(await screen.findByRole("dialog", { name: "PDF 미리보기" })).toBeInTheDocument();
  expect(html2canvas).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "닫기" }));
  expect(screen.queryByRole("dialog", { name: "PDF 미리보기" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "PDF 미리보기 열기" }));
  expect(await screen.findByRole("dialog", { name: "PDF 미리보기" })).toBeInTheDocument();
  expect(html2canvas).toHaveBeenCalledTimes(1);

  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
});

test("closes preview on escape key and backdrop click", async () => {
  const user = userEvent.setup();
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = 1000;
  sourceCanvas.height = 1600;

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,mock-page");

  vi.mocked(html2canvas).mockResolvedValue(sourceCanvas);
  vi.mocked(jsPDF).mockImplementation(
    () =>
      ({
        addImage: vi.fn(),
        addPage: vi.fn(),
        output: vi.fn(() => new Blob(["pdf"], { type: "application/pdf" })),
      }) as never,
  );

  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => "blob:mock-pdf");
  URL.revokeObjectURL = vi.fn();

  render(
    <>
      <div id="kids-report-capture">리포트 화면</div>
      <KidsReportDownload draft={draft} result={result} captureTargetId="kids-report-capture" />
    </>,
  );

  await user.click(screen.getByRole("button", { name: "PDF 미리보기 열기" }));
  expect(await screen.findByRole("dialog", { name: "PDF 미리보기" })).toBeInTheDocument();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "PDF 미리보기" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "PDF 미리보기 열기" }));
  expect(await screen.findByRole("dialog", { name: "PDF 미리보기" })).toBeInTheDocument();

  await user.click(screen.getByTestId("kids-report-preview-backdrop"));
  expect(screen.queryByRole("dialog", { name: "PDF 미리보기" })).not.toBeInTheDocument();

  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
});
