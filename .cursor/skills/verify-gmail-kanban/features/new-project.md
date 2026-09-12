# New project

利用者は案件登録からタイトル必須の案件を作り、カンバンに戻って同じ案件を見る。Gmail URL からの取得と、本文の手動ペーストの両方がある。

## Sub-features

- `form-open` opens `/dashboard/projects/new` from the dashboard button.
- `manual-create` saves a title (required) and returns the user to a board that lists that title.
- `gmail-fetch` fills メール本文 from a Gmail URL or thread id when Google readonly scope is connected.
- `cancel` returns to `/dashboard` without creating.

## How to get to it (user POV)

- On `/dashboard`, choose `案件登録`.
- Open `/dashboard/projects/new` directly while signed in.
- From `/dashboard/gmail`, choose `案件登録へ`.

## Driving it with Playwright

Preconditions:

- Doctor is green and the E2E user can reach `/dashboard`.
- No dedicated e2e spec yet. Drive with Playwright codegen-style locators or the browser. Do not call `createProject` from a unit test and call that proof.

- **Open form.** Choose `案件登録`. Run `page.getByRole("link", { name: "案件登録" }).click()`. URL is `/dashboard/projects/new`. Heading `案件登録` is visible. Button `キャンセル` is visible.
- **Cancel.** Choose `キャンセル`. URL is `/dashboard`. No new card titled `Verify draft`.
- **Manual create.** Fill `getByLabel("案件タイトル *")` with `Verify pstack project`. Choose `getByRole("button", { name: "登録する" })`. The app returns to `/dashboard`. Heading `案件カンバン` is visible and the title `Verify pstack project` appears on a card.
- **Gmail fetch (optional).** Fill `getByLabel("Gmail URL / スレッド ID")` and choose `Gmailから取得`. メール本文 is non-empty, or a visible error `Gmail取得エラー` explains missing scope / bad URL. FMfcgz URLs must fail with the existing copy, not hang.
- **Proof.** Screenshot the board (or the new-project form error) plus a second view: reopen the card or reload `/dashboard` and read the same title. Save under `verify-artifacts/<run-id>/new-project/`.

## Gotchas

- Title is required. Submitting empty must not create a row.
- `Gmailから取得` needs Clerk Google OAuth with Gmail readonly. Missing scope is an expected error, not a product failure, unless the change under test is Gmail fetch itself.
- FMfcgz links are unsupported. Do not treat a hang as success.
- AI で整理する is optional. Manual title + 登録する is enough to prove create.
- Clean up the `Verify pstack project` card after the run if you created it. Keep the artifacts.
