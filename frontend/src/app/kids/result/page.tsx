"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { KidsReportDownload } from "@/components/kids/kids-report-download";
import { KidsReportShare } from "@/components/kids/kids-report-share";
import { KidsResultView } from "@/components/kids/kids-result-view";
import { readKidsDraft, readKidsResult } from "@/components/kids/kids-session";
import { KidsDraft, KidsExperienceResult } from "@/components/kids/types";

export default function KidsResultPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<KidsDraft | null>(null);
  const [result, setResult] = useState<KidsExperienceResult | null>(null);

  useEffect(() => {
    const savedDraft = readKidsDraft();
    const savedResult = readKidsResult();
    if (!savedDraft.participantName || !savedResult) {
      router.replace("/kids");
      return;
    }
    setDraft(savedDraft);
    setResult(savedResult);
  }, [router]);

  if (!draft || !result) return null;

  return (
    <main className="kids-page">
      <section className="kids-page-wrap">
        <div id="kids-report-capture">
          <KidsResultView result={result} />
        </div>
        <div className="kids-result-actions">
          <KidsReportDownload draft={draft} result={result} captureTargetId="kids-report-capture" />
          <KidsReportShare draft={draft} result={result} />
          <Link className="kids-secondary-button" href="/kids">다시 체험하기</Link>
        </div>
      </section>
    </main>
  );
}
