"use client";

import { ArrowRight, GraduationCap, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiRequest, CurrentUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const user = await apiRequest<CurrentUser>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      router.replace(user.profile_completed ? "/" : "/profile");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link className="auth-brand" href="/"><span><GraduationCap size={24} /></span><strong>길잡이</strong></Link>
        <div><p className="eyebrow">AI 진로·대입 동반자</p><h1>기록에서 발견한 가능성을<br />나만의 방향으로 이어가세요.</h1><p>추천과 자기소개에 사용된 근거를 직접 확인하며 준비할 수 있습니다.</p></div>
        <small>학생의 기록은 기본 비공개로 관리됩니다.</small>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div><p className="eyebrow">다시 만나 반가워요</p><h2>로그인</h2><span>저장한 분석과 추천 결과를 이어서 확인하세요.</span></div>
          <label>이메일<input name="email" type="email" autoComplete="email" required placeholder="student@example.com" /></label>
          <label>비밀번호<input name="password" type="password" autoComplete="current-password" required placeholder="비밀번호를 입력하세요" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={loading}>{loading ? <LoaderCircle className="loading-icon" size={18} /> : <>로그인 <ArrowRight size={18} /></>}</button>
          <p className="auth-switch">처음 방문했나요? <Link href="/signup">회원가입</Link></p>
        </form>
      </section>
    </main>
  );
}