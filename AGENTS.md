# Gmail Kanban — プロジェクト指示

Gmail Kanban（`gmail-kanban.vercel.app`）の AI 向けプロジェクト指示。

## 運用ルール（HOW）の正本

このプロジェクトの開発フロー（worktree / PR / 2 段ゲート / デプロイ規律 / GitHub 正本 / Issue・Project タスク管理 / 供給網デフォルト）は、**本リポの `notes/`** を正本とする（リポと一緒に travel する）。
同じ挙動規律は `~/.claude` グローバルにも既定として入っているため、自分の端末の全 PJ に自動適用される。
**ここには挙動の再説明を書かない**（重複・ドリフト防止）。このファイルは**このプロジェクト固有の値だけ**を持つ。

- 開発フロー詳細: `notes/dev-workflow-multiagent.md`
- タスク管理詳細: `notes/task-management-issue-workflow.md`
- テスト規律（選択的 TDD / Vitest / Playwright）: `notes/testing-discipline.md`
- 課金方針（Stripe / RevenueCat）: `notes/billing-strategy.md`

## このプロジェクト固有の値

| 項目 | 値 |
|---|---|
| リポ実体 dir（統合＋デプロイ専用・ここで機能開発しない） | `~/dev/gmail-kanban` |
| GitHub | `sinoda1114/gmail-kanban` |
| デプロイ基盤 | Vercel（git 駆動・feature push = Preview / main マージ = Production） |
| 本番 URL | https://gmail-kanban.vercel.app |
| 独自ドメイン | gmail-kanban.vercel.app |
| 絶対 URL の env | `NEXT_PUBLIC_SITE_URL`（=`https://gmail-kanban.vercel.app`・ハードコード禁止） |
| タスク正本 | GitHub Issue / Project「Gmail Kanban Tasks」 |

## 役割境界（このプロジェクト）

<!-- 担当エージェント/領域を列挙して、担当外ファイルを触らない境界にする。例:
| 領域 | 担当 |
|---|---|
| UI / 配色 / 画面 | ui-feature |
| 認証 / 課金 | auth-billing |
| データ取得 | data-squad |
| 法務 / SEO / インフラ | legal-seo-infra |
| 整合監督・レビュー（実装しない） | reviewer |
-->

## dev 規律

- dev サーバ起動中にビルド成果物を消したり本番ビルドを実行しない（壊れる）。dev は 1 つ。
- AI 検証は `tsc` / `eslint` / `test`（該当時 `test:e2e`）で行う（手動確認をユーザーに丸投げしない）。詳細は `notes/testing-discipline.md`。
- `.env.local` は触らない・中身を出力しない（本番 env は Vercel ダッシュボードが正本）。
- シークレット（API キー・トークン）はログ / 出力に出さない。必要なら redact する。

## Cursor Cloud specific instructions

- パッケージ管理は `pnpm`（`packageManager: pnpm@11.5.0`）。依存更新は `pnpm install --frozen-lockfile`。
- 検証コマンドは `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm test:e2e` / `pnpm build`（CI と同じ。e2e は標準 `ci / e2e` でも必須）。dev は `pnpm dev`（port 3000）。dev 起動中に本番ビルドや `.next` 削除をしない。
- `.env.local` はエージェントが手編集しない。Clerk Development キーの正本は Clerk CLI。番人は `scripts/sync-clerk-dev-secrets.sh` で Actions / `.env.clerk` / `.env.local` を冪等同期する（`notes/clerk-dev-secrets.md`）。
- Cloud Agent ではシークレットを `/home/ubuntu/.config/gmail-kanban-secrets/` に置き、`source .../load.sh`（`~/.bashrc` からも自動読み込み）で注入する。
  - Clerk: `.env.clerk`（同期スクリプトが書く。`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`）
  - Gemini: `.env.gemini`（`GOOGLE_GENERATIVE_AI_API_KEY`）。アプリモデルは `gemini-3.1-flash-lite`。
- Turso クラウド鍵が無い場合は `TURSO_DATABASE_URL=file:/workspace/local.db` + `pnpm exec drizzle-kit push` でローカル DB を使える。
- Vercel の Sensitive env は CLI/API から読み戻せない。Dashboard から値をコピーして上記 secrets パスへ置く（Clerk Dev キーは同期スクリプト経由）。
- ダッシュボードの Mantine `AppShell` は Server Component から直接使うと RSC で落ちる。`DashboardShell`（client）経由で使うこと。
