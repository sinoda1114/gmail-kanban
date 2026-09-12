# Settings

サインインした利用者は設定で Google カレンダー連携と Gmail 権限の状態を読む。接続の有無がバッジで分かる。

## Sub-features

- `settings-open` opens `/dashboard/settings` from the header.
- `google-status` shows a connected or disconnected state without exposing tokens.

## How to get to it (user POV)

- Choose header link `設定`.
- Open `/dashboard/settings` directly while signed in.

## Driving it with Playwright

Preconditions:

- Doctor is green and the E2E user can reach `/dashboard`.
- No dedicated e2e spec yet.

- **Open settings.** Choose `getByRole("link", { name: "設定" })`. URL is `/dashboard/settings`. Heading `設定` is visible.
- **Calendar block.** Heading `Google カレンダー連携` is visible. A connected or disconnected badge is visible. Do not print token values from logs or the page if any appear.
- **Proof.** Screenshot the settings page with heading `設定` and the Google カレンダー連携 block. Save under `verify-artifacts/<run-id>/settings/`.

## Gotchas

- First-time users redirect `/dashboard/settings` → `/onboarding` → `/dashboard` if the `users` row is missing. Sign in through the auth-smoke path first.
- OAuth tokens must never appear in artifacts or command output.
- Gmail helper copy lives on `/dashboard/gmail`. Settings is the status surface; do not treat the helper page as settings.
