import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  FileCheck2,
  Link2,
  Search,
} from "lucide-react";

import styles from "./home-page.module.css";

export const recoraMarketingFaqs = [
  {
    question: "GEOやLLMOとは何ですか？",
    answer:
      "AIの回答で、自社がどう理解され、誰と比較され、どの情報が参照されているかを確認し、その根拠になる情報を整える取り組みです。呼び方や定義には幅があります。Recoraでは、実際の質問と回答を起点に確認します。",
  },
  {
    question: "SEOは不要になりますか？",
    answer:
      "不要にはなりません。SEOは、検索結果やウェブページを見つけてもらうための重要な土台です。GEO・LLMOでは、そこに加えて、AIの回答内で候補・説明・参照情報がどう扱われているかを確認します。",
  },
  {
    question: "なぜ毎日計測するのですか？",
    answer:
      "AIの回答は、質問の表現、利用するAIサービス、確認する時点によって変わるためです。1回の結果を結論にせず、同じ質問軸で変化を記録します。",
  },
  {
    question: "毎日、何を確認しますか？",
    answer:
      "見込み客が比較するときの質問ごとに、自社と競合が候補に挙がるか、どう説明されるか、AIがどの情報を参照したかを確認します。",
  },
  {
    question: "どのAIサービスが対象ですか？",
    answer:
      "GPT、Gemini、Perplexity、Google AI Modeが対象です。利用できるAIモデル数はプランによって異なります。",
  },
  {
    question: "AIが参照した情報とは何ですか？",
    answer:
      "AIの回答と一緒に示された、公式サイト、料金ページ、比較記事、導入事例、第三者記事などの情報です。Recoraでは、回答内容と参照情報を分けて確認します。",
  },
  {
    question: "改善すれば必ず候補に入りますか？",
    answer:
      "候補入りや参照を保証するものではありません。Recoraは、現在の見え方と変化を観測し、どの説明やページから確認するかを判断しやすくするサービスです。",
  },
] as const;

const providerNames = ["GPT", "Gemini", "Perplexity", "Google AI Mode"] as const;

const previewPlans = [
  {
    name: "Free Preview",
    price: "0円",
    note: "50質問・1モデル・1回診断",
    action: "無料で始める",
    href: "/signup",
  },
  {
    name: "Monitor Basic",
    price: "12,800円/月",
    note: "50質問・2モデル・毎日計測",
    action: "プランを見る",
    href: "/pricing",
  },
  {
    name: "Monitor Standard",
    price: "29,800円/月",
    note: "100質問・2モデル・毎日計測・改善提案",
    action: "プランを見る",
    href: "/pricing",
  },
] as const;

