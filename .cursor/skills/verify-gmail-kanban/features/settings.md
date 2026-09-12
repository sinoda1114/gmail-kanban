# Settings

サインインした利用者は設定で Google カレンダー連携と Gmail 連携の状態を読む。接続の有無がバッジで分かる。トークンは出さない。

## Sub-features

- `settings-open` opens `/dashboard/settings` from the header.
- `calendar-status` shows Google カレンダー連携 as `連携済み` or `未連携`.
- `gmail-status` shows Gmail 連携 as `Google 連携済み` or `未連携`, plus the readonly scope string.

## How to get to it (user POV)

- Choose header link `設定`.
- Open `/dashboard/settings` directly while signed in.

## Driving it with Playwright

Preconditions:

- Doctor is green and the E2E user can reach `/dashboard`.
- Dedicated spec: `e2e/settings-smoke.spec.ts`.

- **Open settings.** Choose `getByRole("link", { name: "設定" })`. URL is `/dashboard/settings`. Heading `設定` is visible. If the document is a Next error overlay (`This page couldn’t load` / status 500), stop. That is a product regression, not map drift.
- **Calendar block.** Heading `Google カレンダー連携` is visible. Badge `連携済み` or `未連携` is visible. Do not print token values.
- **Gmail block.** Heading `Gmail 連携` is visible. Badge `Google 連携済み` or `未連携` is visible. The page includes `https://www.googleapis.com/auth/gmail.readonly` in a `Code` block. Links `案件登録` and `Gmail 連携の説明` (`/dashboard/gmail`) are present.
- **Proof.** Screenshot heading `設定` with both Papers. Save under `verify-artifacts/<run-id>/settings/`.

## Gotchas

- First-time users redirect `/dashboard/settings` → `/onboarding` → `/dashboard` if the `users` row is missing. Sign in through the auth-smoke path first. File DB needs `pnpm exec drizzle-kit push` or dashboard/settings RSC throws `no such table: users`.
- OAuth tokens must never appear in artifacts or command output. `getGoogleOAuthStatus` may hold an access token on the server; it must not render.
- `/dashboard/gmail` is a helper page, not settings. Settings still shows Gmail status and scope.
