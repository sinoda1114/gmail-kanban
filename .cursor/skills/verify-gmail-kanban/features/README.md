# Gmail Kanban verification map

このディレクトリは Gmail Kanban のユーザー向け挙動を証明するための正本。運転する前にこの index を読み、対象の feature ファイルをレシピにする。

## Baseline preconditions

- ホストは `localhost`（`127.0.0.1` は使わない）。
- 未ログイン証明は `http://localhost:3000`（対話）または `http://localhost:3005`（隔離 E2E）。
- `scripts/doctor.sh` が `{"ok":true}` と Clerk 鍵の存在を返す。値は出さない。
- 認証後パスは `E2E_CLERK_USER_EMAIL` または `~/.config/gmail-kanban-secrets/e2e-user.json`。未設定ならその feature を skip し、未ログイン経路だけ証明する。
- `TURSO_DATABASE_URL` が `file:` のとき、認証後パスの前に `pnpm exec drizzle-kit push`。`doctor.sh` は `users` テーブルが無い file DB を FAIL にする。
- このランが起動していない Next プロセスは運転しない。
- `pnpm dev` 起動中は `pnpm build` / `pnpm test:e2e` を走らせない。

## Driving conventions

- エントリは feature ファイルに書いてあるユーザー経路から始める。
- ARIA ロールと見える名前を使う。座標とタブ順は使わない。
- Playwright がある経路は `e2e/*.spec.ts` をそのまま実行する。
- 変異のあと、同じデータを別のユーザー視点（カンバンまたは詳細の開き直し）で読む。
- 証明アーティファクトは `verify-artifacts/` に残す。クリーンアップで消さない。

## Proof and skip reporting

- 操作と結果の両方を残す。最終スクリーンショットだけは不足。
- 到達できないエントリは、試したコマンドと満たせなかった前提を書く。別経路で「代わりに通った」と書かない。
- 認証ユーザーが無い認証後 feature は skip。理由を 1 行で残す。

## Feature entry contract

各ファイルは H1 とユーザーから見える 1 段落のあと、次の 4 つの H2 をこの順で置く。

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with Playwright`
4. `Gotchas`

## Features

- [Auth gate](./auth-gate.md) は未ログインの `/sign-in`・`/sign-up` 到達と、保護ルートから sign-in への誘導。
- [Landing](./landing.md) は未ログインの `/` 公開 LP と、ログイン済みの dashboard 誘導。
- [Dashboard kanban](./dashboard-kanban.md) はサインイン後のカンバンシェル、検索、空状態。
- [New project](./new-project.md) は案件登録フォーム、詳細への遷移、カンバンへの反映。
- [Alerts](./alerts.md) は要対応一覧と対応済みトグル。
- [Settings](./settings.md) は設定画面と Google 連携の表示。
- [Billing](./billing.md) はプラン画面と案件数上限。
- [Interview prep](./interview-prep.md) は案件詳細の面談準備と、振り返りの次回反映。
