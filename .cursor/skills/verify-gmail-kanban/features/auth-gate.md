# Auth gate

未ログインの利用者はサインイン画面に到達でき、保護されたダッシュボードへは入れない。Clerk のサインイン UI が見える。

## Sub-features

- `signin-open` opens `/sign-in` and shows the Clerk sign-in root.
- `protect-dashboard` sends `/dashboard` to `/sign-in` when there is no session.

## How to get to it (user POV)

- Open `/sign-in` in the browser.
- Open `/dashboard` while signed out.
- Open `/` while signed out (home redirects to sign-in).

## Driving it with Playwright

Preconditions:

- Doctor is green at the chosen base URL.
- No Clerk session cookies for the test browser.
- `e2e/smoke.spec.ts` is the harness. `prepareClerkTestingPage` runs first.

- **Open sign-in.** Go to `/sign-in`. Run `pnpm exec playwright test e2e/smoke.spec.ts` with `E2E_BASE_URL` set to the instance under test (isolation default `http://localhost:3005`; existing `pnpm dev` uses `http://localhost:3000`). URL matches `/sign-in`. Locator `.cl-rootBox, .cl-signIn-root, [data-clerk-component]` is visible within 15s.
- **Protect dashboard.** Go to `/dashboard` signed out. The same spec asserts the URL matches `/sign-in` within 15s. The kanban heading `案件カンバン` is not visible.
- **Home redirect.** Go to `/` signed out. The app redirects to `/sign-in`. Browser: `page.goto("/")` then `toHaveURL(/sign-in/)`. HTTP: `GET /` returns `307` with `Location` starting `/sign-in`. This entry is not in `smoke.spec.ts`; either proof is enough, do not skip it.
- **Proof.** Keep the Playwright list output (pass lines for both tests) under `verify-artifacts/<run-id>/auth-gate/playwright.log`. A screenshot of `/sign-in` with the Clerk root visible goes next to it as `sign-in.png`. Keep the `/` redirect status line in `home-redirect.txt`.

## Gotchas

- Host must be `localhost`. `127.0.0.1` breaks Clerk development rewrite.
- `/` does not load Clerk JS. Do not call `clerk.signIn` on `/`.
- `GET /api/health` returning `{"ok":true}` is not proof of the auth gate.
- Testing Token is required on the Clerk development instance. Skip is not a pass.
