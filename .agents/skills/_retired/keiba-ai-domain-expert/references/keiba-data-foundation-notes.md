# Keiba Data Foundation Notes

このファイルは、データ基盤そのものを設計・実装するための仕様ではない。作成済みまたは作成中の競馬AIデータを監査し、モデル開発に使える状態か判断するためのチェックリストとして使う。粒度、ID、取得時点、ラベル、分割、評価、実験管理が曖昧な状態では、モデル作成よりデータ監査を優先する。

## A. データ監査の目的

- モデルを強くする前に、安全で再現可能なデータセットになっているか確認する。
- 予測時点で使える情報と使えない情報を分ける。
- データの粒度、ID、取得時点、ラベル、分割、評価を明確にする。
- あとから同じ実験を再現できる状態にする。

## B. 監査対象のデータレイヤー

- raw:
  - 取得したままの元データ。
  - 加工しない。
  - source、取得日時、ファイル名、期間を記録する。
- normalized:
  - カラム名、型、日付、IDをそろえたデータ。
  - まだ特徴量は作らない。
- snapshots:
  - 予測時点ごとのスナップショット。
  - 前日、枠順確定後、馬体重発表後、オッズ取得時点などで分ける。
- features:
  - 学習用特徴量。
  - 予測時点以前の情報だけで作る。
- labels:
  - 着順、3着以内、複勝的中条件、払戻、ROIなど。
  - 予測特徴量とは分ける。
- splits:
  - train / valid / test の定義。
  - 時系列分割を固定して保存する。
- reports:
  - データ監査、リーク監査、特徴量計画、検証計画、モデル結果。

## C. データ契約 Data Contract

各データセットごとに以下を必ず記録する。

- `dataset_name`
- `source`
- `raw_file`
- `created_at`
- `data_period_start`
- `data_period_end`
- `row_grain`
  - 1行がレース単位か、出走馬単位か、オッズ時点単位か、払戻単位か。
- `primary_key`
- `join_key`
- `date_column`
- `race_id` の定義
- `horse_id` の定義
- `required_columns`
- `optional_columns`
- `target_columns`
- `payout_columns`
- `leakage_risk_columns`
- `availability_time`
  - そのカラムがいつ使えるか。
- `allowed_prediction_timing`
- `forbidden_as_feature`
- `notes`

## D. ID設計ルール

競馬AIではIDが曖昧だと壊れる。必ず確認するIDは、`race_id`、`horse_id`、`jockey_id`、`trainer_id`、`race_date`、`track`、`race_number`、`horse_number`、`frame_number`。

- `race_id` は同一レースを一意に識別できること。
- `horse_id` がない場合、馬名だけに頼らない。
- `jockey_name` / `trainer_name` は同姓同名や表記揺れに注意する。
- `race_date + track + race_number` で `race_id` を作る場合は、重複チェックを行う。
- `horse_id` は履歴集計に使うが、生IDをそのまま特徴量に入れる場合は過学習に注意する。

## E. 予測時点 availability_time ルール

各カラムに「いつ使えるか」を持たせる。

代表値:

- `before_entry`
- `after_entry`
- `after_frame_draw`
- `race_day_morning`
- `before_body_weight`
- `after_body_weight`
- `odds_snapshot`
- `final_odds`
- `post_race`

ルール:

- 予測時点より後の `availability_time` を持つカラムは特徴量に使わない。
- `final_odds` は実際に購入できる時点と整合しない場合、リーク疑いとして扱う。
- `body_weight` は発表前予測では使わない。
- `payout`、`finish_position`、`last_3f`、`corner_order`、`margin` は `post_race` 情報として扱う。

## F. 典型テーブルの粒度

以下の粒度を混ぜない。

- races:
  - 1行1レース。
- runners:
  - 1行1出走馬。
- odds_snapshots:
  - 1行1レース×1馬×1取得時点。
- payouts:
  - 1行1レース×券種または組み合わせ。
- horse_history:
  - 1行1馬×過去レース。
- jockey_stats:
  - 1行1騎手×集計時点。
- trainer_stats:
  - 1行1厩舎×集計時点。
- features:
  - 1行1出走馬×予測時点。
- labels:
  - 1行1出走馬または1行1レース×目的変数。

## G. ラベル設計

