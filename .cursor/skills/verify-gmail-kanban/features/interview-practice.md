# Interview practice

サインインした利用者は案件詳細の面談練習タブで、相手役との通し練習（テキスト / 音声）と、1問だけの模擬回答を行う。

## Sub-features

- `session-start` shows heading `通し練習`, input mode `テキスト` / `音声`, and button `通し練習を開始` (or `通し練習をやり直す` after a session exists).
- `one-question` shows `模擬回答リハーサル` when 面談準備 already has questions. Otherwise copy that 1問練習は想定質問のあと、通し練習は対策パックだけでも開始できる。

## How to get to it (user POV)

- Open a project, then choose tab `面談練習`.
- Direct URL: `/dashboard/projects/{id}?tab=interview_practice`.

## Driving it with Playwright

Preconditions:

- Doctor is green.
- E2E user is present. Otherwise skip.
- Do **not** start a session in CI unless the run is meant to spend Gemini quota.

- **Open tab.** After creating or opening a project, `getByRole("tab", { name: "面談練習" })`. Radios `テキスト` / `音声` and button `通し練習を開始` are visible.
- Covered by `e2e/new-project-smoke.spec.ts` (tab + start button, no Gemini call).

## Gotchas

- Counterpart model is `gemini-3.8-flash`. Voice uses the browser Web Speech API (TTS + STT) on the same session; no avatar.
- The 1-question rehearsal lives here, not on the 面談準備 tab.
- A completed session keeps messages and feedback until the user starts over.
