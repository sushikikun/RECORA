# Recora Documentation Map

このディレクトリには、現在の正式方針、実装設計、Phase別runbook、開発手順が混在している。文書間で内容が異なる場合は、次の優先順位で判断する。

## 優先順位

1. ユーザーが直近に明示した決定
2. `docs/recora-post-launch-operations-architecture.md`
3. 現在の製品・測定・データモデルに対応する正式設計資料
4. `docs/recora-dev-workflow.md`などの開発・安全運用手順
5. Phase別runbook、過去のhandoff、検証用メモ

## ローンチ後運用構造の正本

- [`recora-post-launch-operations-architecture.md`](./recora-post-launch-operations-architecture.md)

この文書は、次の正式方針を定義する。

- 顧客向け画面と管理者向け画面
- 運用制御層、測定・証跡層、公開レポート層
- `api / publication / measurement / control / audit`の論理分離
- 公開レポートの版管理と現在公開版ポインタ
- `ready`と`published`の分離
- 四段階品質ゲート
- Queue、retry、idempotency
- provider非依存の測定モデル
- 監査ログ、権限、公開安全性
- 既存Phase 1構造からの段階移行

## Phase 1資料の扱い

次の文書は、管理者運用型デモを安全に動かすための暫定runbookである。

- `recora-phase1-admin-demo-launch.md`
- `recora-phase1-admin-measurement-cycle.md`

これらは既存Phase 1処理の実行、安全確認、移行元の理解には使用できる。ただし、ローンチ後の完成形、顧客公開モデル、最終的なDB境界、複数provider運用を決定する正本ではない。

Phase 1資料と正式アーキテクチャが矛盾する場合は、既存処理を破壊せず互換性を維持しながら、正式アーキテクチャへ移行する。

## 変更時のルール

- 新しいアーキテクチャ判断を過去のhandoffだけに追加しない
- 正式方針を変更する場合は正本文書も更新する
- Phase限定の例外には対象Phaseと終了条件を明記する
- 現在の実装と将来方針を同じ状態として記述しない
- 実装済み、部分実装、未実装を区別する
- 旧構造を廃止する前に移行経路とrollback条件を定義する
