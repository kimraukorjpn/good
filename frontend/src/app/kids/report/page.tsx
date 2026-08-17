"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { buildKidsReportFileName } from "@/components/kids/kids-report-file-name";
import { buildKidsReportPdfAssets } from "@/components/kids/kids-report-pdf";
import { KidsPrintToolbar } from "@/components/kids/kids-print-toolbar";
import { KidsResultView } from "@/components/kids/kids-result-view";
import { readKidsPrintSnapshot, readKidsResult } from "@/components/kids/kids-session";
import { KidsExperienceResult } from "@/components/kids/types";

export default function KidsReportPage() {
  const router = useRouter();
  const [result, setResult] = useState<KidsExperienceResult | null>(null);
  const [mode, setMode] = useState<"preview" | "print">("preview");
  const [embeddedPreview, setEmbeddedPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const snapshot = readKidsPrintSnapshot();
    const savedResult = snapshot?.result ?? readKidsResult();
    const params = new URLSearchParams(window.location.search);
    setMode(params.get("print") === "1" ? "print" : "preview");
    setEmbeddedPreview(params.get("preview") === "1");
    if (!savedResult) {
      router.replace("/kids/result");
      return;
    }
    setResult(savedResult);
  }, [router]);

  if (!result) return null;

  const printStyled = embeddedPreview || mode === "print";

  async function handleDownload() {
    if (!result) return;

    const target = document.getElementById("kids-report-capture");
    if (!target) {
      setError("리포트 화면을 찾지 못했어요. 다시 열어 주세요.");
      return;
    }

    setDownloading(true);
    setError("");
    try {
      const assets = await buildKidsReportPdfAssets(target);
      const nextPdfUrl = URL.createObjectURL(assets.pdfBlob);
      const anchor = document.createElement("a");
      anchor.href = nextPdfUrl;
      anchor.download = buildKidsReportFileName(result.participant_name);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(nextPdfUrl), 0);
    } catch {
      setError("PDF를 준비하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className={`kids-page kids-print-page${printStyled ? " kids-print-mode" : ""}`}>
      <section
        className={`kids-page-wrap kids-print-wrap${embeddedPreview ? " kids-print-wrap-embedded" : ""}${
          printStyled ? " kids-print-wrap-fixed" : ""
        }`}
      >
        {!embeddedPreview ? (
          <KidsPrintToolbar
            mode={mode}
            onDownload={handleDownload}
            downloading={downloading}
            onBack={mode === "preview" ? () => router.push("/kids/result") : undefined}
          />
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <div id="kids-report-capture">
          <KidsResultView result={result} />
        </div>
      </section>
    </main>
  );
}
