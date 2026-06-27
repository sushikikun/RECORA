"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Check, ListChecks, MessageSquareText, SearchCheck, ShieldCheck } from "lucide-react";

import { RecoraMark } from "@/components/recora/brand/recora-mark";
import {
  getRecoraLandingSummary,
  recoraLandingData,
  recoraLandingFaqs,
  type LandingQuestion
} from "./recora-landing-data";
import styles from "./recora-landing-page.module.css";

const navItems = [
  { label: "診断結果の見本", href: "#sample" },
  { label: "診断でわかること", href: "#opportunity" },
  { label: "診断の流れ", href: "#flow" },
  { label: "FAQ", href: "#faq" }
] as const;

const resultLabels: Record<LandingQuestion["result"], string> = {
  self_candidate: "候補入り",
  competitor_only: "競合のみ",
  neither_candidate: "要確認"
};

export function RecoraLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"overview" | "questions" | "sources">("overview");
  const summary = useMemo(() => getRecoraLandingSummary(recoraLandingData), []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [menuOpen]);

  const firstCompetitorOnlyQuestion =
    recoraLandingData.questions.find((question) => question.result === "competitor_only") ?? recoraLandingData.questions[0];

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main">
        本文へ移動
      </a>
      <LandingHeader menuOpen={menuOpen} onMenuChange={setMenuOpen} />
      <main id="main">
        <section className={styles.hero} id="top">
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div>
              <div className={styles.heroBadge}>AIでの候補入りを、見込み客の質問から実測</div>
              <h1>
                AIは、御社を
                <br />
                <span className={styles.heroAccent}>候補に挙げていますか？</span>
              </h1>
              <p className={styles.heroLead}>
                見込み客がAIに尋ねる「おすすめ」「費用」「比較」を実際に調査。御社が候補に入る質問、競合だけが挙がる質問、回答に表示された参照元、次に見直すページと情報を整理します。
              </p>
              <p className={styles.heroOutcome}>
                <Check aria-hidden="true" />
                <span>AI検索で比較候補に入るために、最初に見直す情報がわかります。</span>
              </p>
              <div className={styles.heroActions}>
                <PrimaryCta analyticsId="hero-signup" />
                <Link className={`${styles.button} ${styles.buttonGhost}`} href="#sample">
                  診断結果の見本を見る
                </Link>
              </div>
              <div className={styles.heroMicro} aria-label="無料診断の条件">
                <span>無料登録後、会社情報を入力</span>
                <span>クレジットカード不要</span>
                <span>専門知識・設定不要</span>
                <span>診断結果は非公開</span>
              </div>
            </div>
            <DesktopDiagnosisPreview summary={summary} question={firstCompetitorOnlyQuestion} />
            <MobileDiagnosisPreview summary={summary} question={firstCompetitorOnlyQuestion} />
          </div>
          <SignalBar />
        </section>

        <ProblemSection />
        <DiagnosisResultSection activePanel={activePanel} onPanelChange={setActivePanel} summary={summary} />
        <OpportunityMapSection />
        <DiagnosisFlowSection />
        <EvidenceSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}

function LandingHeader({
  menuOpen,
  onMenuChange
}: {
  menuOpen: boolean;
  onMenuChange: (open: boolean) => void;
}) {
  return (
    <header className={styles.header} aria-label="サイトヘッダー">
      <div className={`${styles.container} ${styles.headerInner}`}>
        <BrandLink />
        <nav className={styles.nav} aria-label="メインナビゲーション">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.navActions}>
          <Link className={styles.loginLink} href="/login">
            ログイン
          </Link>
          <PrimaryCta small analyticsId="header-signup" />
        </div>
        <button
          className={styles.menuButton}
          type="button"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          aria-controls="recora-mobile-menu"
          onClick={() => onMenuChange(!menuOpen)}
        >
          <span />
        </button>
      </div>
      <div
        id="recora-mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}
        aria-hidden={!menuOpen}
        hidden={!menuOpen}
      >
        <nav aria-label="モバイルナビゲーション">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => onMenuChange(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" onClick={() => onMenuChange(false)}>
            ログイン
          </Link>
        </nav>
        <PrimaryCta analyticsId="mobile-menu-signup" />
      </div>
    </header>
  );
}

