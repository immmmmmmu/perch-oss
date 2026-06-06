# Contributing to perch

`perch` は OSS package 群を中心に開発しています。

## 1. 対象範囲（`packages/*`、MIT）

歓迎する貢献:

- バグ修正
- パフォーマンス改善
- 新しい `defineSource` アダプター
- 公式テーマ追加 / 改善
- i18n 翻訳（`packages/i18n/messages/<locale>.json`）

手順:

1. Issue で議論（小さな修正は省略可）
2. fork → ブランチ作成 → 実装
3. `pnpm test` / `pnpm lint` / `pnpm typecheck` を pass
4. `pnpm changeset` で changeset を追加
5. PR を作成

すべての PR は **Contributor License Agreement (CLA)** に同意済みであることが条件です。CLA は将来的なライセンス調整の余地を残すための軽量なものです。

セキュリティ脆弱性の報告は Issue ではなく直接メールで: security@imdaas.com

## 2. 開発ワークフロー

- TDD（Red → Green → Refactor）必須
- 80% カバレッジ閾値（`@perch/core` は 90%）

## 3. コミュニケーション

- バグ・機能要望: GitHub Issues
- 議論・質問: GitHub Discussions
- セキュリティ: security@imdaas.com
