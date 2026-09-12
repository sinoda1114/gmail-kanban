# Alerts

サインインした利用者は要対応一覧でリマインドを見る。件が無ければ空コピー。対応済みはトグルで出す。

## Sub-features

- `alerts-open` opens `/dashboard/alerts` from the header or the dashboard button.
- `empty-state` shows `現在、対応が必要な案件はありません。` when there are no reminders at all.
- `empty-active` shows `未対応の案件はありません。対応済みを表示で確認できます。` when every reminder is dismissed and the switch is off.
- `dismiss` marks an active reminder done and removes it from the default list.

## How to get to it (user POV)

- Choose header link `要対応`.
- On `/dashboard`, choose `要対応`.
- Open `/dashboard/alerts` directly while signed in.

## Driving it with Playwright

Preconditions:

- Doctor is green and the E2E user can reach `/dashboard`.
- No dedicated e2e spec yet.

- **Open from header.** Choose `getByRole("link", { name: "要対応" })`. URL is `/dashboard/alerts`. Heading `要対応一覧` is visible.
- **Empty or list.** If none, text `現在、対応が必要な案件はありません。` is visible. If some, each row names a project and a reminder type label (`要対応`, `催促候補`, `面談準備リマインド`, `進捗確認候補`, `再確認候補`).
- **Show done.** The switch `対応済みを表示` mounts only when done reminders exist. Turning it on reveals them. Default view hides them. With only done items and the switch off, text `未対応の案件はありません。対応済みを表示で確認できます。` is visible.
- **Proof.** Screenshot heading `要対応一覧` with either an empty copy or at least one reminder row. Save under `verify-artifacts/<run-id>/alerts/`.

## Gotchas

- Dashboard and header both use the visible name `要対応` and are links (`Button component={Link}` / `component="a"`). Use `getByRole("link", { name: "要対応" })`.
- Dismiss mutates reminder records. Re-open `/dashboard/alerts` after dismiss. A toast alone is not persistence.
- Seeded reminders depend on project dates. Do not invent a pass from a different user's data.