目的変数と評価用カラムを分ける。

候補:

- `is_win`
- `is_top2`
- `is_top3`
- `is_place_hit_by_rule`
- `finish_position`
- `rank_in_race`
- `win_payout`
- `place_payout`
- `roi`
- `expected_value`

注意:

- `is_top3` と実際の複勝的中条件を混同しない。
- 複勝ROI評価では頭数に応じた的中条件を使う。
- `payout` は特徴量ではなく評価用。
- `labels` は `features` と別に管理する。

## H. 集計特徴量の生成ルール

以下の集計特徴量は危険なので安全ルールを必ず守る。

対象:

- 騎手勝率
- 騎手複勝率
- 厩舎勝率
- 厩舎複勝率
- 馬の同距離成績
- 馬の同競馬場成績
- 騎手×競馬場
- 騎手×距離
- 厩舎×競馬場
- 馬×馬場
- 人気帯別成績
- オッズ帯別成績

ルール:

- 対象レース以前のデータだけで作る。
- `as_of_date` を必ず持つ。
- 集計期間を記録する。
- 母数 `count` を必ず持つ。
- 母数が少ない場合はスムージングまたは欠損扱いを検討する。
- target encoding は時系列リークに注意する。
- 特徴量重要度が高すぎる集計特徴量はリークを疑う。

## I. データ品質チェック

データ取り込み後に必ず確認する。

- 必須カラムの有無。
- 型。
- 欠損率。
- 重複。
- 主キー一意性。
- `race_id` ごとの頭数。
- `finish_position` の範囲。
- `odds` の範囲。
- `popularity` の範囲。
- `date` の単調性。
- `track` の値。
- `distance` の値。
- `surface` の値。
- 同一 `race_id` 内の `horse_number` 重複。
- 払戻があるレースとないレース。
- オッズ取得時点の欠損。
- `post_race` 情報が `features` に混入していないか。

## J. データセットバージョン管理

モデル評価に使ったデータセットを再現できるようにする。

記録するもの:

- `dataset_version`
- `raw_data_hash`
- `feature_config_version`
- `label_config_version`
- `split_config_version`
- `created_at`
- `row_count`
- `race_count`
- `period`
- `notes`

## K. 検証分割の保存

train / valid / test をその場のコードだけにしない。

記録するもの:

- `split_name`
- `train_start` / `train_end`
- `valid_start` / `valid_end`
- `test_start` / `test_end`
- `split_reason`
- `race_id list` または `date range`
- `leakage_check_result`

ルール:

- ランダム分割を基本にしない。
- 時系列分割を基本にする。
- walk-forward を検討する。
- 評価に使った split は保存する。

## L. 実験管理

モデルごとに以下を記録する。

- `experiment_id`
- `dataset_version`
- `feature_set`
- `target_definition`
- `prediction_timing`
- `model_type`
- `parameters`
- `train_period`
- `valid_period`
- `test_period`
- `metrics`
- ROI結果
- calibration結果
- feature_importance
- `notes`

ルール:

- どの実験がどのデータで行われたか分かるようにする。
- metrics だけでなく `dataset_version` と `split_config` を残す。
- 勝てた実験ほどリーク監査を強く行う。

## M. モデル開発に進む前の利用条件

初期データ基盤は、以下を満たしてから本格モデル作成へ進む。

- 主要データの粒度が明確。
- `race_id` / `horse_id` / `date` が安定。
- 予測時点が定義済み。
- `availability_time` が主要カラムに付与されている。
- `features` と `labels` が分離されている。
- `post_race` 情報が `features` に混ざっていない。
- train / valid / test の時系列 split が定義済み。
- ベースライン評価が可能。
- ROI評価用の払戻データが分離されている。
- `dataset_version` を記録できる。

## N. データ基盤で危険な状態

以下ならモデル作成に進まない。

- `race_id` が不安定。
- `horse_id` がなく履歴集計が曖昧。
- `date` が信用できない。
- 1行の粒度が混ざっている。
- `finish_position` や `payout` が特徴量側に入っている。
- オッズの取得時点が不明。
- 馬体重の発表時点が不明。
- 前走集計に未来が混ざっている可能性がある。
- train / test の分け方が未定。
- ROI評価に使う払戻が整理されていない。
