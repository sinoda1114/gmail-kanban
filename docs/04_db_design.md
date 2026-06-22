# DB設計書

## 4.1 テーブル一覧

| テーブル                        | 内容            |
| --------------------------- | ------------- |
| users                       | ユーザー          |
| projects                    | 案件            |
| project_status_history      | ステータス履歴       |
| project_notes               | 案件メモ          |
| interview_preparations      | 面談準備          |
| interview_questions         | 想定質問          |
| interview_answers           | 回答案           |
| interview_reverse_questions | 逆質問           |
| interview_notes             | 面談メモ          |
| reminders                   | リマインド         |
| calendar_events             | Googleカレンダー連携 |
| ai_extraction_logs          | AI処理ログ        |
| billing_subscriptions       | Stripe課金情報    |

## 4.2 users

| カラム           | 型        | 内容          |
| ------------- | -------- | ----------- |
| id            | string   | 内部ユーザーID    |
| clerk_user_id | string   | ClerkユーザーID |
| email         | string   | メールアドレス     |
| name          | string   | 表示名         |
| created_at    | datetime | 作成日時        |
| updated_at    | datetime | 更新日時        |

## 4.3 projects

| カラム             | 型        | 内容        |
| --------------- | -------- | --------- |
| id              | string   | 案件ID      |
| user_id         | string   | ユーザーID    |
| title           | string   | 案件名       |
| agent_company   | string   | エージェント会社  |
| agent_person    | string   | 担当者       |
| status          | string   | 現在ステータス   |
| close_reason    | string   | 終了理由      |
| gmail_url       | string   | Gmail URL |
| source_text     | text     | 貼り付け元テキスト |
| summary         | text     | 案件概要      |
| price           | string   | 単価        |
| work_rate       | string   | 稼働率       |
| location        | string   | 勤務地       |
| remote_type     | string   | リモート条件    |
| tech_stack      | json     | 技術スタック    |
| start_date_text | string   | 開始時期      |
| contract_period | string   | 契約期間      |
| next_action     | text     | 次アクション    |
| reminder_date   | datetime | リマインド日時   |
| last_contact_at | datetime | 最終やり取り日時  |
| created_at      | datetime | 作成日時      |
| updated_at      | datetime | 更新日時      |

## 4.4 project_status_history

| カラム         | 型        | 内容     |
| ----------- | -------- | ------ |
| id          | string   | 履歴ID   |
| project_id  | string   | 案件ID   |
| user_id     | string   | ユーザーID |
| from_status | string   | 変更前    |
| to_status   | string   | 変更後    |
| reason      | text     | 変更理由   |
| changed_at  | datetime | 変更日時   |

## 4.5 project_notes

| カラム        | 型        | 内容                           |
| ---------- | -------- | ---------------------------- |
| id         | string   | メモID                         |
| project_id | string   | 案件ID                         |
| user_id    | string   | ユーザーID                       |
| note_type  | string   | general / concern / decision |
| body       | text     | メモ本文                         |
| created_at | datetime | 作成日時                         |
| updated_at | datetime | 更新日時                         |

## 4.6 interview_preparations

| カラム               | 型        | 内容              |
| ----------------- | -------- | --------------- |
| id                | string   | 面談準備ID          |
| project_id        | string   | 案件ID            |
| user_id           | string   | ユーザーID          |
| interview_at      | datetime | 面談日時            |
| interview_url     | string   | 面談URL           |
| interview_type    | string   | online / onsite |
| interview_partner | string   | 面談相手            |
| strategy          | text     | 面談戦略            |
| concerns          | json     | 懸念点             |
| checklist         | json     | チェックリスト         |
| created_at        | datetime | 作成日時            |
| updated_at        | datetime | 更新日時            |

## 4.7 interview_questions

