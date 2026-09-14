# Gmail Kanban — Claude 用プロジェクト指示

このプロジェクトの**運用ルール正本は [`AGENTS.md`](./AGENTS.md)**。Claude Code も毎回 `AGENTS.md` に従うこと
（worktree フロー／サーモス・ゲート／CI 緑なら squash マージ／GitHub が正本／Issue・Project タスク管理／供給網デフォルト）。

ここには Claude 固有の補足だけを置く。AGENTS.md と重複する内容は AGENTS.md を正とする（ドリフト防止）。

## Claude 固有メモ

- ツール呼び出しの `description`・ユーザー向け説明は **日本語**で書く。
- 重い処理・破壊的/外部影響のある操作は実行前に短く宣言し、確認を取る。
- 検証は Claude 自身が `tsc` / `eslint` / `test` で行い、PASS/FAIL を提示する（ユーザーをテスターにしない）。
- **`/ai-review` は使わない**（必須ゲート外）。実装後は **サーモス**（`.cursor/rules/thermos-gate.mdc` / `.cursor/skills/thermos-gate/SKILL.md`）を worktree 側で実行する。
- `/security-review` は任意。必須完了条件にはしない。
