# Visual Failure Patterns

Use this dictionary to name recurring Recora design failures quickly. Always pair the pattern with a fix direction and acceptance criteria.

## Hero Poster Syndrome

- 見た目の症状: H1が大きすぎ、heroがポスターのように見える。CTAやmockが下がる。
- 原因: メッセージの強さを文字サイズで解決しようとしている。
- 修正方向: H1を縮め、Product MockとCTAを同じfirst viewportに戻す。
- Tailwind実装ヒント: `text-3xl sm:text-4xl lg:text-5xl`, `leading-tight`, `max-w-4xl`, `gap-8`.
- 再発防止チェック: desktop 2-3行、375px 3-4行、CTA visible。

## Dashboard Card Pile

- 見た目の症状: Product Mockがランダムカードの集合に見える。
- 原因: topbar/scope/KPI/table/source panelの階層がない。
- 修正方向: Product Mockをdashboard blueprintに組み替える。
- Tailwind実装ヒント: outer browser frame + `grid lg:grid-cols-[180px_1fr_280px] gap-4`.
- 再発防止チェック: 5つ以上の意味あるUI objects、random metricなし。

## Sample Disclaimer Dominance

- 見た目の症状: SAMPLE表示が大きく、未完成品のように見える。
- 原因: 誤認防止のためのlabelがmain contentを覆っている。
- 修正方向: toolbar/scope row/corner pill/method noteへ移す。
- Tailwind実装ヒント: `rounded-full border bg-emerald-50 px-2.5 py-1 text-xs`.
- 再発防止チェック: labelは見えるが、表・数値・CTAを覆わない。

## Empty White Space

- 見た目の症状: 余白は広いが、スカスカに見える。
- 原因: 余白に対してproduct proofやmini UIの密度が足りない。
- 修正方向: 余白を削るより、mock/table/chip/barで密度を足す。
- Tailwind実装ヒント: section `py-16 sm:py-20`, inner `gap-8`, card `p-5 sm:p-6`.
- 再発防止チェック: 各sectionにvisual proofが1つ以上ある。

## Weak Product Mock

- 見た目の症状: mockが小さい、薄い、読めない、機能が分からない。
- 原因: mockが主役ではなく装飾扱いになっている。
- 修正方向: Hero Large Product MockまたはSample Report Previewへ昇格。
- Tailwind実装ヒント: `max-w-6xl`, `rounded-2xl`, one soft outer shadow, inner borders.
- 再発防止チェック: mockにscope/KPI/table/sourceがある。

## Text-Only Feature Card

- 見た目の症状: Feature Cardが見出しと本文だけ。
- 原因: product capabilityを文章で説明しすぎている。
- 修正方向: 各カードへ1つのmini UIを追加。
- Tailwind実装ヒント: `mt-5 rounded-lg border bg-slate-50/70 p-3`.
- 再発防止チェック: cardごとにtable/bar/log/chipのいずれかがある。

## Over-Green Interface

- 見た目の症状: 緑が多すぎ、すべてがprimaryに見える。
- 原因: brand colorをsemantic colorとして使い分けていない。
- 修正方向: deep greenをCTA/activeに限定し、構造はwhite/slate/pale greenへ戻す。
- Tailwind実装ヒント: `bg-white`, `border-slate-200`, `text-slate-900`, `bg-emerald-50` for accents.
- 再発防止チェック: primary greenは1 viewport内で数か所に限る。

## Fake Precision Chart

- 見た目の症状: 87.43%など精密すぎる値がsample chartに出る。
- 原因: sample dataが実測値のように見える。
- 修正方向: 丸めたsample values、method note、sample labelを追加。
- Tailwind実装ヒント: `tabular-nums`, rounded values, method caption `text-xs text-slate-500`.
- 再発防止チェック: precise decimalなし、source/method noteあり。

## CTA Without Gravity

- 見た目の症状: CTAが薄い、押せなそう、複数が同じ重さ。
- 原因: action hierarchyとbutton affordanceが弱い。
- 修正方向: 1 primary + quiet secondaryへ整理。
- Tailwind実装ヒント: primary `h-11 sm:h-12 rounded-lg bg-emerald-900 text-white`.
- 再発防止チェック: primary actionが1つ、focus-visibleあり、copyがtruth-safe。

## Mobile Mock Shrinkage

- 見た目の症状: desktop mockをそのまま縮小して読めない。
- 原因: mobile用excerpt設計がない。
- 修正方向: KPI pair + 3-row list + source chipsへ切り出す。
- Tailwind実装ヒント: `grid-cols-1`, `min-w-0`, hide nonessential columns, `text-xs`以上。
- 再発防止チェック: 375pxで横スクロールなし、sample label visible。
