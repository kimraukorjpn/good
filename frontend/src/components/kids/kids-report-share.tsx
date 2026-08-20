"use client";

import { useEffect, useMemo, useState } from "react";

import { readKidsShareToken, writeKidsShareToken } from "@/components/kids/kids-session";
import { KidsDraft, KidsExperienceResult } from "@/components/kids/types";
import { createKidsShare } from "@/lib/api";

function buildSharedReportUrl(token: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/kids/shared/${token}`;
}

function buildQrImageUrl(sharedUrl: string) {
  const encodedUrl = encodeURIComponent(sharedUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodedUrl}`;
}

export function KidsReportShare({
  draft,
  result,
}: {
  draft: KidsDraft;
  result: KidsExperienceResult;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sharedUrl = useMemo(() => (token ? buildSharedReportUrl(token) : ""), [token]);
  const qrImageUrl = useMemo(() => (sharedUrl ? buildQrImageUrl(sharedUrl) : ""), [sharedUrl]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function ensureShareToken() {
    const savedToken = readKidsShareToken();
    if (savedToken) {
      setToken(savedToken);
      return savedToken;
    }

    setLoading(true);
    setError("");
    try {
      const response = await createKidsShare({ draft, result });
      writeKidsShareToken(response.token);
      setToken(response.token);
      return response.token;
    } catch {
      setError("QR 링크를 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
      return "";
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    setOpen(true);
    await ensureShareToken();
  }

  async function handleCopyLink() {
    if (!sharedUrl || !navigator.clipboard) return;
    await navigator.clipboard.writeText(sharedUrl);
  }

  return (
    <div className="kids-report-box">
      <button className="kids-secondary-button" type="button" onClick={handleOpen}>
        QR로 휴대폰에 가져가기
      </button>

      {open ? (
        <div
          className="kids-report-modal-backdrop"
          data-testid="kids-report-share-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="kids-report-modal kids-share-modal"
            role="dialog"
            aria-label="QR 공유하기"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="kids-report-preview-head">
              <div>
                <strong>QR 공유하기</strong>
                <p>이 QR을 휴대폰으로 찍으면 결과 리포트를 바로 다시 열 수 있어요.</p>
              </div>
              <div className="kids-report-confirm-actions">
                <button className="kids-secondary-button" type="button" onClick={() => setOpen(false)}>
                  닫기
                </button>
                <a
                  className="kids-primary-button"
                  href={sharedUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!sharedUrl}
                >
                  새 탭에서 열기
                </a>
              </div>
            </div>

            <div className="kids-report-preview kids-share-preview">
              {error ? <p className="form-error">{error}</p> : null}
              {loading ? (
                <div className="kids-report-preview-loading" aria-live="polite">
                  휴대폰에서 열 수 있는 QR 링크를 준비하고 있어요...
                </div>
              ) : sharedUrl ? (
                <div className="kids-share-panel">
                  <img
                    src={qrImageUrl}
                    alt="휴대폰으로 결과 리포트를 열 수 있는 QR 코드"
                    className="kids-share-qr-image"
                  />
                  <div className="kids-share-link-box">
                    <label htmlFor="kids-share-link">공유 링크</label>
                    <input id="kids-share-link" type="text" value={sharedUrl} readOnly />
                    <button className="kids-secondary-button" type="button" onClick={handleCopyLink}>
                      링크 복사하기
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
