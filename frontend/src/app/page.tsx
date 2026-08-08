"use client";

import {
  ArrowRight, BookOpenText, Check, ChevronRight, CircleUserRound,
  ClipboardCheck, ClipboardList, FileSearch, GraduationCap, LayoutDashboard, LibraryBig,
  LoaderCircle, LogOut, Menu, MessageSquareText, PanelLeftClose, School, ShieldCheck, Sparkles,
  Target, Upload, X, Printer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest, ApiError, CurrentUser } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/backend-api";

const grades = [
  { value: 1, short: "고1", title: "가능성을 넓게 발견해요", description: "관심과 성향을 중심으로 새로운 계열과 다음 활동을 탐색합니다." },
  { value: 2, short: "고2", title: "관심을 구체적인 방향으로", description: "누적된 활동의 연결성과 심화 과정을 찾아 진로 후보를 좁힙니다." },
  { value: 3, short: "고3", title: "기록을 지원 전략으로", description: "생기부와 교과 성취를 대학 인재상, 전형 조건과 연결합니다." },
];

type NavigationItem = {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  active?: boolean;
  badge?: string;
};

const navigation: NavigationItem[] = [
  { label: "홈", icon: LayoutDashboard, path: "/", active: true },
  { label: "내 정보", icon: CircleUserRound, path: "/profile" },
  { label: "진로 설문", icon: ClipboardList, path: "/survey" },
  { label: "생기부 분석", icon: FileSearch, path: "/records" },
  { label: "입시 추천", icon: Target, path: "/#admission-recommendation" },
];

type ReportRecommendation = { title: string; category: string; rationale: string; evidence: string[]; next_steps: string[] };
type ReportAction = { title: string; priority: string; rationale: string; actions: string[] };
type AdmissionReport = {
  grade: number | null;
  grade_strategy: string;
  overview: string;
  strengths: string[];
  careers: ReportRecommendation[];
  majors: ReportRecommendation[];
  record_directions: ReportAction[];
  subject_strategies: ReportAction[];
  application_story: string;
  cautions: string[];
  generation_mode: string;
  generated_at: string | null;
};

function ReportRecommendations({ number, title, items }: { number: string; title: string; items: ReportRecommendation[] }) {
  return <section className="report-section">
    <div className="report-section-title"><p className="report-label">{number} · 맞춤 추천</p><h3>{title}</h3></div>
    {items.length ? <div className="report-recommendation-grid">{items.map((item, index) => <article key={`${item.title}-${index}`}>
      <div><span>0{index + 1}</span><small>{item.category}</small></div><h4>{item.title}</h4><p>{item.rationale}</p>
      <div className="report-evidence"><strong><BookOpenText size={14} /> 판단 근거</strong>{item.evidence.map((evidence) => <p key={evidence}>· {evidence}</p>)}</div>
      <ul>{item.next_steps.map((step) => <li key={step}>{step}</li>)}</ul>
    </article>)}</div> : <p className="report-missing">추천 근거가 부족합니다. 내 정보와 생기부 기록을 보완해 주세요.</p>}
  </section>;
}

function ReportActions({ number, title, items }: { number: string; title: string; items: ReportAction[] }) {
  return <section className="report-section">
    <div className="report-section-title"><p className="report-label">{number} · 실행 전략</p><h3>{title}</h3></div>
    {items.length ? <div className="report-action-list">{items.map((item, index) => <article key={`${item.title}-${index}`}><div><h4>{item.title}</h4><span>{item.priority} 우선순위</span></div><p>{item.rationale}</p><ul>{item.actions.map((action) => <li key={action}>{action}</li>)}</ul></article>)}</div> : <p className="report-missing">분석할 입력 정보가 부족합니다.</p>}
  </section>;
}

