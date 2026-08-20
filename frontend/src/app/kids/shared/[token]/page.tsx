"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { KidsReportDownload } from "@/components/kids/kids-report-download";
import { KidsResultView } from "@/components/kids/kids-result-view";
import { KidsDraft, KidsExperienceResult } from "@/components/kids/types";
import { fetchKidsShare } from "@/lib/api";

function mapSharedDraftToClientDraft(sharedDraft: {
  participant_name: string;
  favorite_topics: string[];
  favorite_activities: string[];
  frequent_activities: string[];
  comfort_style: string;
  preferred_outcome_types: string[];
  proud_moment_type: string;
  free_text_note: string;
  personality_answers: Record<string, string>;
}): KidsDraft {
  return {
    participantName: sharedDraft.participant_name,
    favoriteTopics: sharedDraft.favorite_topics,
    favoriteActivities: sharedDraft.favorite_activities,
    frequentActivities: sharedDraft.frequent_activities,
    comfortStyle: sharedDraft.comfort_style,
    preferredOutcomeTypes: sharedDraft.preferred_outcome_types,
    proudMomentType: sharedDraft.proud_moment_type,
    freeTextNote: sharedDraft.free_text_note,
    personalityAnswers: sharedDraft.personality_answers,
  };
}

export default function SharedKidsResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [draft, setDraft] = useState<KidsDraft | null>(null);
  const [result, setResult] = useState<KidsExperienceResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSharedReport() {
      try {
        const resolved = await params;
        const response = await fetchKidsShare(resolved.token);
        if (!active) return;
        setDraft(mapSharedDraftToClientDraft(response.draft));
        setResult(response.result);
      } catch {
        if (!active) return;
        setError("공유된 리포트를 찾지 못했어요. QR을 다시 찍거나 새 링크를 받아 주세요.");
      }
    }

    void loadSharedReport();

    return () => {
      active = false;
    };
  }, [params]);

  return (
    <main className="kids-page">
      <section className="kids-page-wrap">
        {error ? (
          <div className="kids-card kids-empty-state">
            <h1>공유 리포트를 열지 못했어요</h1>
            <p>{error}</p>
            <Link className="kids-primary-button" href="/kids">
              진로 체험 시작하기
            </Link>
          </div>
        ) : null}

        {draft && result ? (
          <>
            <div id="kids-shared-report-capture">
              <KidsResultView result={result} />
            </div>
            <div className="kids-result-actions">
              <KidsReportDownload
                draft={draft}
                result={result}
                captureTargetId="kids-shared-report-capture"
              />
              <Link className="kids-secondary-button" href="/kids">
                나도 체험해보기
              </Link>
            </div>
          </>
        ) : null}

        {!error && !draft && !result ? (
          <div className="kids-card kids-empty-state">
            <h1>리포트를 불러오는 중이에요</h1>
            <p>잠시만 기다리면 공유된 결과를 바로 보여드릴게요.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
