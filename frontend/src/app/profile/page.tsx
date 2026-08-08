"use client";

import { ArrowRight, Check, FileSearch, GraduationCap, LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiRequest, CurrentUser } from "@/lib/api";

type Profile = {
  grade: 1 | 2 | 3 | null;
  graduation_year: number | null;
  school_type: string | null;
  interests: string[];
  preferred_subjects: string[];
  career_goals: string[];
  preferred_regions: string[];
  admission_types: string[];
  survey_answers: Record<string, string[]>;
};

const emptyProfile: Profile = { grade: null, graduation_year: null, school_type: "일반고", interests: [], preferred_subjects: [], career_goals: [], preferred_regions: [], admission_types: [], survey_answers: {} };
const join = (values: string[]) => values.join(", ");
const split = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiRequest<CurrentUser>("/auth/me"), apiRequest<Profile>("/profile")])
      .then(([currentUser, currentProfile]) => { setUser(currentUser); setProfile(currentProfile); })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/profile", {
        method: "PUT",
        body: JSON.stringify({
          grade: Number(form.get("grade")), graduation_year: Number(form.get("graduationYear")), school_type: form.get("schoolType"),
          interests: split(form.get("interests")), preferred_subjects: split(form.get("subjects")), career_goals: split(form.get("careers")),
          preferred_regions: split(form.get("regions")), admission_types: split(form.get("admissionTypes")),
          survey_answers: profile.survey_answers,
        }),
      });
      router.replace("/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "프로필을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() { await apiRequest("/auth/logout", { method: "POST" }); router.replace("/login"); }
  if (loading) return <main className="auth-loading"><LoaderCircle className="loading-icon" /><span>프로필을 불러오는 중</span></main>;

  return (
    <main className="profile-page">
      <header className="profile-header"><div className="auth-brand"><span><GraduationCap size={23} /></span><strong>길잡이</strong></div><div><span>{user?.full_name} 학생</span><button onClick={logout}><LogOut size={16} /> 로그아웃</button></div></header>
      <form className="profile-form" onSubmit={submit}>
        <div className="profile-title"><span className="step-number">02</span><div><p className="eyebrow">학생 프로필</p><h1>분석에 필요한 기본 정보를 알려주세요.</h1><p>입력한 조건은 추천 범위를 정하는 데 사용되며 언제든 수정할 수 있습니다.</p></div></div>
        <section><h2>현재 학업 정보</h2><div className="form-grid three"><label>학년<select name="grade" required defaultValue={profile.grade ?? ""}><option value="" disabled>선택</option><option value="1">고등학교 1학년</option><option value="2">고등학교 2학년</option><option value="3">고등학교 3학년</option></select></label><label>졸업 예정 연도<input name="graduationYear" type="number" min="2026" max="2040" required defaultValue={profile.graduation_year ?? 2027} /></label><label>학교 유형<select name="schoolType" defaultValue={profile.school_type ?? "일반고"}><option>일반고</option><option>특목고</option><option>자율고</option><option>특성화고</option><option>기타</option></select></label></div></section>
        <section><h2>관심과 진로 방향</h2><p className="field-help">여러 항목은 쉼표로 구분해 입력하세요.</p><div className="form-grid"><label>관심 분야<input name="interests" defaultValue={join(profile.interests)} placeholder="인공지능, 환경, 심리" /></label><label>좋아하는 과목<input name="subjects" defaultValue={join(profile.preferred_subjects)} placeholder="수학, 정보, 사회" /></label><label>관심 직업·학과<input name="careers" defaultValue={join(profile.career_goals)} placeholder="데이터 분석가, 산업공학" /></label><label>희망 지역<input name="regions" defaultValue={join(profile.preferred_regions)} placeholder="서울, 경기, 대전" /></label></div></section>
        <section><h2>지원 조건</h2><label>관심 전형<input name="admissionTypes" defaultValue={join(profile.admission_types)} placeholder="학생부종합, 교과, 정시" /></label></section>
        <section className="record-link-section"><div><FileSearch size={22} /><div><h2>생기부 학업 정보</h2><p>파일에서 개인정보를 제외하고 성적, 과목별 세특과 활동을 정리합니다.</p></div></div><button type="button" onClick={() => router.push("/records")}>생기부 입력·확인 <ArrowRight size={17} /></button></section>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="profile-actions"><span><Check size={16} /> 입력 정보는 추천 근거로만 사용됩니다.</span><button className="auth-submit" disabled={saving}>{saving ? <LoaderCircle className="loading-icon" size={18} /> : <>저장하고 분석 시작 <ArrowRight size={18} /></>}</button></div>
      </form>
    </main>
  );
}