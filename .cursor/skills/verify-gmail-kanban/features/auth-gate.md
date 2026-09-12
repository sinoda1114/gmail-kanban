# Auth gate

未ログインの利用者はサインイン画面に到達でき、保護されたダッシュボードへは入れない。Clerk のサインイン UI が見える。サインアップは別の公開ルート。

## Sub-features

- `signin-open` opens `/sign-in` and shows the Clerk sign-in root.
- `signup-open` opens `/sign-up` and shows the Clerk sign-up root.
- `protect-dashboard` sends `/dashboard` to `/sign-in` when there is no session.
- `home-lp` shows the public landing page on `/` when there is no session.

## How to get to it (user POV)

- Open `/sign-in` in the browser.
- Open `/sign-up` in the browser.
- Open `/dashboard` while signed out.
- Open `/` while signed out (public LP, not a sign-in redirect).

## Driving it with Playwright

Preconditions:

- Doctor is green at the chosen base URL.
- No Clerk session cookies for the test browser.
- `e2e/smoke.spec.ts` is the harness for `/sign-in` and `/dashboard`. `prepareClerkTestingPage` runs first.

- **Open sign-in.** Go to `/sign-in`. Run `pnpm exec playwright test e2e/smoke.spec.ts` with `E2E_BASE_URL` set to the instance under test (isolation default `http://localhost:3005`; existing `pnpm dev` uses `http://localhost:3000`). URL matches `/sign-in`. Locator `.cl-rootBox, .cl-signIn-root, [data-clerk-component]` is visible within 15s.
- **Open sign-up.** Go to `/sign-up`. URL matches `/sign-up`. Locator `.cl-rootBox, .cl-signUp-root, [data-clerk-component]` is visible within 15s. Not in `smoke.spec.ts`.
- **Protect dashboard.** Go to `/dashboard` signed out. The same spec asserts the URL matches `/sign-in` within 15s. The kanban heading `案件カンバン` is not visible.
- **Home LP.** Go to `/` signed out. URL stays `/` (not `/sign-in`). Heading `Gmail Kanban` and links `無料で始める` / `ログイン` are visible. Dedicated coverage is in `e2e/smoke.spec.ts`.
- **Proof.** Keep the Playwright list output (pass lines for both smoke tests) under `verify-artifacts/<run-id>/auth-gate/playwright.log`. A screenshot of `/sign-in` with the Clerk root visible goes next to it as `sign-in.png`. Unsigned `/` is the public LP (200, heading `Gmail Kanban`); do not record a `/` → `/sign-in` redirect. That proof lives in the landing feature map.

## Gotchas

- Host must be `localhost`. `127.0.0.1` breaks Clerk development rewrite.
- `/` does not load Clerk JS. Do not call `clerk.signIn` on `/`.
- `GET /api/health` returning `{"ok":true}` is not proof of the auth gate.
- Testing Token is required on the Clerk development instance. Skip is not a pass.
