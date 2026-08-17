"use client";

import { useRouter } from "next/navigation";

import { KidsIntroForm } from "@/components/kids/kids-intro-form";
import { EMPTY_KIDS_DRAFT, clearKidsResult, writeKidsDraft } from "@/components/kids/kids-session";

export default function KidsPage() {
  const router = useRouter();

  function start(participantName: string) {
    clearKidsResult();
    writeKidsDraft({ ...EMPTY_KIDS_DRAFT, participantName });
    router.push("/kids/questions");
  }

  return (
    <main className="kids-page">
      <section className="kids-page-wrap kids-page-wrap-intro">
        <div className="kids-page-hero">
          <p className="eyebrow">초등 진로 체험</p>
          <h1>나에게 어울리는 미래 직업을 찾아볼까?</h1>
          <p>좋아하는 것과 나의 스타일을 고르면 3~5개의 미래 직업을 추천해줄게요.</p>
        </div>
        <KidsIntroForm onStart={start} />
      </section>
    </main>
  );
}
