# Recora dashboard / report experience

この画面群は、AI検索でブランドがどの程度見えているか、競合と比べてどこに差があるか、どの参照元を根拠として確認すべきかを判断するための本番ダッシュボードです。表示は実測DB / read model由来に限定し、旧project fallbackやダミーデータは使いません。

## 画面ごとの役割

- `/dashboard`: 最新レポートの入口。直近のAI表示率、AI回答数、ブランド言及数、参照出現数から、詳しく見るべきレポートへ進む。
- `/dashboard/reports`: レポート一覧。対象ブランド、最新run、AI表示率、AI回答数から、調査単位を選ぶ。
- `/dashboard/reports/[slug]`: レポート概要。AI検索上の存在感、競合との位置、persona / topicの強弱、引用・参照元の状態、次に見る画面を判断する。
- `/conversations`: AI回答の観測ログ。prompt、model、search mode、回答要約、ブランド言及、参照元を回答単位で確認する。
- `/leaderboard`: ブランド比較。表示回答数、ブランド言及数、Share of Voice、平均順位、競合差、同時出現から、AI回答内での存在感を比較する。
- `/sources`: 参照元分析。参照出現数だけでなく、URL / domain、source-to-claim、freshness確認状態から、根拠として使える情報源かを見る。
- `/recommendations`: 改善候補。承認済み施策ではなく、観測に基づく候補として、重要度、根拠、確認状態、次の判断を整理する。

## 指標定義

- AI表示率: `metric_snapshots.ai_visibility`。観測AI回答のうち対象ブランドが表示された回答の割合。
- AI回答数: `ai_conversations`。measurement runで保存された実測AI回答数。
- ブランド表示回答数: `brand_mentions.mentioned = true` のdistinct `conversation_id`。表示された回答数であり、言及回数ではない。
- ブランド言及数: `metric_snapshots.ai_mention_count`、詳細画面では `brand_mentions.mention_count`。1回答内の複数言及を含む。
- 参照出現数: `citations.occurrence_count`。同一URLが複数回答で参照された出現数を合算する。
- 参照URL数: `citations.url` / `canonical_url` のdistinct count。
- 参照ドメイン数: `citations.domain` のdistinct count。
- Share of Voice: `metric_snapshots.share_of_voice`。比較ブランド全体の言及量に対する比率。
- 平均順位: `metric_snapshots.average_position`、詳細では `brand_mentions.position` の平均。
- 競合差: `metric_snapshots.competitive_gap`。対象ブランドと主要競合のAI表示率 / Share of Voice差。

## 表示ルール

- metric snapshot、raw observation、citation row、occurrence countは混同しない。
- source-to-claimとfreshnessは、確認済みの値と未確認の値を分けて表示する。
- 改善候補は品質ゲートの内部状態と顧客向け表示を分ける。候補は「実行済み」「成果保証」「承認済み施策」として扱わない。
- 一部データ取得に失敗しても、取得できたread modelは表示し、画面全体をnullにしない。
