# New project

利用者は案件登録からタイトル必須の案件を作り、作成後は案件詳細へ進む。カンバンへ戻ると同じタイトルが見える。Gmail URL からの取得と、本文の手動ペーストの両方がある。

## Sub-features

- `form-open` opens `/dashboard/projects/new` from the dashboard button.
- `manual-create` saves a title (required) and navigates to `/dashboard/projects/<id>`.
- `gmail-fetch` fills メール本文 from a Gmail URL or thread id when Google readonly scope is connected.
- `cancel` returns to `/dashboard` without creating.

## How to get to it (user POV)

- On `/dashboard`, choose `案件登録`.
- Open `/dashboard/projects/new` directly while signed in.
- From `/dashboard/gmail`, choose `案件登録へ`.

## Driving it with Playwright

Preconditions:

- Doctor is green (file DB must have a `users` table) and the E2E user can reach `/dashboard`.
- Dedicated spec: `e2e/new-project-smoke.spec.ts` (manual title + 登録する → detail UUID URL → 案件一覧へ戻る).

- **Open form.** Choose `案件登録`. Run `page.getByRole("link", { name: "案件登録" }).click()`. URL is `/dashboard/projects/new`. Heading `案件登録` is visible. Link `キャンセル` is visible (`component="a"`, not a button).
- **Cancel.** Choose `getByRole("link", { name: "キャンセル" })`. URL is `/dashboard`. No new card titled `Verify draft`.
- **Manual create.** Fill `getByRole("textbox", { name: "案件タイトル *" })` with a unique title. Choose `getByRole("button", { name: "登録する" })`. URL becomes `/dashboard/projects/<id>` (not `/dashboard`, and not `/dashboard/projects/new`). Heading is the saved title. Tab `基本情報` and link `案件一覧へ戻る` are visible. Then choose `案件一覧へ戻る` and read the same title on the board.
- **Gmail fetch (optional).** Fill `getByLabel("Gmail URL / スレッド ID")` and choose `Gmailから取得`. メール本文 is non-empty, or a visible error `Gmail取得エラー` explains missing scope / bad URL. FMfcgz URLs must fail with the existing copy, not hang.
- **Proof.** Screenshot the detail page after create, then the board with the same title. Save under `verify-artifacts/<run-id>/new-project/`. A URL assertion must exclude `/dashboard/projects/new`.

## Gotchas

- Title is required on the input (`required`). Empty submit is blocked by native constraint validation. The JS copy `案件タイトルは必須です` appears only if submit runs with a blank trimmed title.
- `キャンセル` is a link to `/dashboard`, not a button.
- `Gmailから取得` needs Clerk Google OAuth with Gmail readonly. Missing scope is an expected error, not a product failure, unless the change under test is Gmail fetch itself.
- FMfcgz links are unsupported. Do not treat a hang as success.
- AI で整理する is optional. Manual title + 登録する is enough to prove create.
- Clean up the created card from 案件詳細 → `削除` (confirm dialog). Keep the artifacts.
- Free プランは案件 5 件まで。上限に達すると見出し近くに `案件数の上限` が出て `登録する` が disabled になる。サーバーの `createProject` も同じ文面で拒否する。再利用 DB の E2E ユーザーは作りっぱなしのカードを消す。
