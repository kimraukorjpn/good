import { render, screen } from "@testing-library/react";

import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

test("renders the kids experience entry card on the home page", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }),
  );

  render(<Home />);

  expect(
    await screen.findByRole("link", { name: "초등 진로 체험 시작하기" }),
  ).toHaveAttribute("href", "/kids");
});
