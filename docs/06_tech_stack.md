# 技術スタック最終案

## 全体方針

| 領域          | 採用技術                    | 方針                                    |
| ----------- | ----------------------- | ------------------------------------- |
| フレームワーク     | **Next.js App Router**  | Webアプリ本体。管理画面・API・認証連携をまとめる           |
| 言語          | **TypeScript**          | 型安全に実装する                              |
| UI          | **Mantine**             | 管理画面、フォーム、タブ、モーダル、日付入力に使う             |
| D&D         | **dnd-kit**             | カンバンのドラッグ&ドロップに使う                     |
| 認証          | **Clerk**               | Googleログイン、ユーザー管理                     |
| DB          | **Turso**               | 軽量なSQLite系DBとして使う                     |
| ORM         | **Drizzle ORM**         | TypeScriptでDBスキーマ・クエリ管理               |
| AI実装        | **Vercel AI SDK**       | OpenAI / Gemini / Claude などを差し替えやすくする |
| バリデーション     | **Zod**                 | AI出力JSON、フォーム入力、API入力の検証              |
| Googleカレンダー | **Google Calendar API** | 面談予定の登録                               |
| 課金          | **Stripe**              | 将来公開時のサブスク課金                          |
| デプロイ        | **Vercel**              | Next.jsと相性が良いので採用                     |
| パッケージ管理     | **pnpm**                | 開発用パッケージ管理                            |
| テスト         | **Vitest / Playwright** | 後続で導入                                 |

Next.jsはApp Routerを前提にし、MantineはNext.js向けガイドがあり、dnd-kitはReact向けD&Dに使いやすい構成です。ClerkもNext.js App Router向けSDKがあり、DrizzleはTurso/libSQL連携が公式に案内されています。

---

# 採用する技術

## 1. フロント / アプリ基盤

| 項目             | 採用                 |
| -------------- | ------------------ |
| フレームワーク        | Next.js App Router |
| 言語             | TypeScript         |
| React          | Next.js同梱前提        |
| CSS            | Mantine中心          |
| ルーティング         | Next.js App Router |
| Server Actions | 必要に応じて採用           |
| API            | Route Handlers     |

Next.js App Routerは、Server Components、Route Handlers、データ取得、Server Actionsなどを扱えるため、このアプリのような管理画面 + API + 認証付きアプリに向いています。

---

## 2. UI

| 項目      | 採用                                    |
| ------- | ------------------------------------- |
| UIライブラリ | **Mantine**                           |
| カンバンD&D | **dnd-kit**                           |
| アイコン    | Tabler Icons                          |
| 通知UI    | Mantine Notifications                 |
| モーダル    | Mantine Modal                         |
| タブ      | Mantine Tabs                          |
| 日付入力    | Mantine DateInput / DateTimePicker    |
| フォーム部品  | Mantine TextInput / Textarea / Select |

MantineはNext.js向け利用ガイドがあり、フォーム・日付・タブ・モーダルなど管理画面で使う部品をまとめて扱いやすいです。dnd-kitはTypeScript製のD&Dツールキットで、React向けのクイックスタートも用意されています。

### HeroUIの扱い

| 技術     | 方針                       |
| ------ | ------------------------ |
| HeroUI | MVPでは使わない                |
| 用途     | 将来のLP・公開ページで再検討          |
| 理由     | 管理画面中心ならMantineの方が実装が速そう |

```text
アプリ本体：Mantine
カンバンD&D：dnd-kit
公開LP：必要なら将来HeroUI検討
```

---

## 3. 認証・ユーザー管理

| 項目      | 採用                      |
| ------- | ----------------------- |
| 認証      | Clerk                   |
| ログイン方式  | Googleログイン              |
| ユーザーID  | Clerk user id           |
| セッション管理 | Clerk                   |
| 保護ページ   | Clerk Middleware        |
| 将来の組織管理 | 必要ならClerk Organizations |

ClerkはNext.js SDKを提供しており、App Router向けのQuickstartもあります。今回のようにGoogleログインを使い、ユーザーごとに案件データを分離する構成に合います。

---

## 4. DB / ORM

| 項目       | 採用               |
| -------- | ---------------- |
| DB       | Turso            |
| DB種別     | libSQL / SQLite系 |
| ORM      | Drizzle ORM      |
| DBクライアント | `@libsql/client` |
| マイグレーション | drizzle-kit      |
| スキーマ管理   | Drizzle schema   |

DrizzleはTurso連携の公式チュートリアルがあり、Turso側のドキュメントでもDrizzle連携は`@libsql/client`を使う構成として案内されています。

### DBに保存する主な情報

| 領域          | 主なテーブル                      |
| ----------- | --------------------------- |
| ユーザー        | users                       |
| 案件          | projects                    |
| ステータス履歴     | project_status_history      |
| メモ          | project_notes               |
| 面談準備        | interview_preparations      |
| 想定質問        | interview_questions         |
| 回答案         | interview_answers           |
| 逆質問         | interview_reverse_questions |
| 面談メモ        | interview_notes             |
| リマインド       | reminders                   |
| Googleカレンダー | calendar_events             |
| AIログ        | ai_extraction_logs          |
| 課金          | billing_subscriptions       |

---

## 5. AI

| 項目     | 採用                            |
| ------ | ----------------------------- |
| AI SDK | Vercel AI SDK                 |
| 初期モデル  | OpenAI / Gemini / Claude のどれか |
| 方針     | モデル差し替え可能にする                  |
| AI出力検証 | Zod                           |
| 主な用途   | 案件整理、次アクション提案、面談準備生成          |

Vercel AI SDKは、Next.jsなどでAIアプリを作るためのTypeScriptツールキットとして提供されており、プロバイダー差し替えをしやすい構成に向いています。ZodはTypeScript-firstのバリデーションライブラリなので、AI出力JSONの検証に使います。

