# Dashboard kanban

サインインした利用者は案件カンバンを見る。ヘッダーからホーム・要対応・設定へ動け、案件が無いときは空状態が出る。

## Sub-features

- `shell-visible` shows heading `案件カンバン` and header links after sign-in.
- `empty-state` shows the empty copy when the user has no projects.
- `search-filter` filters cards by the search box when projects exist.
- `collapsed-statuses` keeps 終了 / 保留 hidden until `終了・保留を表示` is on.

## How to get to it (user POV)

- Sign in, then open `/dashboard`.
- Choose the header link `ダッシュボードへ移動`.
- After first sign-in, accept `/onboarding` (it creates the `users` row and redirects to `/dashboard`).

## Driving it with Playwright

Preconditions:

- Doctor is green.
- `E2E_CLERK_USER_EMAIL` or `~/.config/gmail-kanban-secrets/e2e-user.json` is present. Otherwise skip this feature.
- Turso or `TURSO_DATABASE_URL=file:/workspace/local.db` is usable. First sign-in writes a user row.
- `e2e/auth-smoke.spec.ts` is the harness for `shell-visible`.

- **Sign in.** Run `pnpm exec playwright test e2e/auth-smoke.spec.ts` with the same `E2E_BASE_URL` rule as auth-gate. `signInE2eTestUser` opens `/sign-in` then uses a Clerk ticket. `page.goto("/dashboard")` ends on `/dashboard`.
- **Shell.** `getByRole("heading", { name: "案件カンバン" })` is visible. `getByRole("link", { name: "ダッシュボードへ移動" })` and `getByRole("link", { name: "設定" })` are visible.
- **Empty or board.** If the user has no projects, text `案件がまだありません。「案件登録」から追加してください。` is visible and `getByRole("link", { name: "案件登録" })` works. If projects exist, column labels from `STATUS_LABELS` (返信必要, 相手返信待ち, …) are on screen.
- **Search.** When cards exist, fill placeholder `タイトル・エージェント・技術・次アクションで検索`. Matching titles stay. Unmatched titles leave. Choose `クリア` to restore. No dedicated spec yet; drive in the browser or add one before claiming search.
- **Proof.** Save Playwright output to `verify-artifacts/<run-id>/dashboard-kanban/playwright.log` and a screenshot that shows `Gmail Kanban` in the header plus `案件カンバン`.

## Gotchas

- First sign-in lands on `/onboarding` then `/dashboard`. Assert the final URL, not the first hop.
- Auth-smoke skips when the E2E user is unset. A skip is not a pass.
- 終了 and 保留 columns are hidden until the switch `終了・保留を表示` is on, unless search or a status filter includes them.
- Do not drag cards by pixel offset. Use `aria-label="ドラッグして移動"` or the per-card `ステータス変更` control.