export function RecoraMarketingHome() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        本文へ移動
      </a>
      <HomeHeader />

      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>AI SEARCH MONITORING / GEO・LLMO</p>
            <h1 className={styles.heroTitle}>
              <span>AIは、御社をどう見て、</span>
              <span>誰と比べているか。</span>
            </h1>
            <p className={styles.heroLead}>
              見込み客がAIに比較を相談したとき、自社は候補に挙がるのか。競合との違いをどう説明され、どの情報が参照されるのか。Recoraは、その答えを毎日記録し、次に確認するページまで整理します。
            </p>
            <div className={styles.heroActions}>
              <PrimaryAction href="/signup">無料で見え方を確認する</PrimaryAction>
              <TextAction href="/sample">表示例を見る</TextAction>
            </div>
            <ul className={styles.trustList} aria-label="無料プレビューの補足">
              <li>
                <Check aria-hidden size={14} /> GEO・LLMOの知識は不要
              </li>
              <li>
                <Check aria-hidden size={14} /> 50質問の無料プレビュー
              </li>
              <li>
                <Check aria-hidden size={14} /> 結果は確認条件により変動
              </li>
            </ul>
          </div>

          <AnswerDecisionMap />
        </section>

        <section className={styles.categorySection} id="why-now">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>WHY NOW</p>
            <h2>検索順位だけでは、比較の全体が見えなくなった。</h2>
            <p>
              AIに比較を相談する場面では、複数の候補、違い、判断材料がひとつの回答にまとめられます。だから企業が見る場所も、検索結果だけでなく「回答の中でどう扱われたか」まで広がります。
            </p>
          </div>

          <div className={styles.journeyComparison}>
            <div className={styles.journeyRow}>
              <span className={styles.journeyName}>これまでの検索</span>
              <div className={styles.journeyPath}>
                <span>キーワード</span>
                <i aria-hidden>→</i>
                <span>検索結果</span>
                <i aria-hidden>→</i>
                <span>ページを読む</span>
                <i aria-hidden>→</i>
                <span>比較する</span>
              </div>
            </div>
            <div className={`${styles.journeyRow} ${styles.journeyRowActive}`}>
              <span className={styles.journeyName}>AIでの情報収集</span>
              <div className={styles.journeyPath}>
                <span>自然な質問</span>
                <i aria-hidden>→</i>
                <span>AIの回答</span>
                <i aria-hidden>→</i>
                <span>候補・違い・参照情報</span>
                <i aria-hidden>→</i>
                <span>比較する</span>
              </div>
            </div>
          </div>

          <div className={styles.definitionBand}>
            <div>
              <p className={styles.definitionTerm}>GEO / LLMO</p>
              <p className={styles.definitionCopy}>
                AI回答での見え方を観測し、根拠になる情報を整える取り組み。
              </p>
            </div>
            <ol className={styles.definitionSteps}>
              <li>
                <b>観測</b>
                <span>実際の質問と回答を見る</span>
              </li>
              <li>
                <b>比較</b>
                <span>自社と競合の説明差を見る</span>
              </li>
              <li>
                <b>整理</b>
                <span>次に確認する情報を決める</span>
              </li>
            </ol>
          </div>
          <p className={styles.seoNote}>
            SEOをやめる話ではありません。検索結果に加えて、AI回答という新しい観測場所が増える話です。
          </p>
        </section>

        <section className={styles.productSection} id="product">
          <div className={styles.productSectionInner}>
            <div className={styles.productHeading}>
              <p className={styles.sectionLabelLight}>WHAT RECORA SHOWS</p>
              <h2>毎日見るのは、三つだけ。</h2>
              <p>
                質問ごとに、候補、説明、参照情報を同じ画面で確認します。数字を増やすのではなく、社内で「次に何を見るか」を決められる形にします。
              </p>
            </div>
            <MeasurementConsole />
          </div>
        </section>

        <section className={styles.dailySection}>
          <div className={styles.dailyCopy}>
            <p className={styles.sectionLabel}>DAILY MEASUREMENT</p>
            <h2>一度の診断で、結論にしない。</h2>
            <p>
              AIの答えは、質問の表現、AIサービス、確認する時点によって変わります。Recoraは同じ質問軸を毎日確認し、候補・説明・参照情報の変化を残します。
            </p>
          </div>
          <DailyLedger />
        </section>

        <section className={styles.providersSection} aria-labelledby="providers-title">
          <div>
            <p className={styles.sectionLabel}>TARGET AI SERVICES</p>
            <h2 id="providers-title">主要なAIサービスを、同じ質問軸で確認。</h2>
          </div>
          <ul className={styles.providerList}>
            {providerNames.map((provider, index) => (
              <li key={provider}>
                <span>0{index + 1}</span>
                {provider}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.pricingSection}>
          <div className={styles.pricingHeading}>
            <div>
              <p className={styles.sectionLabel}>START SMALL</p>
              <h2>無料で現状を見て、必要なら毎日追う。</h2>
            </div>
            <p>まず1回確認するプランから、継続計測まで。料金はすべて税込みです。</p>
          </div>
          <div className={styles.planTable}>
            {previewPlans.map((plan, index) => (
              <article className={index === 0 ? styles.planRowFeatured : styles.planRow} key={plan.name}>
                <div>
                  <p className={styles.planName}>{plan.name}</p>
                  {index === 0 && <span className={styles.planTag}>最初の確認に</span>}
                </div>
                <p className={styles.planPrice}>{plan.price}</p>
                <p className={styles.planNote}>{plan.note}</p>
                <Link className={styles.planAction} href={plan.href}>
                  {plan.action}
                  <ArrowRight aria-hidden size={15} />
                </Link>
              </article>
            ))}
          </div>
          <div className={styles.allPlansLink}>
            <TextAction href="/pricing">全5プランを比較する</TextAction>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.faqHeading}>
            <p className={styles.sectionLabel}>FAQ</p>
            <h2>よくある質問</h2>
            <p>専門用語より先に、確認したいことから。</p>
          </div>
          <div className={styles.faqList}>
            {recoraMarketingFaqs.map((item) => (
              <details key={item.question}>
                <summary>
                  <span>{item.question}</span>
                  <ChevronDown aria-hidden size={19} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalCtaMap} aria-hidden>
            <span>質問</span>
            <i />
            <span>AI回答</span>
            <i />
            <span>次のページ</span>
          </div>
          <div className={styles.finalCtaContent}>
            <p>FREE PREVIEW / 50 QUESTIONS</p>
            <h2>まず、御社が比べられる質問を決める。</h2>
            <span>
              サービスの特徴と、見込み客が重視する条件から、確認する質問を整理します。
            </span>
            <PrimaryAction href="/signup" inverse>
              無料で見え方を確認する
            </PrimaryAction>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}

function HomeHeader() {
  return (
    <header className={styles.siteHeader}>
      <nav className={styles.navPill} aria-label="主要ナビゲーション">
        <Link className={styles.brand} href="/" aria-label="Recora ホーム">
          <span>R</span>
          <b>Recora</b>
        </Link>
        <div className={styles.navLinks}>
          <a href="#why-now">GEO・LLMOとは</a>
          <a href="#product">プロダクト</a>
          <Link href="/pricing">料金</Link>
          <Link href="/contact">お問い合わせ</Link>
        </div>
        <div className={styles.navActions}>
          <Link className={styles.loginLink} href="/login">
            ログイン
          </Link>
          <Link className={styles.navCta} href="/signup">
            無料で確認する
            <ArrowRight aria-hidden size={14} />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function AnswerDecisionMap() {
  return (
    <figure className={styles.answerMap} aria-labelledby="answer-map-title">
      <figcaption className={styles.mapToolbar}>
        <span>RECORA / AI ANSWER MAP</span>
        <span className={styles.samplePill}>表示例</span>
      </figcaption>
      <div className={styles.mapQuery}>
        <Search aria-hidden size={17} />
        <div>
          <span>比較される質問</span>
          <p id="answer-map-title">AI検索での見え方を確認できるサービスを比較したい</p>
        </div>
      </div>
      <div className={styles.mapCanvas}>
        <div className={styles.mapAnnotationOne}>
          <span>01</span>
          <b>誰が候補に挙がるか</b>
        </div>
        <div className={styles.mapAnnotationTwo}>
          <span>02</span>
          <b>何が違いとして説明されるか</b>
        </div>
        <div className={styles.mapAnnotationThree}>
          <span>03</span>
          <b>どの情報が参照されるか</b>
        </div>

        <div className={styles.answerCore}>
          <div className={styles.answerCoreHeading}>
            <span>AIの回答</span>
            <small>同じ質問軸で確認</small>
          </div>
          <div className={styles.candidateLine}>
            <span>候補</span>
            <b className={styles.ownedCandidate}>自社</b>
            <b>競合A</b>
            <b>競合B</b>
          </div>
          <div className={styles.explanationLine}>
            <span>説明</span>
            <p>
              自社は「質問別の継続計測」、競合Aは「比較のしやすさ」と説明されています。
            </p>
          </div>
          <div className={styles.sourceLine}>
            <span>参照</span>
            <div>
              <b>公式サイト</b>
              <b>料金ページ</b>
              <b>比較記事</b>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.mapFooter}>
        <div>
          <span>毎日計測</span>
          <ol aria-label="月曜から金曜までの確認例">
            <li>月</li>
            <li>火</li>
            <li className={styles.changedDay}>水・変化</li>
            <li>木</li>
            <li>金</li>
          </ol>
        </div>
        <p>質問、AIサービス、確認時点によって結果は変わります。</p>
      </div>
    </figure>
  );
}

function MeasurementConsole() {
  return (
    <figure className={styles.console} aria-labelledby="console-title">
      <figcaption className={styles.consoleBar}>
        <div className={styles.consoleBrand}>
          <span>R</span>
          <b>Recora</b>
          <em>Daily observation</em>
        </div>
        <span className={styles.consoleSample}>表示例</span>
      </figcaption>
      <div className={styles.consoleScope}>
        <div>
          <span>確認する質問</span>
          <p id="console-title">GEO・LLMOサービスを比較する企業は、何を重視する？</p>
        </div>
        <div className={styles.consoleDate}>
          <span>確認</span>
          <b>毎日</b>
        </div>
      </div>
      <div className={styles.consoleGrid}>
        <aside className={styles.consoleNav} aria-label="確認項目">
          <span className={styles.consoleNavActive}>01 候補</span>
          <span>02 説明</span>
          <span>03 参照情報</span>
        </aside>
        <div className={styles.consoleMain}>
          <div className={styles.consoleTableHead}>
            <span>候補</span>
            <span>AIでの説明</span>
            <span>今回</span>
          </div>
          <ConsoleRow name="自社" copy="質問別にAI回答を継続計測" status="候補" owned />
          <ConsoleRow name="競合A" copy="比較情報をまとめて確認" status="候補" />
          <ConsoleRow name="競合B" copy="料金情報の分かりやすさ" status="追加" added />
        </div>
        <div className={styles.consoleSide}>
          <div className={styles.consolePanel}>
            <div className={styles.consolePanelTitle}>
              <Link2 aria-hidden size={15} />
              <span>AIが参照した情報</span>
            </div>
            <ul>
              <li>
                <b>公式サイト</b>
                <span>サービス説明</span>
              </li>
              <li>
                <b>料金ページ</b>
                <span>プラン条件</span>
              </li>
              <li>
                <b>比較記事</b>
                <span>選定観点</span>
              </li>
            </ul>
          </div>
          <div className={`${styles.consolePanel} ${styles.nextPanel}`}>
            <div className={styles.consolePanelTitle}>
              <FileCheck2 aria-hidden size={15} />
              <span>次に確認するページ</span>
            </div>
            <ol>
              <li>
                <span>比較ページ</span>
                <b>優先</b>
              </li>
              <li>
                <span>料金ページ</span>
                <b>確認</b>
              </li>
            </ol>
          </div>
        </div>
      </div>
      <p className={styles.consoleNote}>
        これは表示例です。実際の結果は、質問、AIサービス、確認時点によって変わります。
      </p>
    </figure>
  );
}

function ConsoleRow({
  name,
  copy,
  status,
  owned = false,
  added = false,
}: {
  name: string;
  copy: string;
  status: string;
  owned?: boolean;
  added?: boolean;
}) {
  return (
    <div className={styles.consoleRow}>
      <b className={owned ? styles.ownedName : undefined}>{name}</b>
      <span>{copy}</span>
      <em className={added ? styles.addedStatus : undefined}>{status}</em>
    </div>
  );
}

function DailyLedger() {
  const days = ["月", "火", "水", "木", "金"] as const;
  return (
    <figure className={styles.ledger} aria-labelledby="ledger-title">
      <figcaption>
        <span id="ledger-title">同じ質問を、毎日確認した表示例</span>
        <span className={styles.samplePill}>表示例</span>
      </figcaption>
      <div className={styles.ledgerGrid}>
        <div className={styles.ledgerCorner}>確認項目</div>
        {days.map((day) => (
          <div className={styles.ledgerDay} key={day}>
            {day}
          </div>
        ))}

        <div className={styles.ledgerLabel}>候補</div>
        {days.map((day, index) => (
          <div className={index === 2 ? styles.ledgerChange : styles.ledgerCell} key={`candidate-${day}`}>
            {index === 2 ? "追加" : "確認"}
          </div>
        ))}

        <div className={styles.ledgerLabel}>説明</div>
        {days.map((day, index) => (
          <div className={index === 4 ? styles.ledgerChange : styles.ledgerCell} key={`explain-${day}`}>
            {index === 4 ? "変化" : "確認"}
          </div>
        ))}

        <div className={styles.ledgerLabel}>参照情報</div>
        {days.map((day, index) => (
          <div className={index === 5 ? styles.ledgerChange : styles.ledgerCell} key={`source-${day}`}>
            {index === 5 ? "追加" : "確認"}
          </div>
        ))}
      </div>
      <div className={styles.ledgerSummary}>
        <CircleDot aria-hidden size={16} />
        <p>
          変化があった日だけを強調し、回答内容と参照情報を確認します。変化がない日も、同じ条件で確認した記録として残します。
        </p>
      </div>
    </figure>
  );
}

function PrimaryAction({
  href,
  children,
  inverse = false,
}: {
  href: string;
  children: React.ReactNode;
  inverse?: boolean;
}) {
  return (
    <Link className={inverse ? styles.primaryActionInverse : styles.primaryAction} href={href}>
      {children}
      <ArrowRight aria-hidden size={17} />
    </Link>
  );
}

function TextAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className={styles.textAction} href={href}>
      {children}
      <ArrowRight aria-hidden size={16} />
    </Link>
  );
}

function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerStatement}>AIの答えを、社内で動ける判断材料へ。</p>
      <div className={styles.footerMeta}>
        <Link className={styles.brand} href="/" aria-label="Recora ホーム">
          <span>R</span>
          <b>Recora</b>
        </Link>
        <nav aria-label="フッターナビゲーション">
          <Link href="/product">プロダクト</Link>
          <Link href="/sample">表示例</Link>
          <Link href="/pricing">料金</Link>
          <Link href="/contact">お問い合わせ</Link>
        </nav>
      </div>
    </footer>
  );
}
