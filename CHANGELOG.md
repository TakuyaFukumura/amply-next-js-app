# Changelog

このプロジェクトのすべての変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
このプロジェクトは [Semantic Versioning](https://semver.org/lang/ja/) に従っています。

## [0.3.5] - 2026-09-02

### 変更

- APIレスポンスの成功・エラー形式を型と実行時検証で統一し、失敗時の再試行操作を追加
- 改善計画から対応済みの項目を削除し、残りの課題を整理

## [Unreleased]

## [0.3.4] - 2026-09-02

### 変更

- ダークモード切り替えの初期化タイミングを調整し、保存済みテーマがある場合でも Hydration Mismatch が発生しないよう修正
- ダークモード状態をテーマから導出し、利用できない`localStorage`でも切り替えられるよう修正

## [0.3.3] - 2026-09-02

### 修正

- 作成日時が同じメッセージでもIDを使って最新のメッセージを安定して取得するよう修正

## [0.3.2] - 2026-09-02

### 削除

- テーマ切り替えボタンの「ライトモード」「ダークモード」表示ラベルを削除

## [0.3.1] - 2026-03-04

### 削除

- `public/` 内の未参照 SVG ファイル（file.svg, globe.svg, next.svg, vercel.svg, window.svg）を削除
- `tailwind.config.ts` を削除（Tailwind CSS v4 の CSS ファースト設定に伴い不要）
- `src/app/globals.css` の `@theme inline` ブロックを削除（未使用の Tailwind カラー・フォントトークン定義）
- `src/app/globals.css` の `:root` / `.dark` CSS 変数ブロックを削除し、`body` スタイルを直接カラーコードに変更
