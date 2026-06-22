# Recora dashboard / report experience

Recoraのdashboard / reportは、AI検索やAI回答の中でブランドがどう見えているか、競合と比べてどこに差があるか、どの参照元を確認すべきか、次にどの改善候補を判断するかを扱う画面群です。表示は実測DB / read model由来に限定し、旧project fallbackやダミーデータは使いません。

## 画面ごとの役割

- `/dashboard`: 最新レポートへの入口。AI表示率、AI回答数、ブランド言及数、参照出現数を見て詳細へ進む。
- `/dashboard/reports`: レポート一覧。対象ブランド、最新run、AI表示率、AI回答数から調査単位を選ぶ。
- `/dashboard/reports/[slug]`: レポート概要。存在感、競合位置、persona / topicの強弱、参照元状態、次に見る画面を判断する。
- `/conversations`: AI回答の観測ログ。prompt、model、search mode、回答要約、ブランド言及、参照元を回答単位で確認する。
- `/leaderboard`: ブランド比較。non-branded prompt中心でAI表示率、表示回答数、ブランド言及数、Share of Voice、平均順位、競合差を比較する。
- `/sources`: 参照元分析。参照出現数だけでなく、URL / domain、source-to-claim、freshness確認状態から、根拠として使える情報源かを見る。
- `/recommendations`: 改善候補。承認済み施策ではなく、観測に基づく候補として、重要度、根拠、確認状態、次の判断を整理する。

## branded / non-branded の扱い

- ブランド比較の主指標は、対象ブランド名やaliasをprompt本文に含まないnon-branded promptを優先する。
- branded promptは、自社ブランドについてAI回答がどう説明・評価するかを見る検証用promptとして扱う。
- 現時点のDBには明示的な`prompt_type`がないため、`prompts.text`に対象ブランド名またはaliasが含まれるかで暫定判定する。
- 判定できない場合は無理に断定せず、全観測を参考値として表示し、比較スコープに明記する。
- prompt数が10未満の比較は`directional_only`として扱い、ベンチマーク確定値や勝敗判定には使わない。

## 指標定義

- 比較スコープ: `prompts.text` + primary brand aliases。ブランド比較で使うprompt集合。
- AI表示率: `metric_snapshots.ai_visibility`または`brand_mentions.mentioned`のdistinct `conversation_id`から計算。leaderboardではnon-branded scopeで再計算する。
- AI回答数: `ai_conversations`。measurement runで保存された実測AI回答数。
- ブランド表示回答数: `brand_mentions.mentioned = true`のdistinct `conversation_id`。言及回数とは分ける。
- ブランド言及数: `metric_snapshots.ai_mention_count`または`brand_mentions.mention_count`。1回答内の複数言及を含む。
- 参照出現数: `citations.occurrence_count`。同一URLが複数回答で参照された出現数を合算する。
- 参照URL数: `citations.url` / `canonical_url`のdistinct count。citation row数ではない。
- 参照ドメイン数: `citations.domain`のdistinct count。信頼性や主張支持の確認結果ではない。
- Share of Voice: 同一観測スコープ内のブランド言及全体に占める比率。市場シェアではない。
- 平均順位: `brand_mentions.position`または`metric_snapshots.average_position`。未表示回答は順位計算に含めない。
- 競合差: 対象ブランドと比較ブランドのAI表示率または代表指標の差分。leaderboardではnon-branded scopeで再計算する。
- ブランド印象: `brand_mentions.sentiment`。branded prompt内のpositive / neutral / negative / unclearを要約し、弱い根拠は要確認または未判定にする。

## 表示ルール

- metric snapshot、raw observation、citation row、occurrence count、unique domain、brand mention countを混同しない。
- source-to-claimとfreshnessは、確認済みの値と未確認の値を分けて表示する。
- 改善候補は品質ゲートの内部状態と顧客向け表示を分ける。候補は「実行済み」「成果保証」「承認済み施策」として扱わない。
- 主要情報は横スクロール表に閉じ込めず、カード型・要約型で読めるようにする。
- 一部データ取得に失敗しても、取得できたread modelは表示し、画面全体をnullにしない。
