# Golden Review Examples

These examples show the target quality for Recora visual design reviews. They are examples of structure and specificity, not fixed copy to paste blindly.

## Example 1: Heroが弱いLP

- input状況: HeroのH1が大きく、CTAが下がり、Product Mockがfirst viewportで弱い。
- Visual Score: 62/100.
- External lenses used: SaaS LP Reviewer, Tailwind UI Polish, Screenshot QA, Recora Product Truth.
- 一番ダサい原因: Heroが文字の圧で勝負していて、プロダクト証拠が主役になっていない。
- Missing visual assets: browser frame、sample scope row、small trust/method note。
- Recommended charts/diagrams: なし。まずmock hierarchyを優先。
- Priority fixes:
  - issue: H1が重すぎる。
  - why it fails visually: Japanese BtoB SaaSではposter感が出て信頼より圧が勝つ。
  - exact implementation direction: H1をdesktop 44-56px相当にし、CTAとmockをfirst viewport内に戻す。
  - acceptance criteria: desktop 2-3行、375px 3-4行、CTA visible。
- Codex implementation prompt: use `golden-codex-prompts.md` Hero + Product Mock改善.

## Example 2: Product Mockが弱いLP

- input状況: mock内がランダムカードで、dashboard/reportに見えない。
- Visual Score: 58/100.
- External lenses used: Product Mock Designer, Dashboard Density, Tailwind UI Polish, Product Truth.
- 一番ダサい原因: mockが実プロダクトではなくカード寄せ集めに見える。
- Missing visual assets: ProductBrowserFrame、topbar/sidebar、scope row。
- Recommended charts/diagrams: competitor ranking bar、source domain list。
- Priority fixes:
  - issue: Dashboard Card Pile。
  - why it fails visually: 情報階層がなく、SaaS画面として信じにくい。
  - exact implementation direction: topbar/scope/KPI/table/source panelへ再構成。
  - acceptance criteria: 5 UI objects以上、sample label visible、fake provider badgesなし。
- Codex implementation prompt: use `golden-codex-prompts.md` Product Mock密度改善.

## Example 3: SE Ranking風にしたいが似ていないLP

- input状況: 白背景と余白はあるが、mockが小さく、CTAやカード密度が弱い。
- Visual Score: 64/100.
- External lenses used: Reference-Site Similarity, SaaS LP Reviewer, Product Mock Designer.
- 一番ダサい原因: 参考サイトの色や余白だけを見て、プロダクトプレビューの大きさと密度を再現できていない。
- Missing visual assets: large horizontal product preview、FAQ/final CTA rhythm、compact card mini UI。
- Recommended charts/diagrams: KPI + ranking table inside mock.
- Priority fixes:
  - issue: reference-site similarity is structural, not visual-color only.
  - why it fails visually: white spaceだけではpremiumに見えない。
  - exact implementation direction: Heroをmock主役の構図にし、feature cardsにmini UIを追加。
  - acceptance criteria: similarity comment explains spacing/mock/card/CTA deltas without copying assets.
- Codex implementation prompt: use Hero + Product Mock改善 plus Feature CardsにミニUI追加.

## Example 4: サンプル表記が強すぎるLP

- input状況: SAMPLE watermarkがmockを覆い、未完成感が強い。
- Visual Score: 66/100.
- External lenses used: Screenshot QA, Product Mock Designer, Recora Product Truth.
- 一番ダサい原因: 誤認防止ラベルが主役になり、プロダクト自体が見えない。
- Missing visual assets: calm sample pill、method caption、scope row。
- Recommended charts/diagrams: 既存chartは維持。precisionとlabelを調整。
- Priority fixes:
  - issue: Sample Disclaimer Dominance。
  - why it fails visually: buyerが「まだ使えない」と感じる。
  - exact implementation direction: watermarkをtoolbar/scope pillへ移し、method noteで補足。
  - acceptance criteria: label visible but not obstructing content。
- Codex implementation prompt: Product Mock密度改善またはSample Reportの見栄え改善のsample label sectionだけ。

## Example 5: モバイルが弱いLP

- input状況: 375pxでmock全体が縮み、文字が読めず、CTAも遅い。
- Visual Score: 55/100.
- External lenses used: Screenshot QA, Mobile 375px Diagnosis, Product Mock Designer, Tailwind UI Polish.
- 一番ダサい原因: desktop mockを縮小しただけで、mobile用のproof excerptになっていない。
- Missing visual assets: mobile mock excerpt frame、stacked KPI pair、source chips。
- Recommended charts/diagrams: mobileではchartsを減らし、3-row listへ。
- Priority fixes:
  - issue: Mobile Mock Shrinkage。
  - why it fails visually: product proofが模様化している。
  - exact implementation direction: KPI pair + 3-row ranking + source chipsへ切り替える。
  - acceptance criteria: 375px no overflow、主要文字 readable、sample label visible。
- Codex implementation prompt: use `golden-codex-prompts.md` Mobile visual cleanup.
