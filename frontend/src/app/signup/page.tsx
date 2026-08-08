"use client";

import { ArrowRight, Check, GraduationCap, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiRequest } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== form.get("passwordConfirm")) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      setLoading(false);
      return;
    }
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ full_name: form.get("fullName"), email: form.get("email"), password }),
      });
      router.replace("/profile");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro signup-intro">
        <Link className="auth-brand" href="/"><span><GraduationCap size={24} /></span><strong>길잡이</strong></Link>
        <div><p className="eyebrow">근거 있는 진로 탐색</p><h1>학년마다 다른 고민을<br />한 흐름으로 연결합니다.</h1><ul><li><Check size={17} /> 생기부 활동과 추천 이유 연결</li><li><Check size={17} /> 진로 적합도와 지원 조건 분리</li><li><Check size={17} /> 실제 경험만 사용하는 이야기 초안</li></ul></div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div><p className="eyebrow">첫 번째 단계</p><h2>회원가입</h2><span>계정을 만든 뒤 학생 프로필을 입력합니다.</span></div>
          <label>이름<input name="fullName" autoComplete="name" required minLength={2} placeholder="이름을 입력하세요" /></label>
          <label>이메일<input name="email" type="email" autoComplete="email" required placeholder="student@example.com" /></label>
          <label>비밀번호<input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="영문과 숫자를 포함해 8자 이상" /></label>
          <label>비밀번호 확인<input name="passwordConfirm" type="password" autoComplete="new-password" required minLength={8} placeholder="비밀번호를 다시 입력하세요" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={loading}>{loading ? <LoaderCircle className="loading-icon" size={18} /> : <>계정 만들기 <ArrowRight size={18} /></>}</button>
          <p className="auth-switch">이미 계정이 있나요? <Link href="/login">로그인</Link></p>
        </form>
      </section>
    </main>
  );
}