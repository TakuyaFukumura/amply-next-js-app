# Changelog

このプロジェクトのすべての変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいており、
このプロジェクトは [Semantic Versioning](https://semver.org/lang/ja/) に従っています。

## [Unreleased]

### Added

- 家電のアンペア数を管理・集計し、上限と比較するダッシュボードを追加
- CSVカタログ検証、家電操作、積み上げグラフ、入力・集計テストを追加

### Removed

- SQLiteメッセージデモ、API、関連依存とテストを削除

## [0.1.1] - 2026-10-01

### Fixed

- `main` 以外のブランチが Vercel にデプロイされないよう、除外パターンを `**` に変更
