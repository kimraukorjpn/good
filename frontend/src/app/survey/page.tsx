"use client";

import { ArrowLeft, GraduationCap, LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileSurvey } from "@/components/profile-survey";
import { apiRequest, CurrentUser } from "@/lib/api";

export default function SurveyPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<CurrentUser>("/auth/me")
      .then(setUser)
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await apiRequest("/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (loading) return <main className="auth-loading"><LoaderCircle className="loading-icon" /><span>진로 설문을 불러오는 중</span></main>;
  if (!user) return null;

  return (
    <main className="survey-page">
      <header className="profile-header">
        <button className="survey-back" onClick={() => router.push("/")}><ArrowLeft size={17} /> 대시보드</button>
        <div className="auth-brand"><span><GraduationCap size={23} /></span><strong>길잡이</strong></div>
        <div><span>{user.full_name} 학생</span><button onClick={logout}><LogOut size={16} /> 로그아웃</button></div>
      </header>
      <div className="survey-page-wrap">
        <section className="survey-page-title">
          <p className="eyebrow">진로 탐색 · 기본정보</p>
          <h1>나를 이해하는 질문</h1>
          <p>현재 모습과 관심사를 충분히 선택해 주세요. 답변은 진로 분석과 대학·학과 추천에 사용됩니다.</p>
        </section>
        <ProfileSurvey />
      </div>
    </main>
  );
}