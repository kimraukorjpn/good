import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KidsIntroForm } from "@/components/kids/kids-intro-form";

test("submits the participant name when the start button is clicked", async () => {
  const user = userEvent.setup();
  const onStart = vi.fn();

  render(<KidsIntroForm onStart={onStart} />);

  await user.type(screen.getByLabelText("이름 또는 별명"), "민지");
  await user.click(screen.getByRole("button", { name: "시작하기" }));

  expect(onStart).toHaveBeenCalledWith("민지");
});

test("renders warmer intro copy and updated placeholder", () => {
  render(<KidsIntroForm onStart={vi.fn()} />);

  expect(screen.getByText("이름을 알려주면 더 다정하게 불러주고, 리포트도 더 자연스럽게 만들어줄 수 있어요.")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("예: 홍길동, 하늘이")).toBeInTheDocument();
});