| カラム            | 型        | 内容                  |
| -------------- | -------- | ------------------- |
| id             | string   | 質問ID                |
| preparation_id | string   | 面談準備ID              |
| project_id     | string   | 案件ID                |
| question       | text     | 想定質問                |
| category       | string   | 技術 / PM / 条件 / 経歴   |
| priority       | string   | high / medium / low |
| memo           | text     | メモ                  |
| sort_order     | integer  | 並び順                 |
| created_at     | datetime | 作成日時                |

## 4.8 interview_answers

| カラム         | 型        | 内容       |
| ----------- | -------- | -------- |
| id          | string   | 回答ID     |
| question_id | string   | 質問ID     |
| ai_answer   | text     | AI回答案    |
| user_answer | text     | ユーザー編集回答 |
| created_at  | datetime | 作成日時     |
| updated_at  | datetime | 更新日時     |

## 4.9 interview_reverse_questions

| カラム            | 型        | 内容                |
| -------------- | -------- | ----------------- |
| id             | string   | 逆質問ID             |
| preparation_id | string   | 面談準備ID            |
| project_id     | string   | 案件ID              |
| question       | text     | 自分から聞く質問          |
| category       | string   | 役割 / 技術 / 体制 / 契約 |
| checked        | boolean  | 面談で確認済みか          |
| memo           | text     | メモ                |
| sort_order     | integer  | 並び順               |
| created_at     | datetime | 作成日時              |

## 4.10 interview_notes

| カラム         | 型        | 内容     |
| ----------- | -------- | ------ |
| id          | string   | 面談メモID |
| project_id  | string   | 案件ID   |
| user_id     | string   | ユーザーID |
| during_note | text     | 面談中メモ  |
| after_note  | text     | 面談後メモ  |
| impression  | text     | 印象     |
| next_action | text     | 次アクション |
| created_at  | datetime | 作成日時   |
| updated_at  | datetime | 更新日時   |

## 4.11 reminders

| カラム           | 型        | 内容                                     |
| ------------- | -------- | -------------------------------------- |
| id            | string   | リマインドID                                |
| project_id    | string   | 案件ID                                   |
| user_id       | string   | ユーザーID                                 |
| reminder_type | string   | reply / follow_up / interview / result |
| remind_at     | datetime | リマインド日時                                |
| message       | text     | 表示メッセージ                                |
| done          | boolean  | 完了済み                                   |
| created_at    | datetime | 作成日時                                   |

## 4.12 calendar_events

| カラム             | 型        | 内容                       |
| --------------- | -------- | ------------------------ |
| id              | string   | カレンダー連携ID                |
| project_id      | string   | 案件ID                     |
| user_id         | string   | ユーザーID                   |
| google_event_id | string   | Google Calendar event ID |
| calendar_url    | string   | Google Calendar URL      |
| title           | string   | イベントタイトル                 |
| start_at        | datetime | 開始日時                     |
| end_at          | datetime | 終了日時                     |
| created_at      | datetime | 作成日時                     |

## 4.13 ai_extraction_logs

| カラム         | 型        | 内容                                   |
| ----------- | -------- | ------------------------------------ |
| id          | string   | AIログID                               |
| user_id     | string   | ユーザーID                               |
| project_id  | string   | 案件ID                                 |
| input_text  | text     | 入力テキスト                               |
| output_json | json     | AI出力                                 |
| task_type   | string   | extraction / interview_prep / answer |
| model       | string   | 使用モデル                                |
| created_at  | datetime | 作成日時                                 |

## 4.14 billing_subscriptions

| カラム                    | 型        | 内容                           |
| ---------------------- | -------- | ---------------------------- |
| id                     | string   | サブスクID                       |
| user_id                | string   | ユーザーID                       |
| stripe_customer_id     | string   | Stripe customer ID           |
| stripe_subscription_id | string   | Stripe subscription ID       |
| plan                   | string   | free / pro                   |
| status                 | string   | active / canceled / past_due |
| current_period_end     | datetime | 契約期間終了                       |
| created_at             | datetime | 作成日時                         |
| updated_at             | datetime | 更新日時                         |
