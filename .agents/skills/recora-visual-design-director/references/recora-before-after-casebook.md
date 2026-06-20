# Recora Before / After Casebook

Use this casebook before reviewing Recora LP, Dashboard previews, Sample Report previews, and Codex implementation prompts. It records Recora-specific failures that have already appeared, so the skill can detect the same shape quickly and prescribe a concrete fix.

## Case 1: 左巨大コピー + 右縦長モックでSE Rankingに似なかった

- 症状: 左に巨大H1、右に縦長の細いモック。白余白はあるが、プロダクト画面が弱く、SE Ranking的な大きいSaaSプレビューに見えない。
- なぜ悪く見えるか: 見た目だけ2カラムにしても、Product Mockの横長感、密度、カードリズム、CTAの重心が足りず、テンプレの左右分割に見える。
- 外部lensでの判定: External SaaS LP Reviewer Lens は above-the-fold の主役不足、External Product Mock Designer Lens は dashboard hierarchy 不足、Reference-Site Similarity は color/spacingだけで構造差分が大きい。
- 修正方針: Heroを中央寄せまたは横長モック主役へ寄せる。H1を少し小さくし、Product Mockをfirst viewportの最大視覚物にする。
- 追加すべき素材: browser frame、淡いドットグリッド、薄いR watermark、mock toolbarのsample pill。
- 追加すべきミニUI: KPI row、query/source table、competitor gap bar、source domain chips。
- Codexへ出すべき指示: `Hero + Product Mock改善` のgolden promptを使い、`app/page.tsx` のHeroだけを対象に、外部素材コピー禁止とProduct Truth確認を明記する。
- Acceptance criteria: desktop first viewportでH1/CTA/横長Product Mockが同時に見える。Mockはtopbar/scope/KPI/table/source panelを含む。375pxではmock excerptに切り替わる。

## Case 2: Heroは中央寄せになったがH1が重すぎた

- 症状: Hero全体は中央寄せになったが、H1が大きすぎ、3-4行に重く折れてCTAやmockを押し下げる。
- なぜ悪く見えるか: 日本語BtoB SaaSの信頼感よりポスター広告の圧が勝ち、Product Mockの証拠性が下がる。
- 外部lensでの判定: External Screenshot QA Lens は CTA遅延、External Tailwind UI Polish Lens は typography scale過大、Recora Product Truth Lens はコピーが強すぎると機能過剰訴求に見える。
- 修正方針: H1をdesktop 44-56px相当に収め、line-heightを1.12-1.22にし、自然な2-3行へ再配置する。
- 追加すべき素材: H1下の短いsample/method note、CTA周辺の静かな trust row。
- 追加すべきミニUI: Hero直下に小さなsample query pillまたはsource chip。
- Codexへ出すべき指示: `Hero + Product Mock改善` promptでH1サイズ、max-width、CTA位置、mock上げを指定する。
- Acceptance criteria: desktopでH1が2-3行、375pxで3-4行以内。CTAがfirst viewport内に残る。H1がmockより強すぎない。

## Case 3: Product Mockがカード寄せ集めに見えた

- 症状: 白い大枠の中にランダムなカードが並び、dashboardやreportに見えない。
- なぜ悪く見えるか: SaaS画面としての情報階層がなく、実プロダクトではなく装飾用カードに見える。
- 外部lensでの判定: External Product Mock Designer Lens は `Dashboard card pile`、External Dashboard Density Lens は scope/filter/table/log不足。
- 修正方針: topbar/sidebar、scope row、KPI、ranking/table、source/log/insight panel、status stripへ組み替える。
- 追加すべき素材: ProductBrowserFrame、dashboard sidebar/topbar、sample toolbar。
- 追加すべきミニUI: Query ranking、AI answer log、source domain list、recommendation status row。
- Codexへ出すべき指示: `Product Mock密度改善` promptでProduct Mockのみ対象にする。
- Acceptance criteria: mock内に最低5つの意味あるUI objectsがある。random cardsが消え、sample labelがtoolbar/scope rowにある。

