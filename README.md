# Amply

家庭で使う家電のアンペア数を一覧・集計し、設定した上限と比較する目安アプリです。家電カタログはCSVから読み込み、家電や上限の変更はブラウザーを開いている間だけ保持します。

## 機能

- 初期値20.0A、最大60.0A、0.1A刻みの上限設定
- 家電の有効／無効、起動中／通常運転の個別切り替え（冷蔵庫・エアコン・PC系は初期状態で使用中）
- 家電の追加・編集・削除（同名登録可、合計50台まで）
- 0.1A単位の整数演算による合計、残り／超過量の表示
- 上位10台と「その他」の積み上げグラフ、上限マーカー
- CSVの全件検証、読み込みエラー表示、再試行
- ダークモード、キーボード操作、読み上げ向けラベル

初期カタログのアンペア数は100V家電の一般的な参考値で、機種差があります。200V家電や個別回路の負荷は扱わず、実際のブレーカー遮断を保証しません。

家電カタログは `public/data/appliances.csv` にあります。ヘッダーは `name,runningAmps,startupAmps,initiallyEnabled,note` の順で、UTF-8 BOM、LF/CRLF、引用符付きフィールドに対応します。CSVに不正な行があれば、カタログ全体を読み込まず原因を表示します。

## 技術スタック

- Next.js App Router / React / TypeScript
- Tailwind CSS 4 とアプリ固有CSS
- Jest / React Testing Library

## 開発

Node.js 26.x以上とnpmを用意し、依存関係をインストールします。

```bash
npm install
npm run dev
```

ブラウザーで [http://localhost:3000](http://localhost:3000) を開きます。

```bash
npm test -- --runInBand
npm run lint
npm run build
```

## 主な構成

```text
public/data/appliances.csv              # 初期家電カタログ
src/app/page.tsx                        # アンペア状況画面
src/app/components/ampere/              # ダッシュボード・家電一覧・フォーム・グラフ
src/lib/ampere/types.ts                 # ドメイン型
src/lib/ampere/validation.ts            # 数値検証と表示
src/lib/ampere/csv.ts                   # CSV解析・全件検証
src/lib/ampere/calculations.ts          # 集計・グラフ区分
__tests__/src/lib/ampere/               # ドメイン単体テスト
__tests__/src/app/page.test.tsx         # 画面テスト
docs/                                   # 要件定義・設計・実装計画
```

## 制約

- 家電の変更と上限値は永続化しません。リロードするとCSVと20.0Aの初期状態に戻ります。
- 初期値は製品の定格値・実測値・保証値ではありません。家全体や回路の実際の電流を測定するものでもありません。
- 設備容量の判断には設備仕様を確認し、必要に応じて有資格者へ相談してください。
