# Interview prep

サインインした利用者は案件詳細の面談準備タブで、想定質問やチートシートを生成する。当該案件に面談振り返りがあるときは、再生成にその内容が乗る。

## Sub-features

- `prep-tab` shows heading `面談情報` and the generate button `AIで面談準備を一括作成` (or `AIで面談準備を再生成（拡張含む）` after the first run).
- `retrospective-hint` shows copy `この案件の面談振り返りを、準備の生成に反映します` when a non-empty retrospective exists on the same project. Absent when notes have no retrospective.
- `research-hint` shows copy `この案件の面談対策パックを、準備の生成に反映します` when a research pack exists. Absent otherwise.

## How to get to it (user POV)

- Open a project from the kanban, then choose tab `面談準備`.
- Direct URL: `/dashboard/projects/{id}?tab=interview_prep`.
- Retrospective is created on tab `面談メモ` (`?tab=interview_note`) with `振り返りを生成`.

## Driving it with Playwright

Preconditions:

- Doctor is green.
- E2E user is present. Otherwise skip.
- Do **not** click generate in CI unless the run is meant to spend Gemini quota. The hint is enough to prove the wiring when notes already have a retrospective.

- **Open tab.** From `/dashboard`, open a project link, then `getByRole("tab", { name: "面談準備" })`. Heading `面談情報` is visible. Button `AIで面談準備を一括作成` or `AIで面談準備を再生成（拡張含む）` is visible.
- **Hint.** If the project has a saved retrospective, text `この案件の面談振り返りを、準備の生成に反映します` is visible. If not, that text is absent.
- No dedicated spec yet; drive in the browser or add one before claiming the hint.

## Gotchas

- Empty retrospective JSON must not show the hint and must not be stuffed into the Gemini prompt.
- Generation is a Server Action plus Gemini. A failed run still keeps the previous prep.
- Tab query `interview_prep` is required for deep links. The Mantine Tabs `defaultValue` does not update the URL on click.