## Case 4: サンプル表記が強すぎて未完成感が出た

- 症状: 巨大なSAMPLEや濃い警告風の表記がmock全体を覆い、プロダクトが見えにくい。
- なぜ悪く見えるか: 誤認防止より未完成感が勝ち、買い手が「まだ使えないもの」と感じる。
- 外部lensでの判定: External Screenshot QA Lens は main content obstruction、Recora Product Truth Lens は disclosure必要だがdominance過剰。
- 修正方針: sample labelをtoolbar、scope row、corner pill、method noteへ移す。薄すぎず、主役を邪魔しない。
- 追加すべき素材: small sample pill、method caption、scope row note。
- 追加すべきミニUI: sample valuesの横に`表示例` chip、method note row。
- Codexへ出すべき指示: Product MockまたはSample Reportのsample labelだけを対象に、巨大overlayを削る。
- Acceptance criteria: sample labelは目視で分かるが、mockの表/数値/CTAを覆わない。Product Truth riskが下がる。

## Case 5: Feature Cardsが文章箱になった

- 症状: Feature Cardsが見出しと本文だけで、カード内にproduct proofやdata shapeがない。
- なぜ悪く見えるか: SaaS機能の説明が抽象的で、AIテンプレの汎用カード列に見える。
- 外部lensでの判定: External SaaS LP Reviewer Lens は proof不足、External Tailwind UI Polish Lens は density不足、External Product Mock Designer Lens は mini UI欠落。
- 修正方針: 各カードに1つだけミニUIを入れる。長文を減らし、table/bar/log/chipで情報密度を出す。
- 追加すべき素材: mini table frame、ranking bar、answer log card、source domain card。
- 追加すべきミニUI: Feature Card Mini Table、Competitor Ranking Mini Card、AI Answer Log Mini Card。
- Codexへ出すべき指示: `Feature CardsにミニUI追加` promptを使い、3カードまでに絞って実装。
- Acceptance criteria: 各カードに1つの意味あるmini UIがあり、本文は短い。375pxでも1カードが長すぎない。

## Case 6: Final CTAがただの緑帯になった

- 症状: ページ末尾が濃い緑の帯とボタンだけで、安いテンプレの締めに見える。
- なぜ悪く見えるか: それまでのProduct Mockやreport proofとつながらず、最後に新しい信頼を作れていない。
- 外部lensでの判定: External Conversion CTA Lens は actionはあるがgravity不足、External Product Mock Designer Lens は product echo不足。
- 修正方針: Final CTAに薄いreport/dashboard ghost mock、dot grid、R watermarkを低opacityで入れる。CTA本文は短く、証拠と行動をつなぐ。
- 追加すべき素材: Final CTA ghost mock、R watermark、subtle dot grid。
- 追加すべきミニUI: faint report silhouette、small source chip row。
- Codexへ出すべき指示: `Final CTA素材追加` promptでFinal CTAだけを対象にする。
- Acceptance criteria: CTAは緑帯だけでなくproduct memoryを持つ。装飾が本文/ボタンより強くない。新しい成果訴求を追加しない。

## Case 7: モバイルでProduct Mockが小さくなりすぎた

- 症状: desktop mock全体を375pxに縮小し、文字もチャートも読めない。
- なぜ悪く見えるか: 「本物っぽい画面」ではなく細かい模様になり、product proofが消える。
- 外部lensでの判定: External Screenshot QA Lens は mobile unreadable、External Product Mock Designer Lens は mobile crop strategy不足。
- 修正方針: 全体縮小ではなく、KPI pair + 3-row table + source chips のexcerptへ切り替える。
- 追加すべき素材: mobile mock excerpt frame、cropped table、stacked source chips。
- 追加すべきミニUI: two KPI cards、3-row ranking list、source domain mini list。
- Codexへ出すべき指示: `Mobile visual cleanup` promptで375pxのProduct Mockだけを整理。
- Acceptance criteria: 横スクロールなし。mock内の主要文字は読める。sample labelが残る。CTAが早い位置に残る。
