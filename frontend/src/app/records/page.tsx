"use client";

import { ArrowLeft, BookOpenText, CheckCircle2, FileImage, FileText, GraduationCap, LoaderCircle, LogOut, RefreshCw, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import { apiRequest, ApiError, CurrentUser } from "@/lib/api";

type SubjectRecord = { subject: string; grade_or_achievement: string; details: string };
type SchoolRecordItem = { school_year: string; semester: string; title: string; value: string; details: string };
type AcademicRecord = {
  summary: string;
  subjects: SubjectRecord[];
  activities: string[];
  competencies: string[];
  awards: SchoolRecordItem[];
  attendance: SchoolRecordItem[];
  certifications: SchoolRecordItem[];
  creative_activities: SchoolRecordItem[];
  behavior_opinions: SchoolRecordItem[];
  semester_grades: SchoolRecordItem[];
  warnings: string[];
  source_type: string;
  processed_at: string | null;
};

const emptyRecord: AcademicRecord = {
  summary: "", subjects: [], activities: [], competencies: [], awards: [], attendance: [], certifications: [],
  creative_activities: [], behavior_opinions: [], semester_grades: [], warnings: [], source_type: "", processed_at: null,
};

function RecordDetailSection({ number, title, items }: { number: string; title: string; items: SchoolRecordItem[] }) {
  return <section>
    <div className="record-section-heading"><div><span>{number}</span><h2>{title}</h2></div><small>{items.length}개 항목</small></div>
    {items.length > 0 ? <div className="school-record-list">{items.map((item, index) => <article key={`${number}-${index}`}>
      <div><strong>{item.title || title}</strong><span>{[item.school_year, item.semester].filter(Boolean).join(" · ")}</span></div>
      {item.value && <em>{item.value}</em>}
      {item.details && <p>{item.details}</p>}
    </article>)}</div> : <p className="empty-record">인식된 {title} 정보가 없습니다.</p>}
  </section>;
}

export default function RecordsPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [record, setRecord] = useState<AcademicRecord>(emptyRecord);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPage() {
      try {
        const currentUser = await apiRequest<CurrentUser>("/auth/me");
        setUser(currentUser);
        const currentRecord = await apiRequest<AcademicRecord>("/records");
        setRecord(currentRecord);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(requestError instanceof Error ? requestError.message : "생기부 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [router]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
    setError("");
  }

  async function upload() {
    if (!selectedFile) return;
    setProcessing(true);
    setError("");
    const body = new FormData();
    body.append("file", selectedFile);
    try {
      const result = await apiRequest<AcademicRecord>("/records/upload", { method: "POST", body });
      setRecord(result);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "생기부를 처리하지 못했습니다.");
    } finally {
      setProcessing(false);
    }
  }

  async function remove() {
    if (!window.confirm("저장된 생기부 요약을 삭제할까요?")) return;
    await apiRequest("/records", { method: "DELETE" });
    setRecord(emptyRecord);
  }

  async function logout() { await apiRequest("/auth/logout", { method: "POST" }); router.replace("/login"); }
  if (loading) return <main className="auth-loading"><LoaderCircle className="loading-icon" /><span>생기부 정보를 불러오는 중</span></main>;
  if (!user) return null;

  const hasRecord = Boolean(
    record.processed_at || record.summary || record.subjects.length || record.awards.length ||
    record.attendance.length || record.certifications.length || record.creative_activities.length ||
    record.behavior_opinions.length || record.semester_grades.length,
  );

  return (
    <main className="records-page">
      <header className="profile-header">
        <button className="survey-back" onClick={() => router.push("/")}><ArrowLeft size={17} /> 홈</button>
        <div className="auth-brand"><span><GraduationCap size={23} /></span><strong>길잡이</strong></div>
        <div><span>{user.full_name} 학생</span><button onClick={logout}><LogOut size={16} /> 로그아웃</button></div>
      </header>

      <div className="records-wrap">
        <section className="records-title">
          <div><p className="eyebrow">내 정보 · 생기부</p><h1>생기부 학업 정보 정리</h1><p>파일의 문자를 추출하고 개인정보를 가린 뒤, 진로 분석에 필요한 학업 내용만 정리합니다.</p></div>
          {hasRecord && <span><CheckCircle2 size={17} /> {new Date(record.processed_at!).toLocaleDateString("ko-KR")} 처리 완료</span>}
        </section>

        <section className="record-upload-panel">
          <div className="upload-guidance"><ShieldCheck size={24} /><div><strong>원본 파일은 저장하지 않습니다.</strong><p>서버 메모리에서 처리한 뒤 즉시 폐기하고, 마스킹된 요약 결과만 내 정보에 저장합니다.</p></div></div>
          <button className="file-drop" onClick={() => inputRef.current?.click()}>
            {selectedFile ? <FileText size={30} /> : <UploadCloud size={32} />}
            <strong>{selectedFile ? selectedFile.name : "생기부 파일을 선택하세요"}</strong>
            <span>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)}MB` : "PDF, PNG, JPG, TXT · 최대 15MB"}</span>
          </button>
          <input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={chooseFile} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="upload-actions"><p><FileImage size={15} /> 스캔 PDF와 이미지는 비전 OCR을 사용하므로 처리 시간이 더 걸릴 수 있습니다.</p><button onClick={upload} disabled={!selectedFile || processing}>{processing ? <><LoaderCircle className="loading-icon" size={17} /> OCR·정리 중</> : <><RefreshCw size={17} /> {hasRecord ? "새 파일로 다시 분석" : "파일 분석 시작"}</>}</button></div>
        </section>

        {hasRecord && <div className="record-results">
          <section className="record-summary"><div className="record-section-heading"><div><span>01</span><h2>학업 기록 요약</h2></div><button onClick={remove}><Trash2 size={16} /> 요약 삭제</button></div><p>{record.summary || "요약된 내용이 없습니다."}</p><div className="record-tags">{record.competencies.map((item) => <span key={item}>{item}</span>)}</div></section>

          <section><div className="record-section-heading"><div><span>02</span><h2>과목별 성적·세부능력 특기사항</h2></div><small>{record.subjects.length}개 과목</small></div>
            {record.subjects.length ? <div className="subject-list">{record.subjects.map((subject, index) => <article key={`${subject.subject}-${index}`}><div><BookOpenText size={18} /><strong>{subject.subject}</strong>{subject.grade_or_achievement && <em>{subject.grade_or_achievement}</em>}</div><p>{subject.details || "추출된 세부 내용이 없습니다."}</p></article>)}</div> : <p className="empty-record">인식된 과목 정보가 없습니다. 원문과 파일 품질을 확인해 주세요.</p>}
          </section>

          <section><div className="record-section-heading"><div><span>03</span><h2>교과 외 활동</h2></div><small>{record.activities.length}개 활동</small></div><ul className="activity-list">{record.activities.map((activity, index) => <li key={index}>{activity}</li>)}</ul>{!record.activities.length && <p className="empty-record">인식된 활동 정보가 없습니다.</p>}</section>

          <RecordDetailSection number="04" title="수상 경력" items={record.awards} />
          <RecordDetailSection number="05" title="출결" items={record.attendance} />
          <RecordDetailSection number="06" title="자격증·인증" items={record.certifications} />
          <RecordDetailSection number="07" title="창의적 체험활동" items={record.creative_activities} />
          <RecordDetailSection number="08" title="행동특성 및 종합의견" items={record.behavior_opinions} />
          <RecordDetailSection number="09" title="학년·학기별 성적" items={record.semester_grades} />

          {record.warnings.length > 0 && <aside className="record-warnings"><strong>확인이 필요한 내용</strong>{record.warnings.map((warning) => <p key={warning}>· {warning}</p>)}</aside>}
        </div>}
      </div>
    </main>
  );
}