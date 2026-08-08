import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "길잡이 | AI 진로·대입 동반자",
  description: "생기부 근거를 바탕으로 진로와 대입 준비를 연결합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
