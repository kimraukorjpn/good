import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KidsPrintToolbar } from "@/components/kids/kids-print-toolbar";

test("renders preview toolbar actions", async () => {
  const user = userEvent.setup();
  const downloadSpy = vi.fn();
  const backSpy = vi.fn();

  render(<KidsPrintToolbar mode="preview" onDownload={downloadSpy} onBack={backSpy} />);

  expect(screen.getByText("출력용 리포트 미리보기")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "이 PDF 저장하기" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "결과 화면으로 돌아가기" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "이 PDF 저장하기" }));
  await user.click(screen.getByRole("button", { name: "결과 화면으로 돌아가기" }));

  expect(downloadSpy).toHaveBeenCalledTimes(1);
  expect(backSpy).toHaveBeenCalledTimes(1);
});

test("renders print mode helper copy without back button", () => {
  render(<KidsPrintToolbar mode="print" onDownload={vi.fn()} />);

  expect(screen.getByText("출력용 리포트 미리보기")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "이 PDF 저장하기" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "결과 화면으로 돌아가기" })).not.toBeInTheDocument();
});
