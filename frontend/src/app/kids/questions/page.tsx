"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { KidsQuestionFlow } from "@/components/kids/kids-question-flow";
import { readKidsDraft, writeKidsDraft, writeKidsResult } from "@/components/kids/kids-session";
import { KidsDraft } from "@/components/kids/types";
import { analyzeKidsExperience } from "@/lib/api";

export default function KidsQuestionsPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<KidsDraft | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = readKidsDraft();
    if (!saved.participantName) {
      router.replace("/kids");
      return;
    }
    setDraft(saved);
  }, [router]);

  async function handleComplete(nextDraft: KidsDraft) {
    setLoading(true);
    try {
      writeKidsDraft(nextDraft);
      const result = await analyzeKidsExperience(nextDraft);
      writeKidsResult(result);
      router.push("/kids/result");
    } finally {
      setLoading(false);
    }
  }

  if (!draft) return null;

  return (
    <main className="kids-page">
      <section className="kids-page-wrap">
        <div className="kids-page-hero">
          <p className="eyebrow">질문에 답해봐요</p>
          <h1>{draft.participantName}의 스타일 알아보기</h1>
          <p>천천히 골라도 괜찮아요. 정답은 없고, 지금 가장 마음에 가까운 답이면 돼요.</p>
        </div>
        <KidsQuestionFlow initialDraft={draft} onComplete={handleComplete} loading={loading} />
      </section>
    </main>
  );
}
