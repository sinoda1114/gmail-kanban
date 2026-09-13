# Interview research

サインインした利用者は案件詳細の面談対策タブで、企業リサーチと想定質問のパックを作る。検索で裏付けられないことは推測と出す。

## Sub-features

- `research-tab` shows heading `面談対策` and the button `AIで面談対策を作成` (or `AIで面談対策を再作成` after the first run).
- `apply-to-prep` shows `この対策を面談準備に反映` only after a pack exists. Clicking it generates the existing 面談準備 payload from the pack.
- Empty state copy `まだ対策パックはありません` when no pack is saved.

## How to get to it (user POV)

- Open a project, then choose tab `面談対策`.
- Direct URL: `/dashboard/projects/{id}?tab=interview_research`.

## Driving it with Playwright

Preconditions:

- Doctor is green.
- E2E user is present. Otherwise skip.
- Do **not** click generate in CI unless the run is meant to spend Gemini quota.

- **Open tab.** After creating or opening a project, `getByRole("tab", { name: "面談対策" })`. Button `AIで面談対策を作成` is visible.
- Covered by `e2e/new-project-smoke.spec.ts` (tab + generate button, no Gemini call).

## Gotchas

- Model is `gemini-3.8-flash` with Google Search grounding. Cheap JSON jobs stay on `gemini-3.1-flash-lite`.
- Facts not in the posting or search hits must be `speculation`.
- Applying to prep calls the existing interview-prep generator; a failed apply keeps the previous prep.