### AIでやること

| 機能      | 内容                       |
| ------- | ------------------------ |
| 案件整理    | Gmail本文から案件名・単価・技術・概要を抽出 |
| ステータス候補 | 返信必要 / 相手返信待ちなどを候補提示     |
| 次アクション  | 次に何をすべきか提案               |
| 面談準備    | 想定質問、回答案、逆質問、懸念点、戦略を生成   |
| チェックリスト | 面談前確認項目を生成               |

---

## 6. Googleカレンダー連携

| 項目   | 採用                             |
| ---- | ------------------------------ |
| API  | Google Calendar API            |
| 認可   | Google OAuth Scope             |
| 認証基盤 | Clerk + Googleログイン             |
| 初期機能 | 面談予定をカレンダー登録                   |
| 保存情報 | Google Calendar event ID / URL |

Google Calendar APIはREST APIとして提供され、Google Calendarの予定操作に使えます。利用にはCalendar API用のOAuthスコープが必要です。

### MVPで使う範囲

```text
面談日時を入力
↓
Googleカレンダーに登録
↓
案件詳細にカレンダーURLを保存
```

MVPでは、空き時間検索・双方向同期・自動日程調整は後回しです。

---

## 7. 課金

| 項目      | 採用                    |
| ------- | --------------------- |
| 決済      | Stripe                |
| サブスク    | Stripe Billing        |
| 決済画面    | Stripe Checkout       |
| Webhook | Stripe Webhook        |
| 課金状態保存  | billing_subscriptions |

Stripe Checkoutは一回払い・サブスク決済に使え、Stripe Billingは継続課金・サブスク管理に使えます。

### MVPでの扱い

```text
Phase 1：課金なし
Phase 2：課金テーブルだけ用意
Phase 3：Stripe Checkout / Billing連携
```

---

## 8. フォーム・状態管理

| 項目     | 採用                                 |
| ------ | ---------------------------------- |
| フォームUI | Mantine Form または React Hook Form   |
| 入力検証   | Zod                                |
| サーバー状態 | まずはServer Actions / Route Handlers |
| 複雑化したら | TanStack Query検討                   |

MVPでは、まずNext.jsのServer Actions / Route Handlers中心で十分です。クライアント側のキャッシュ・再取得・楽観更新が増えてきたらTanStack Queryを検討します。

---

## 9. 開発・品質

| 項目      | 採用             |
| ------- | -------------- |
| パッケージ管理 | pnpm           |
| Lint    | ESLint         |
| Format  | Prettier       |
| 型チェック   | TypeScript     |
| 単体テスト   | Vitest         |
| E2E     | Playwright     |
| CI      | GitHub Actions |
| デプロイ    | Vercel         |

テストはMVP初期では最低限でよいですが、AI出力JSON、ステータス変更、ユーザーごとのデータ分離は早めにテスト対象にした方が良いです。

---

# 最終スタック一覧

```text
Framework:
- Next.js App Router

Language:
- TypeScript

UI:
- Mantine
- Tabler Icons

Drag & Drop:
- dnd-kit

Auth:
- Clerk
- Google Login

Database:
- Turso
- libSQL

ORM:
- Drizzle ORM
- drizzle-kit
- @libsql/client

AI:
- Vercel AI SDK
- OpenAI / Gemini / Claude
- Zod

Calendar:
- Google Calendar API

Billing:
- Stripe
- Stripe Checkout
- Stripe Billing
- Stripe Webhook

Deploy:
- Vercel

Package Manager:
- pnpm

Quality:
- ESLint
- Prettier
- TypeScript
- Vitest
- Playwright
- GitHub Actions
```

---

# 今回の採用・保留・後回し

| 区分  | 技術                  |
| --- | ------------------- |
| 採用  | Next.js App Router  |
| 採用  | TypeScript          |
| 採用  | Mantine             |
| 採用  | dnd-kit             |
| 採用  | Clerk               |
| 採用  | Turso               |
| 採用  | Drizzle ORM         |
| 採用  | Vercel AI SDK       |
| 採用  | Zod                 |
| 採用  | Google Calendar API |
| 採用  | Stripe              |
| 採用  | Vercel              |
| 保留  | HeroUI              |
| 後回し | Gmail API           |
| 後回し | Googleカレンダー双方向同期    |
| 後回し | Stripe課金実装          |
| 後回し | プッシュ通知              |
| 後回し | TanStack Query      |

---

# 作業指示書の技術スタック差し替え版

## 技術スタック

- Next.js App Router
- TypeScript
- Mantine
- dnd-kit
- Clerk
- Turso
- Drizzle ORM
- @libsql/client
- Vercel AI SDK
- Zod
- Google Calendar API
- Stripe
- Vercel
- pnpm
- ESLint
- Prettier
- Vitest
- Playwright

## UI方針

UIライブラリはMantineを採用する。
管理画面、フォーム、タブ、モーダル、日付入力、通知、カードUIはMantineで実装する。
カンバンのドラッグ&ドロップはdnd-kitで実装する。
HeroUIはMVPでは採用しない。
将来、公開LPやマーケティングページを作る場合に再検討する。

## AI方針

AI処理はVercel AI SDK経由で実装する。
モデルはOpenAI / Gemini / Claudeを差し替え可能な構成にする。
AI出力はZodで検証する。

## 認証・課金方針

認証はClerk。
ログインはGoogleアカウント。
課金はStripe。
Stripe実装はMVP後半または公開前に行う。

## 外部連携方針

Gmail APIはMVPでは使わない。
Gmail本文はユーザー貼り付けで扱う。
Gmail URLは保存する。
Googleカレンダー連携は、面談予定の登録から始める。
