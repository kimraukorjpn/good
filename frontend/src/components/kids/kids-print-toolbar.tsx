"use client";

type KidsPrintToolbarProps = {
  mode: "preview" | "print";
  onDownload: () => void;
  downloading?: boolean;
  onBack?: () => void;
};

export function KidsPrintToolbar({
  mode,
  onDownload,
  downloading = false,
  onBack,
}: KidsPrintToolbarProps) {
  return (
    <div className="kids-print-toolbar">
      <div className="kids-print-toolbar-copy">
        <strong>출력용 리포트 미리보기</strong>
        <p>
          {mode === "print"
            ? "지금 보이는 화면 구성을 그대로 PDF로 저장할 수 있어요."
            : "화면 구성을 그대로 살펴본 뒤, 같은 모습으로 PDF 저장까지 할 수 있어요."}
        </p>
      </div>
      <div className="kids-print-toolbar-actions">
        {mode === "preview" && onBack ? (
          <button className="kids-secondary-button" type="button" onClick={onBack}>
            결과 화면으로 돌아가기
          </button>
        ) : null}
        <button className="kids-primary-button" type="button" onClick={onDownload} disabled={downloading}>
          {downloading ? "PDF 준비 중..." : "이 PDF 저장하기"}
        </button>
      </div>
    </div>
  );
}
