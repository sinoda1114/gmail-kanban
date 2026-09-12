# Billing

サインインした利用者はプラン画面で Free / Pro と案件数の上限を読む。Stripe が設定されていれば Checkout と Customer Portal に進める。未設定ならその旨だけ見え、シークレットは出ない。

## Sub-features

- `billing-open` opens `/dashboard/billing` from the header link `プラン`.
- `plan-status` shows 現在のプラン as `Free` or `Pro`, plus 案件数.
- `upgrade` shows Checkout (`Pro にアップグレード`) when Stripe is configured, or `課金はまだ設定されていません` when it is not.
- `portal` shows `お支払いを管理` only after a Stripe customer exists.

## How to get to it (user POV)

- Choose header link `プラン`.
- Open `/dashboard/billing` directly while signed in.
- From 案件登録, when the Free cap is reached, choose `プラン画面へ`.

## Driving it with Playwright

Preconditions:

- Doctor is green and the E2E user can reach `/dashboard`.
- Dedicated spec: `e2e/billing-smoke.spec.ts`.
- Do not complete a real Stripe Checkout in CI.

- **Open billing.** Choose `getByRole("link", { name: "プラン" })`. URL is `/dashboard/billing`. Status is 200. Heading `プラン` (`exact: true`, not `現在のプラン`) is visible. If the document is a Next error overlay (`This page couldn’t load` / status 500), stop.
- **Plan block.** Heading `現在のプラン` is visible. Badge text `Free` or `Pro` is visible. Text matching `案件数:` is visible.
- **Upgrade block.** Heading `アップグレード` is visible. Either `課金はまだ設定されていません`, the button `Pro にアップグレード`, or Pro copy `Pro プランです` is visible. Do not click through to Stripe unless the change under test is Checkout itself.
- **Proof.** Screenshot heading `プラン` with both Papers. Save under `verify-artifacts/<run-id>/billing/`.

## Gotchas

- Success/cancel URLs already point at `/dashboard/billing`. `?success=true` only shows a received-notice; webhook lag can leave the badge on Free for a moment.
- `STRIPE_SECRET_KEY` / `STRIPE_PRO_PRICE_ID` values must never appear in artifacts or command output. Missing keys are expected in Cloud/CI; the unconfigured copy is success, not a product failure.
- Free cap is 5 projects (`PLAN_LIMITS.free.maxProjects`). Enforcement is in `createProject`, not only the banner. The E2E user on a reused file DB can hit the cap if leftover 案件登録 cards are not deleted.
- Do not use Mantine `List.Item` on this RSC page.