export default function Home() {
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [apiStatus, setApiStatus] = useState<"checking" | "ready" | "offline">("checking");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [report, setReport] = useState<AdmissionReport | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const currentGrade = grades.find((grade) => grade.value === selectedGrade)!;

  useEffect(() => {
    async function loadDashboard() {
      try {
        const user = await apiRequest<CurrentUser>("/auth/me");
        setCurrentUser(user);
        if (user.grade) setSelectedGrade(user.grade);
        const savedReport = await apiRequest<AdmissionReport>("/reports");
        if (savedReport.generated_at) setReport(savedReport);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) router.replace("/login");
        else setAnalysisError(error instanceof Error ? error.message : "저장된 레포트를 불러오지 못했습니다.");
      } finally {
        setAuthChecking(false);
      }
    }

    loadDashboard();
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { configured: boolean }) => setApiStatus(data.configured ? "ready" : "offline"))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setApiStatus("offline");
      });
    return () => controller.abort();
  }, []);

  async function runAnalysis() {
    setAnalysisLoading(true);
    setAnalysisError("");
    try {
      const result = await apiRequest<AdmissionReport>("/reports/generate", { method: "POST" });
      setReport(result);
      document.querySelector("#admission-recommendation")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "입시 컨설팅 레포트를 생성하지 못했습니다.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function logout() {
    await apiRequest("/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (authChecking) return <main className="auth-loading"><LoaderCircle className="loading-icon" /><span>내 진로 여정을 불러오는 중</span></main>;
  if (!currentUser) return null;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={23} /></div>
          <div><strong>길잡이</strong><span>AI 진로·대입 동반자</span></div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기"><PanelLeftClose size={20} /></button>
        </div>
        <nav aria-label="주요 메뉴">
          <p className="nav-label">나의 여정</p>
          {navigation.map(({ label, icon: Icon, path, active, badge }) => (
            <button className={`nav-item ${active ? "nav-item-active" : ""}`} key={label} onClick={() => router.push(path)}>
              <Icon size={19} /><span>{label}</span>{badge && <small>{badge}</small>}
            </button>
          ))}
        </nav>
        <div className="privacy-note">
          <ShieldCheck size={21} />
          <div><strong>개인정보 보호 중</strong><p>원본은 분석 후 삭제되며 직접 식별정보는 먼저 가려집니다.</p></div>
        </div>
        <button className="profile-chip" onClick={() => router.push("/profile")}>
          <div className="profile-avatar">{currentUser.full_name.slice(0, 1)}</div>
          <div><strong>{currentUser.full_name} 학생</strong><span>고등학교 {selectedGrade}학년</span></div>
          <ChevronRight size={17} />
        </button>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기" />}

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기"><Menu size={21} /></button>
          <div className={`topbar-status status-${apiStatus}`}><span className="status-dot" />{apiStatus === "checking" ? "AI 설정 확인 중" : apiStatus === "ready" ? "AI 설정 준비됨" : "AI 서버 연결 필요"}</div>
          <button className="outline-button" onClick={() => router.push("/records")}><Upload size={17} />생기부 새로 분석</button>
          <button className="icon-button" onClick={logout} aria-label="로그아웃" title="로그아웃"><LogOut size={18} /></button>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div><p className="eyebrow">오늘의 진로 여정</p><h1>내 기록에서 다음 방향을 찾아볼까요?</h1><p>학년에 맞춰 분석의 관점을 바꾸고, 모든 제안에 실제 기록의 근거를 연결합니다.</p></div>
            <div className="progress-ring" aria-label="전체 여정 62% 완료"><div><strong>62</strong><span>%</span></div><small>전체 여정</small></div>
          </section>

          {noticeVisible && (
            <div className="notice" role="status">
              <Sparkles size={20} /><p><strong>분석 결과가 준비됐어요.</strong> 대표 활동 5개와 연결되는 대학·학과 후보를 확인해 보세요.</p>
              <button onClick={() => setNoticeVisible(false)} aria-label="알림 닫기"><X size={18} /></button>
            </div>
          )}

          <div className="dashboard-grid">
            <section className="analysis-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">생기부 분석</p><h2>기록 속에서 발견한 강점</h2></div>
                <button className="text-button" onClick={() => router.push("/#admission-recommendation")}>입시 추천 보기 <ArrowRight size={16} /></button>
              </div>
              <div className="insight-feature">
                <div className="insight-icon"><LibraryBig size={25} /></div>
                <div><span>가장 반복된 관심 주제</span><h3>데이터로 사회 문제를 이해하는 탐구</h3><p>수학 세특, 정보 동아리, 자율 탐구에서 같은 문제의식이 이어지고 있어요.</p></div>
              </div>
              <div className="evidence-row">
                <div><strong>5</strong><span>대표 활동</span></div><div><strong>8</strong><span>근거 문장</span></div><div><strong>3년</strong><span>관심의 흐름</span></div>
              </div>
              <div className="strengths"><p>근거가 확인된 역량</p><div className="tag-list"><span>자료 분석 <b>4</b></span><span>문제 해결 <b>3</b></span><span>협업 <b>2</b></span><span>자기주도 <b>3</b></span></div></div>
            </section>
            <aside className="next-step-panel">
              <div className="next-step-icon"><ClipboardCheck size={25} /></div><p className="eyebrow">다음 단계</p><h2>추천 후보를 비교해 보세요</h2>
              <p>진로 적합도와 지원 조건을 따로 살펴보면 더 균형 있게 판단할 수 있어요.</p>
              <div className="task-list"><div className="task-done"><Check size={15} /><span>생기부 근거 확인</span></div><div><span className="task-index">2</span><span>대학·학과 후보 비교</span></div><div><span className="task-index">3</span><span>대표 경험으로 이야기 만들기</span></div></div>
              <button className="primary-button" onClick={runAnalysis} disabled={analysisLoading}>
                {analysisLoading ? <><LoaderCircle className="loading-icon" size={18} />레포트 생성 중</> : <>입시 레포트 생성 <ArrowRight size={18} /></>}
              </button>
            </aside>
          </div>

          <section className="recommendation-section" id="admission-recommendation">
            <div className="panel-heading">
              <div><p className="eyebrow">통합 입시 추천</p><h2>{currentGrade.short} 맞춤 입시 컨설팅</h2><p>{currentGrade.description}</p></div>
              <div className="report-heading-actions">
                {report && <button className="text-button" onClick={() => window.print()}><Printer size={15} /> 인쇄·PDF</button>}
                <button className="text-button" onClick={runAnalysis} disabled={analysisLoading}>{report ? "레포트 다시 생성" : "통합 리포트 생성"} <ArrowRight size={16} /></button>
              </div>
            </div>
            <div className="admission-pillars" aria-label="입시 추천 분석 구성">
              <div><span><School size={19} /></span><div><strong>대학·학과 추천</strong><p>성적과 활동 근거로 전공 및 지원 후보를 살펴봅니다.</p></div></div>
              <div><span><Target size={19} /></span><div><strong>인재상 적합성</strong><p>대학이 기대하는 역량과 내 기록의 접점을 확인합니다.</p></div></div>
              <div><span><MessageSquareText size={19} /></span><div><strong>나의 지원 이야기</strong><p>관심, 탐구, 성장의 흐름을 하나의 지원 서사로 연결합니다.</p></div></div>
            </div>
            {analysisError && <p className="form-error report-error" role="alert">{analysisError}</p>}
            {!report && <div className="report-empty"><Sparkles size={28} /><strong>아직 생성된 입시 컨설팅 레포트가 없습니다.</strong><p>진로 설문과 생기부 분석을 바탕으로 현재 학년에 맞는 추천과 실행 계획을 만듭니다.</p><button onClick={runAnalysis} disabled={analysisLoading}>{analysisLoading ? "입력 정보 분석 중" : "내 입시 레포트 생성하기"}</button></div>}
            {report && <div className="consulting-report">
              <header className="report-cover"><div><span>{currentUser.full_name} 학생 · {currentGrade.short}</span><h3>입시 컨설팅 리포트</h3><p>{report.grade_strategy}</p></div><small>{report.generated_at && new Date(report.generated_at).toLocaleDateString("ko-KR")} 생성 · {report.generation_mode === "ai" ? "AI 분석" : "기본 분석"}</small></header>
              <section className="report-overview"><p className="report-label">01 · 종합 진단</p><h3>컨설팅 요약</h3><p>{report.overview}</p><div className="record-tags">{report.strengths.map((strength) => <span key={strength}>{strength}</span>)}</div></section>
              <ReportRecommendations number="02" title="추천 직업" items={report.careers} />
              <ReportRecommendations number="03" title="추천 전공·학과" items={report.majors} />
              <ReportActions number="04" title="생기부 작성 방향" items={report.record_directions} />
              <ReportActions number="05" title="과목별 성적 개선 전략" items={report.subject_strategies} />
              <section className="report-story"><p className="report-label">06 · 지원 서사</p><h3>나의 이야기</h3><p>{report.application_story}</p></section>
              <aside className="report-cautions"><ShieldCheck size={20} /><div><strong>해석 및 활용 시 주의사항</strong>{report.cautions.map((caution) => <p key={caution}>· {caution}</p>)}</div></aside>
            </div>}
          </section>
        </div>
      </main>
    </div>
  );
}
