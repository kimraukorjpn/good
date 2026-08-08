"use client";

import { Check, ChevronDown, ChevronUp, LoaderCircle, Save, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";

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

type Question = {
  id: string;
  title: string;
  description: string;
  options: string[];
};

const questions: Question[] = [
  { id: "interests", title: "어떤 분야에 자연스럽게 관심이 가나요?", description: "평소 찾아보거나 더 알고 싶은 분야를 모두 골라주세요.", options: ["인공지능·데이터", "컴퓨터·소프트웨어", "수학·통계", "물리·공학", "화학·신소재", "생명·의학", "환경·에너지", "심리·상담", "교육", "경제·경영", "법·정책", "사회·문화", "언어·문학", "역사·철학", "미디어·콘텐츠", "디자인·예술", "건축·도시", "스포츠·건강"] },
  { id: "subjects", title: "즐겁거나 자신 있게 느끼는 과목은 무엇인가요?", description: "성적과 관계없이 배우는 과정이 흥미로운 과목도 포함해 주세요.", options: ["국어", "문학", "수학", "확률과 통계", "영어", "물리학", "화학", "생명과학", "지구과학", "통합사회", "경제", "정치와 법", "사회문화", "생활과 윤리", "한국사", "세계사", "지리", "정보", "기술·가정", "미술", "음악", "체육"] },
  { id: "problem_approach", title: "문제를 만났을 때 어떤 방식이 편한가요?", description: "상황에 따라 달라질 수 있으니 여러 방식을 골라도 됩니다.", options: ["자료와 숫자부터 살펴보기", "원인을 단계별로 정리하기", "직접 만들며 시험하기", "사람들의 의견을 듣기", "새로운 아이디어 많이 내기", "비슷한 사례 찾아보기", "규칙과 원리 이해하기", "그림이나 구조로 표현하기", "토론하며 답 좁히기", "빠르게 시도하고 고치기", "충분히 관찰한 뒤 결정하기", "역할을 나눠 함께 해결하기"] },
  { id: "learning_style", title: "가장 잘 배우는 방식은 무엇인가요?", description: "집중이 잘 되고 오래 기억되는 학습 방식을 선택해 주세요.", options: ["설명 듣기", "책과 글 읽기", "영상·그림 보기", "문제 반복 풀이", "직접 실험하기", "프로젝트 완성하기", "친구에게 설명하기", "토론과 질문", "요약 노트 만들기", "실제 사례 분석", "현장 체험", "혼자 깊게 탐구", "스터디로 함께 학습"] },
  { id: "team_role", title: "함께 활동할 때 주로 맡는 역할은 무엇인가요?", description: "해본 역할뿐 아니라 앞으로 해보고 싶은 역할도 선택할 수 있어요.", options: ["전체 계획 세우기", "팀원 의견 조율하기", "자료 조사하기", "분석하고 정리하기", "아이디어 제안하기", "발표하기", "글 작성하기", "디자인·시각화하기", "제작·개발하기", "일정과 진행 관리", "문제점 점검하기", "팀원 지원하기", "혼자 맡은 부분 완성하기"] },
  { id: "preferred_output", title: "어떤 결과물을 만들 때 뿌듯한가요?", description: "완성해 보고 싶은 결과물의 형태를 모두 골라주세요.", options: ["탐구 보고서", "데이터 분석 결과", "실험 결과", "프로그램·앱", "제품·모형", "발표·강연", "영상·콘텐츠", "글·기사", "그림·디자인", "캠페인", "정책 제안", "수업·교육 자료", "창업 아이디어", "공연·전시", "사람을 돕는 서비스"] },
  { id: "values", title: "진로에서 중요하게 생각하는 가치는 무엇인가요?", description: "정답은 없습니다. 나에게 중요한 기준을 넉넉히 선택하세요.", options: ["사회 문제 해결", "사람을 직접 돕기", "새로운 지식 발견", "기술과 혁신", "창의적인 표현", "안정적인 생활", "높은 전문성", "경제적 보상", "일과 삶의 균형", "자율적인 업무", "다양한 사람과 협업", "리더십과 영향력", "지속가능한 환경", "국제적인 경험", "꾸준한 성장"] },
  { id: "activity_environment", title: "어떤 활동 환경에서 에너지가 생기나요?", description: "선호하는 공간, 사람, 업무 리듬을 선택해 주세요.", options: ["조용히 집중하는 환경", "사람들과 활발히 소통하는 환경", "규칙과 목표가 명확한 환경", "자유롭게 시도하는 환경", "실험실·연구 공간", "컴퓨터 중심 환경", "현장과 야외", "교육·상담 현장", "기업·조직", "공공기관·지역사회", "국제적인 환경", "빠르게 변화하는 환경", "장기 프로젝트 환경", "다양한 일을 번갈아 하는 환경"] },
  { id: "career_goals", title: "관심 있거나 경험해 보고 싶은 직업 역할은 무엇인가요?", description: "직업명이 정확하지 않아도 괜찮습니다. 끌리는 역할을 모두 골라주세요.", options: ["연구원·과학자", "의료·보건 전문가", "소프트웨어 개발자", "데이터 분석가", "엔지니어", "건축·도시 전문가", "교사·교육 전문가", "상담·심리 전문가", "법률 전문가", "공무원·정책 전문가", "경영·기획자", "금융·경제 전문가", "창업가", "마케터·광고 기획자", "언론·미디어 전문가", "작가·콘텐츠 제작자", "디자이너·예술가", "환경·에너지 전문가", "사회복지·국제개발 전문가", "스포츠 전문가"] },
  { id: "career_motivation", title: "진로를 탐색할 때 가장 궁금한 것은 무엇인가요?", description: "현재 필요한 도움을 선택하면 추천 설명의 우선순위에 반영됩니다.", options: ["내 강점과 적성", "나와 맞는 전공", "새로운 직업 가능성", "관심 분야의 실제 업무", "대학별 교육과정 차이", "비슷한 학과의 차이", "생기부와 전공의 연결", "앞으로 할 교과 탐구", "동아리·독서 활동 방향", "성적에 맞는 지원 범위", "대학 인재상과 평가 요소", "면접 예상 질문", "지원동기 이야기 구성", "아직 진로를 못 정해도 되는지"] },
];

const grades = [1, 2, 3] as const;

export function ProfileSurvey({ onGradeChange }: { onGradeChange?: (grade: 1 | 2 | 3) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const answeredCount = useMemo(() => profile ? questions.filter((question) => (profile.survey_answers[question.id] ?? []).length > 0).length : 0, [profile]);

  useEffect(() => {
    apiRequest<Profile>("/profile").then((data) => {
      setProfile({ ...data, survey_answers: data.survey_answers ?? {} });
      if (data.grade) onGradeChange?.(data.grade);
    });
  }, [onGradeChange]);

  function selectGrade(grade: 1 | 2 | 3) {
    setProfile((current) => current ? { ...current, grade } : current);
    onGradeChange?.(grade);
  }

  function toggleAnswer(questionId: string, option: string) {
    setProfile((current) => {
      if (!current) return current;
      const selected = current.survey_answers[questionId] ?? [];
      const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
      return { ...current, survey_answers: { ...current.survey_answers, [questionId]: next } };
    });
  }

  async function save() {
    if (!profile?.grade || !profile.graduation_year) {
      setMessage("학년과 졸업 예정 연도를 먼저 선택해 주세요.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const survey = profile.survey_answers;
      const updated = await apiRequest<Profile>("/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...profile,
          interests: survey.interests ?? profile.interests,
          preferred_subjects: survey.subjects ?? profile.preferred_subjects,
          career_goals: survey.career_goals ?? profile.career_goals,
        }),
      });
      setProfile(updated);
      setMessage("기본정보와 성향 답변을 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <section className="survey-shell survey-loading"><LoaderCircle className="loading-icon" size={22} /> 기본정보를 불러오는 중</section>;

  return (
    <section className="survey-shell" aria-labelledby="survey-title">
      <div className="survey-header">
        <div className="survey-heading"><span className="step-number">01</span><div><p className="eyebrow">AI 맞춤 기본정보</p><h2 id="survey-title">나를 더 잘 이해할 수 있도록 알려주세요.</h2><p>선택한 답변은 진로 분석과 학과 추천의 근거로 사용됩니다. 모든 질문은 복수 선택할 수 있어요.</p></div></div>
        <div className="survey-progress"><strong>{answeredCount}/{questions.length}</strong><span>성향 문항 응답</span><button onClick={() => setOpen((value) => !value)}>{open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}{open ? "접기" : "이어서 입력"}</button></div>
      </div>

      {open && <>
        <div className="basic-info-grid">
          <fieldset><legend>현재 학년</legend><div className="choice-row">{grades.map((grade) => <button type="button" key={grade} className={profile.grade === grade ? "choice-selected" : ""} onClick={() => selectGrade(grade)}>고{grade}</button>)}</div></fieldset>
          <label>졸업 예정 연도<select value={profile.graduation_year ?? ""} onChange={(event) => setProfile({ ...profile, graduation_year: Number(event.target.value) })}><option value="" disabled>연도 선택</option>{Array.from({ length: 8 }, (_, index) => 2026 + index).map((year) => <option key={year}>{year}</option>)}</select></label>
          <label>학교 유형<select value={profile.school_type ?? ""} onChange={(event) => setProfile({ ...profile, school_type: event.target.value })}><option value="" disabled>유형 선택</option>{["일반고", "특목고", "자율고", "특성화고", "기타"].map((type) => <option key={type}>{type}</option>)}</select></label>
        </div>

        <div className="survey-questions">
          {questions.map((question, index) => {
            const selected = profile.survey_answers[question.id] ?? [];
            return <fieldset className="survey-question" key={question.id}>
              <legend><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{question.title}</strong><small>{question.description}</small></div><em>{selected.length}개 선택</em></legend>
              <div className="option-grid">{question.options.map((option) => {
                const isSelected = selected.includes(option);
                return <button type="button" key={option} className={isSelected ? "option-selected" : ""} onClick={() => toggleAnswer(question.id, option)} aria-pressed={isSelected}><span>{isSelected && <Check size={13} />}</span>{option}</button>;
              })}</div>
            </fieldset>;
          })}
        </div>

        <div className="survey-actions"><div>{message ? <span className="survey-message"><Sparkles size={15} />{message}</span> : <span>답변은 언제든 수정할 수 있습니다.</span>}</div><button onClick={save} disabled={saving}>{saving ? <LoaderCircle className="loading-icon" size={17} /> : <Save size={17} />}{saving ? "저장 중" : "기본정보 저장"}</button></div>
      </>}
    </section>
  );
}