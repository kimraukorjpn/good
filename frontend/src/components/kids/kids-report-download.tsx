"use client";

import { useEffect, useMemo, useState } from "react";

import { buildKidsReportFileName } from "@/components/kids/kids-report-file-name";
import { buildKidsReportPdfAssets } from "@/components/kids/kids-report-pdf";
import { writeKidsPrintSnapshot } from "@/components/kids/kids-session";
import { KidsDraft, KidsExperienceResult } from "@/components/kids/types";

export function KidsReportDownload({
  draft,
  result,
  captureTargetId,
}: {
  draft: KidsDraft;
  result: KidsExperienceResult;
  captureTargetId: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cachedSignature, setCachedSignature] = useState("");

  const contentSignature = useMemo(
    () => JSON.stringify({ draft, result, captureTargetId }),
    [draft, result, captureTargetId],
  );

  useEffect(() => {
    if (!previewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewOpen]);

  useEffect(() => {
    if (!previewOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewOpen]);

  useEffect(() => {
    writeKidsPrintSnapshot({ draft, result });
  }, [draft, result]);

  useEffect(() => {
    if (cachedSignature === contentSignature) return;

    setPageImages([]);
    setPdfUrl((current) => {
      if (current && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setCachedSignature("");
  }, [cachedSignature, contentSignature]);

  useEffect(() => {
    return () => {
      if (pdfUrl && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  async function ensureAssets() {
    if (pdfUrl && pageImages.length > 0 && cachedSignature === contentSignature) {
      return { pdfUrl, pageImages };
    }

    const target = document.getElementById(captureTargetId);
    if (!target) {
      setError("리포트 화면을 찾지 못했어요. 화면을 새로고침한 뒤 다시 시도해 주세요.");
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const assets = await buildKidsReportPdfAssets(target);
      const nextPdfUrl = URL.createObjectURL(assets.pdfBlob);

      setPdfUrl((current) => {
        if (current && typeof URL.revokeObjectURL === "function") {
          URL.revokeObjectURL(current);
        }
        return nextPdfUrl;
      });
      setPageImages(assets.pageImages);
      setCachedSignature(contentSignature);

      return {
        pdfUrl: nextPdfUrl,
        pageImages: assets.pageImages,
      };
    } catch (nextError) {
      setError("리포트 화면을 PDF로 정리하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenPreview() {
    writeKidsPrintSnapshot({ draft, result });
    setPreviewOpen(true);
    await ensureAssets();
  }

  async function handleDownloadPdf() {
    const assets = await ensureAssets();
    if (!assets) return;

    const anchor = document.createElement("a");
    anchor.href = assets.pdfUrl;
    anchor.download = buildKidsReportFileName(result.participant_name);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function closePreview() {
    setPreviewOpen(false);
  }

  return (
    <div className="kids-report-box">
      <button className="kids-primary-button" type="button" onClick={handleOpenPreview}>
        PDF 미리보기 열기
      </button>
      {previewOpen ? (
        <div
          className="kids-report-modal-backdrop"
          data-testid="kids-report-preview-backdrop"
          onClick={closePreview}
        >
          <div
            className="kids-report-modal"
            role="dialog"
            aria-label="PDF 미리보기"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="kids-report-preview-head">
              <div>
                <strong>PDF 미리보기</strong>
                <p>
                  {pageImages.length > 0
                    ? `${pageImages.length}페이지 미리보기를 준비했어요. 지금 보고 있는 리포트 화면을 그대로 담은 모습이에요.`
                    : "지금 보고 있는 리포트 화면을 그대로 담은 모습으로 준비하고 있어요."}
                </p>
              </div>
              <div className="kids-report-confirm-actions">
                <button className="kids-secondary-button" type="button" onClick={closePreview}>
                  닫기
                </button>
                <button className="kids-primary-button" type="button" onClick={handleDownloadPdf} disabled={loading}>
                  {loading ? "PDF 준비 중..." : "이 PDF 저장하기"}
                </button>
              </div>
            </div>
            <div className="kids-report-preview">
              {error ? <p className="form-error">{error}</p> : null}
              {pageImages.length > 0 ? (
                <div className="kids-report-preview-pages">
                  {pageImages.map((pageImage, index) => (
                    <img
                      key={`${index + 1}-${pageImage.slice(0, 24)}`}
                      src={pageImage}
                      alt={`진로 상담 리포트 PDF 미리보기 ${index + 1}페이지`}
                      className="kids-report-preview-page-image"
                    />
                  ))}
                </div>
              ) : (
                <div className="kids-report-preview-loading" aria-live="polite">
                  {loading ? "리포트 화면을 그대로 PDF로 정리하고 있어요..." : "미리보기를 불러오고 있어요..."}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
