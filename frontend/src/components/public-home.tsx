import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";

export function PublicHome() {
  return (
    <main className="public-home">
      <header className="public-home-header">
        <Link className="auth-brand" href="/">
          <span><GraduationCap size={24} /></span>
          <strong>길잡이</strong>
        </Link>
        <nav>
          <Link href="/login">로그인</Link>
          <Link className="public-home-cta" href="/signup">회원가입</Link>
        </nav>
      </header>

      <section className="public-home-hero">
        <div>
          <p className="eyebrow">AI 진로·대입 동반자</p>
          <h1>기록에서 발견한 가능성을<br />나만의 방향으로 이어가세요.</h1>
          <p>
            고등학생을 위한 진로·대입 준비와 함께,
            행사 현장에서는 로그인 없이 바로 체험할 수 있는 초등 진로 체험도 제공합니다.
          </p>
        </div>
        <div className="public-home-grid">
          <article className="public-home-card">
            <p className="eyebrow">학생 서비스</p>
            <h2>고등학생 진로·대입 준비</h2>
            <p>설문, 생기부 분석, 입시 추천까지 한 흐름으로 이어집니다.</p>
            <div className="public-home-actions">
              <Link href="/login">로그인</Link>
              <Link href="/signup">시작하기</Link>
            </div>
          </article>

          <article className="public-home-card public-home-card-highlight">
            <div className="public-home-badge"><Sparkles size={16} /> 행사 체험</div>
            <p className="eyebrow">초등 진로 체험</p>
            <h2>좋아하는 것과 나의 스타일로 미래 직업을 찾아봐요</h2>
            <p>이름, 관심사, 활동 방식, 8문항 성향 질문으로 3~5개의 직업을 추천해줘요.</p>
            <div className="public-home-actions">
              <Link aria-label="초등 진로 체험 시작하기" href="/kids">초등 진로 체험</Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
