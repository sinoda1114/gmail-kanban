# Landing

未ログインの利用者は `/` でプロダクト説明と、サインアップ／ログインへの導線を見る。ログイン済みならダッシュボードへ進む。カンバンの AppShell は出さない。

## Sub-features

- `lp-open` opens `/` signed out and shows heading `Gmail Kanban`.
- `cta-signup` is the link `無料で始める` to `/sign-up`.
- `cta-signin` is the link `ログイン` to `/sign-in`.
- `signed-in-home` sends `/` to `/dashboard` when there is a session.

## How to get to it (user POV)

- Open `/` while signed out.
- Choose `無料で始める` or `ログイン`.
- Open `/` while signed in.

## Driving it with Playwright

Preconditions:

- Doctor is green.
- Unsigned specs use `e2e/smoke.spec.ts`. Signed-in home uses `e2e/auth-smoke.spec.ts`.

- **Open LP.** Go to `/`. URL does not match `sign-in`. Heading `Gmail Kanban` is visible. Links `無料で始める` (`/sign-up`) and `ログイン` (`/sign-in`) are visible.
- **Protect dashboard.** Still: signed-out `/dashboard` goes to `/sign-in`.
- **Signed-in home.** After auth-smoke reaches the kanban, go to `/`. URL is `/dashboard` and heading `案件カンバン` is visible.
- **Proof.** Screenshot the LP heading and both CTAs under `verify-artifacts/<run-id>/landing/`.

## Gotchas

- `/` is a public Clerk route. If it is missing from `src/proxy.ts`, the middleware sends unsigned users to `/sign-in` before the page runs.
- Do not use Mantine `AppShell` or `List.Item` on this RSC page.
- `/` still does not load Clerk JS for `clerk.signIn`. Sign-in stays on `/sign-in`.
