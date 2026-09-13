# Interview practice

サインインした利用者は案件詳細の面談練習タブで、相手役との通し練習（テキスト / 音声）と、1問だけの模擬回答を行う。

## Sub-features

- `session-start` shows heading `通し練習`, input mode `テキスト` / `音声` / `ライブ`, and button `通し練習を開始` (or `通し練習をやり直す` after a session exists). Live mode shows `ライブ面談を開始`.
- `one-question` shows `模擬回答リハーサル` when 面談準備 already has questions. Otherwise copy that 1問練習は想定質問のあと、通し練習は対策パックだけでも開始できる。

## How to get to it (user POV)

- Open a project, then choose tab `面談練習`.
- Direct URL: `/dashboard/projects/{id}?tab=interview_practice`.

## Driving it with Playwright

Preconditions:

- Doctor is green.
- E2E user is present. Otherwise skip.
- Do **not** start a session in CI unless the run is meant to spend Gemini quota.

- **Open tab.** After creating or opening a project, `getByRole("tab", { name: "面談練習" })`. Group `入力モード` (`テキスト` / `音声` / `ライブ`) and button `通し練習を開始` are visible. Do **not** click `ライブ面談を開始` in CI (Gemini Live quota).
- Covered by `e2e/new-project-smoke.spec.ts` (tab + start button, no Gemini call).

## Gotchas

- Counterpart model is `gemini-3.8-flash` for turn-based practice. Live mode uses Gemini Live API (`gemini-3.1-flash-live-preview`) with an ephemeral token; the browser streams audio over WebSocket. Voice (turn-based) still uses Web Speech. Live shows a 2D counterpart, turn banners (`相手役が話しています` / `あなたの番です` / `入力中`), and a mic meter docked below the chat so it stays visible. Chat is LINE-style (partner left, you right, newest at the bottom). No 3D avatar.
- The 1-question rehearsal lives here, not on the 面談準備 tab.
- A completed session keeps messages and feedback until the user starts over.