function BrandLink() {
  return (
    <Link className={styles.brand} href="/" aria-label="Recora トップ">
      <RecoraMark />
      <span className={styles.brandName}>
        Recora <small>AI検索診断</small>
      </span>
    </Link>
  );
}

function PrimaryCta({ small = false, analyticsId }: { small?: boolean; analyticsId: string }) {
  return (
    <Link
      className={`${styles.button} ${styles.buttonPrimary} ${small ? styles.buttonSmall : ""}`}
      href="/signup"
      data-analytics={analyticsId}
    >
      無料で自社を診断する
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

function DesktopDiagnosisPreview({
  summary,
  question
}: {
  summary: ReturnType<typeof getRecoraLandingSummary>;
  question: LandingQuestion;
}) {
  return (
    <div className={styles.heroPreviewWrap} aria-label="無料AI検索診断の結果画面">
      <div className={`${styles.floatCard} ${styles.floatTop}`}>
        <span>質問ごとに判定</span>
        <strong>候補入り / 競合のみ</strong>
      </div>
      <div className={styles.heroReport}>
        <PreviewTop />
        <QuestionBox question="中小企業におすすめの採用支援会社を教えて" />
        <MetricGrid summary={summary} />
        <FindingBox question={question} />
        <NextReviewBox />
      </div>
      <div className={`${styles.floatCard} ${styles.floatBottom}`}>
        <span>回答内に表示された参照元も確認</span>
        <strong>競合ページ / 比較記事 / 自社URL</strong>
      </div>
    </div>
  );
}

function MobileDiagnosisPreview({
  summary,
  question
}: {
  summary: ReturnType<typeof getRecoraLandingSummary>;
  question: LandingQuestion;
}) {
  return (
    <div className={styles.heroMobileProof} aria-label="無料AI検索診断の結果画面">
      <div className={styles.heroMobileTop}>
        <div className={styles.previewBrand}>
          <span className={styles.previewBrandIcon}>
            <RecoraMark />
          </span>
          <div>
            <strong>無料AI検索診断</strong>
            <small>候補入り・競合比較</small>
          </div>
        </div>
        <span className={styles.statusPill}>主要6質問</span>
      </div>
      <MetricGrid summary={summary} />
      <QuestionBox question="中小企業におすすめの採用支援会社を教えて" />
      <FindingBox question={question} compact />
      <NextReviewBox />
    </div>
  );
}

function PreviewTop() {
  return (
    <div className={styles.previewTop}>
      <div className={styles.previewBrand}>
        <span className={styles.previewBrandIcon}>
          <RecoraMark reverse />
        </span>
        <div>
          <strong>無料AI検索診断</strong>
          <small>主要6質問</small>
        </div>
      </div>
      <span className={styles.statusPill}>診断結果</span>
    </div>
  );
}

function QuestionBox({ question }: { question: string }) {
  return (
    <div className={styles.questionBox}>
      <span>見込み客からの質問</span>
      <strong>{question}</strong>
    </div>
  );
}

function MetricGrid({ summary }: { summary: ReturnType<typeof getRecoraLandingSummary> }) {
  return (
    <div className={styles.metricGrid}>
      <MetricCard label="自社が候補" value={summary.selfCandidateQuestionCount} total={summary.questionCount} />
      <MetricCard
        label="競合だけ"
        value={summary.competitorOnlyQuestionCount}
        total={summary.questionCount}
        risk
      />
      <MetricCard label="自社URL表示" value={summary.selfPageReferenceQuestionCount} total={summary.questionCount} />
    </div>
  );
}

function MetricCard({ label, value, total, risk = false }: { label: string; value: number; total: number; risk?: boolean }) {
  return (
    <div className={`${styles.metricCard} ${risk ? styles.metricRisk : ""}`}>
      <span>{label}</span>
      <strong>
        {value}
        <small>/ {total}問</small>
      </strong>
    </div>
  );
}

function FindingBox({ question, compact = false }: { question: LandingQuestion; compact?: boolean }) {
  return (
    <div className={styles.findingBox}>
      <span>{compact ? "今回の回答" : "今回確認できた機会"}</span>
      <strong>
        {compact
          ? "競合A・競合Bが候補。自社は登場せず"
          : "「費用」「比較」の3問で、競合だけが候補"}
      </strong>
      {!compact ? <p>御社は「選び方」「導入方法」の質問では候補に入りました。</p> : null}
      {compact ? <p>{question.question}</p> : null}
    </div>
  );
}

function NextReviewBox() {
  return (
    <div className={styles.nextBox}>
      <span>次に見直す情報</span>
      <div className={styles.chipRow}>
        {recoraLandingData.next_review_candidates.map((item) => (
          <b className={styles.chip} key={item}>
            {item}
          </b>
        ))}
      </div>
    </div>
  );
}

function SignalBar() {
  const items = [
    { label: "実際の質問でAI回答を調査", icon: MessageSquareText },
    { label: "自社と競合の候補入りを比較", icon: BarChart3 },
    { label: "回答内の参照元を確認", icon: ListChecks },
    { label: "次に見直す情報まで整理", icon: ShieldCheck }
  ];

  return (
    <div className={styles.signalBar} aria-label="Recoraで確認できること">
      {items.map(({ label, icon: Icon }) => (
        <div className={styles.signalItem} key={label}>
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function ProblemSection() {
  return (
    <section className={styles.section} aria-labelledby="problem-heading">
      <div className={`${styles.container} ${styles.problemLayout}`}>
        <div className={styles.problemText}>
          <span className={styles.sectionKicker}>比較の入口</span>
          <h2 id="problem-heading">
            見込み客の比較は、ホームページを開く前に
            <br />
            始まっています。
          </h2>
          <p>
            見込み客は、AIに「おすすめ」「費用」「違い」を聞き、その回答を手がかりに比較先を絞り込みます。回答に御社がなければ、ホームページを見られる前に候補から外れる可能性があります。
          </p>
        </div>
        <div className={styles.questionCloud} aria-label="見込み客がAIに尋ねる質問例">
          {["おすすめの会社は？", "費用はいくら？", "他社との違いは？", "失敗しない選び方は？"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiagnosisResultSection({
  activePanel,
  onPanelChange,
  summary
}: {
  activePanel: "overview" | "questions" | "sources";
  onPanelChange: (panel: "overview" | "questions" | "sources") => void;
  summary: ReturnType<typeof getRecoraLandingSummary>;
}) {
  return (
    <section className={`${styles.section} ${styles.sectionSoft}`} id="sample" aria-labelledby="sample-heading">
      <div className={styles.container}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>診断結果</span>
          <h2 id="sample-heading">
            1つの質問から、
            <br />
            <span className={styles.accentUnderline}>次に見直す情報</span>まで。
          </h2>
          <p>
            どこで候補に入るか。どこで競合だけが挙がるか。回答に表示された参照元と、次に見直す情報まで質問ごとに確認できます。
          </p>
        </div>
        <div className={styles.diagnosisCard}>
          <div className={styles.diagnosisTop}>
            <PreviewTop />
            <div className={styles.tabList} role="tablist" aria-label="診断結果の表示切り替え">
              <TabButton id="overview" activePanel={activePanel} onPanelChange={onPanelChange}>
                サマリー
              </TabButton>
              <TabButton id="questions" activePanel={activePanel} onPanelChange={onPanelChange}>
                質問別
              </TabButton>
              <TabButton id="sources" activePanel={activePanel} onPanelChange={onPanelChange}>
                参照元
              </TabButton>
            </div>
          </div>
          <div className={styles.panel}>
            {activePanel === "overview" ? <OverviewPanel summary={summary} /> : null}
            {activePanel === "questions" ? <QuestionsPanel /> : null}
            {activePanel === "sources" ? <SourcesPanel /> : null}
          </div>
        </div>
        <p className={styles.caption}>AI回答は日時・質問・モデルなどの条件で変化します。</p>
        <div className={styles.sampleCta}>
          <PrimaryCta analyticsId="sample-signup" />
          <small>無料登録後、診断に必要な会社情報の入力へ進めます</small>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  id,
  activePanel,
  onPanelChange,
  children
}: {
  id: "overview" | "questions" | "sources";
  activePanel: "overview" | "questions" | "sources";
  onPanelChange: (panel: "overview" | "questions" | "sources") => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={styles.tab}
      type="button"
      role="tab"
      aria-selected={activePanel === id}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      onClick={() => onPanelChange(id)}
    >
      {children}
    </button>
  );
}

function OverviewPanel({ summary }: { summary: ReturnType<typeof getRecoraLandingSummary> }) {
  return (
    <div className={styles.panelGrid} role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
      <div className={styles.summaryStack}>
        <BarCard label="調査した質問" value={`${summary.questionCount}問`} percent={100} />
        <BarCard label="自社が候補に入った質問" value={`${summary.selfCandidateQuestionCount}問`} percent={34} />
        <BarCard label="競合だけが挙がった質問" value={`${summary.competitorOnlyQuestionCount}問`} percent={50} risk />
      </div>
      <div className={styles.recommendCard}>
        <span>次に見直す情報</span>
        <strong>料金・導入事例・他社との違い</strong>
        <div className={styles.chipRow}>
          {recoraLandingData.next_review_candidates.map((item) => (
            <b className={styles.chip} key={item}>
              {item}
            </b>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarCard({ label, value, percent, risk = false }: { label: string; value: string; percent: number; risk?: boolean }) {
  return (
    <div className={styles.barCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${risk ? styles.barFillRisk : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function QuestionsPanel() {
  return (
    <div role="tabpanel" id="panel-questions" aria-labelledby="tab-questions">
      <div className={styles.questionTable}>
        <div className={styles.questionRow}>
          <span>質問</span>
          <span>見込み客</span>
          <span>テーマ</span>
          <span>結果</span>
        </div>
        {recoraLandingData.questions.map((question) => (
          <div className={styles.questionRow} key={question.id}>
            <strong>{question.question}</strong>
            <span>{question.persona}</span>
            <span>{question.theme}</span>
            <span className={getResultClassName(question.result)}>{resultLabels[question.result]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcesPanel() {
  const sources = Array.from(new Set(recoraLandingData.questions.flatMap((question) => question.displayed_sources))).filter(Boolean);

  return (
    <div className={styles.sourcesGrid} role="tabpanel" id="panel-sources" aria-labelledby="tab-sources">
      {sources.map((source) => (
        <div className={styles.sourceCard} key={source}>
          <span>回答内の参照元</span>
          <strong>{source}</strong>
        </div>
      ))}
    </div>
  );
}

function getResultClassName(result: LandingQuestion["result"]) {
  if (result === "self_candidate") return styles.resultCandidate;
  if (result === "competitor_only") return styles.resultRisk;
  return styles.resultNeutral;
}

function OpportunityMapSection() {
  const rows = [
    { title: "初めて依頼する経営者", detail: "選び方・導入方法", status: "候補入り", tone: styles.mapGood },
    { title: "費用を比べる担当者", detail: "料金・費用対効果", status: "競合のみ", tone: styles.mapRisk },
    { title: "他社と比較している担当者", detail: "違い・乗り換え", status: "要確認", tone: styles.mapNeutral }
  ];

  return (
    <section className={`${styles.section} ${styles.sectionGrid}`} id="opportunity" aria-labelledby="opportunity-heading">
      <div className={`${styles.container} ${styles.opportunityLayout}`}>
        <div className={styles.problemText}>
          <span className={styles.sectionKicker}>見込み客ごとの分析</span>
          <h2 id="opportunity-heading">
            どの見込み客の、どんな相談で、
            <br />
            御社が候補に入っていないか。
          </h2>
          <p>
            初めて依頼する人、費用を比べる人、乗り換えを考える人。見込み客の状況と相談内容を組み合わせ、候補に入る質問と入っていない質問を確認します。
          </p>
        </div>
        <div className={styles.opportunityMap}>
          <div className={styles.mapGrid}>
            {rows.map((row) => (
              <div className={styles.mapRow} key={row.title}>
                <div>
                  <strong>{row.title}</strong>
                  <span>{row.detail}</span>
                </div>
                <b className={`${styles.mapPill} ${row.tone}`}>{row.status}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DiagnosisFlowSection() {
  const steps = [
    {
      title: "無料登録",
      text: "メールアドレスで、診断結果を保存するためのアカウントを作成します。",
      visual: (
        <div className={`${styles.flowVisual} ${styles.fakeLogin}`} aria-hidden="true">
          <span>メールアドレス</span>
          <span>入力準備ページへ</span>
        </div>
      )
    },
    {
      title: "会社情報を入力",
      text: "会社名、ホームページURL、主なサービスを入力します。",
      visual: (
        <div className={styles.flowVisual} aria-hidden="true">
          <div className={styles.fakeInput} />
          <div className={styles.fakeInput} />
          <div className={styles.fakeInput} />
        </div>
      )
    },
    {
      title: "診断結果を確認",
      text: "候補入り、競合、参照元、次に見直す情報を確認できます。",
      visual: (
        <div className={`${styles.flowVisual} ${styles.fakeProgress}`} aria-hidden="true">
          <i />
          <span>質問ごとに整理</span>
        </div>
      )
    }
  ];

  return (
    <section className={`${styles.section} ${styles.sectionSoft}`} id="flow" aria-labelledby="flow-heading">
      <div className={styles.container}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>診断の流れ</span>
          <h2 id="flow-heading">
            無料登録から、
            <br />
            診断に必要な会社情報の入力まで3ステップ。
          </h2>
        </div>
        <div className={styles.flowGrid}>
          {steps.map((step, index) => (
            <article className={styles.flowCard} key={step.title}>
              <span className={styles.flowNumber}>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {step.visual}
            </article>
          ))}
        </div>
        <div className={styles.flowCta}>
          <PrimaryCta analyticsId="flow-signup" />
          <p>診断結果の保存と再確認のため、メールアドレスでの無料登録が必要です。</p>
        </div>
      </div>
    </section>
  );
}

function EvidenceSection() {
  const items = [
    ["質問", "見込み客が比較・検討時にAIへ尋ねる可能性が高い質問"],
    ["回答", "AI回答内で自社と競合がどのように扱われたか"],
    ["参照元", "回答内に表示されたページや比較記事"],
    ["条件", `${recoraLandingData.measurement.provider_label} / ${formatMeasuredAt(recoraLandingData.measurement.measured_at)}`]
  ];

  return (
    <section className={styles.section} id="evidence" aria-labelledby="evidence-heading">
      <div className={`${styles.container} ${styles.evidenceLayout}`}>
        <div className={styles.evidenceText}>
          <span className={styles.sectionKicker}>診断の透明性</span>
          <h2 id="evidence-heading">
            診断結果を、
            <br />
            根拠と一緒に確認できます。
          </h2>
          <p>
            独自スコアだけで判断させません。実際の質問、AIの回答、登場した企業、回答内に表示された参照元、対象モデルと計測日時を確認できます。
          </p>
        </div>
        <div className={styles.evidencePanel}>
          <div className={styles.evidenceList}>
            {items.map(([label, text], index) => (
              <div key={label}>
                <b>{index + 1}</b>
                <span>
                  <strong>{label}</strong>
                  <span>{text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className={`${styles.section} ${styles.sectionSoft}`} id="faq" aria-labelledby="faq-heading">
      <div className={styles.container}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>FAQ</span>
          <h2 id="faq-heading">診断前によくある質問</h2>
        </div>
        <div className={styles.faq}>
          {recoraLandingFaqs.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <div className={styles.faqAnswer}>
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className={styles.finalCta} aria-labelledby="final-heading">
      <div className={`${styles.container} ${styles.finalInner}`}>
        <h2 id="final-heading">
          AIの答えに、御社は入っているか。
          <br />
          まずは無料で確認。
        </h2>
        <p>見込み客の質問をもとに、候補入り、競合、参照元、次に見直す情報を質問ごとに整理します。</p>
        <Link className={`${styles.button} ${styles.buttonLight}`} href="/signup" data-analytics="final-signup">
          無料で自社を診断する
          <ArrowRight aria-hidden="true" />
        </Link>
        <div className={styles.finalMicro}>
          <span>登録後に会社情報を入力</span>
          <span>クレジットカード不要</span>
          <span>専門知識不要</span>
          <span>診断結果は非公開</span>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <div className={styles.footerLead}>
          <BrandLink />
          <p>見込み客の質問から、AI検索での候補入りを診断する。</p>
        </div>
        <div className={styles.footerLinks}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/login">ログイン</Link>
          <span>© 2026 Recora</span>
        </div>
      </div>
    </footer>
  );
}

function formatMeasuredAt(value: string) {
  const measuredAt = new Date(value);
  if (Number.isNaN(measuredAt.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo"
  }).format(measuredAt);
}
