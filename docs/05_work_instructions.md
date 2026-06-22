# 作業指示書

## 5.1 目的

Gmail案件タスク管理アプリのMVPを実装する。
まずは自分用に利用し、将来的な公開・課金にも耐えられる構成にする。

## 5.2 技術スタック

技術スタックは [06_tech_stack.md](06_tech_stack.md) を正とする（確定版）。要点のみ再掲。

| 領域    | 技術（確定）             |
| ----- | ------------------ |
| フロント  | Next.js App Router |
| UI    | Mantine            |
| D&D   | dnd-kit            |
| 認証    | Clerk              |
| DB    | Turso (libSQL)     |
| ORM   | Drizzle ORM        |
| AI    | Vercel AI SDK      |
| バリデーション | Zod              |
| カレンダー | Google Calendar API |
| 課金    | Stripe             |
| デプロイ  | Vercel             |

## 5.3 実装フェーズ

### Phase 1：基礎

* Next.jsプロジェクト作成
* UIライブラリ導入
* Clerk認証導入
* DB接続
* usersテーブル作成
* ログイン後のダッシュボード作成

### Phase 2：案件管理

* projectsテーブル作成
* 案件登録画面作成
* 案件一覧カンバン作成
* 案件詳細画面作成
* ステータス変更機能作成
* Gmail URL保存機能作成

### Phase 3：AI整理

* メール本文貼り付けフォーム作成
* AI整理API作成
* AI出力JSON定義
* AI整理結果確認画面作成
* 保存処理作成

### Phase 4：面談準備

* interview_preparationsテーブル作成
* interview_questionsテーブル作成
* interview_answersテーブル作成
* interview_reverse_questionsテーブル作成
* 面談準備タブ作成
* AI想定質問生成
* AI回答案生成
* AI逆質問生成
* AI面談戦略生成

### Phase 5：面談メモ・リマインド

* interview_notesテーブル作成
* remindersテーブル作成
* 面談中メモ作成
* 面談後メモ作成
* 要対応一覧作成
* リマインド判定ロジック作成

### Phase 6：Googleカレンダー連携

* ClerkのGoogle OAuthスコープ設定
* Google Calendar API連携
* 面談予定作成ボタン
* calendar_eventsテーブル保存
* Google Calendar URL保存

### Phase 7：Stripe課金

* Stripe Customer作成
* Subscription連携
* Webhook受信
* billing_subscriptions保存
* プラン別制限

## 5.4 画面実装順

```text
1. ログイン画面
2. 案件カンバン画面
3. 案件登録画面
4. AI整理結果確認画面
5. 案件詳細画面
6. 面談準備タブ
7. 面談メモタブ
8. 要対応一覧
9. 設定画面
10. 課金画面
```

## 5.5 AI出力JSON仕様

### 案件整理

```json
{
  "title": "React / Next.js フロントエンド開発案件",
  "agentCompany": "○○エージェント",
  "agentPerson": "山田",
  "summary": "BtoB向けWebサービスのフロントエンド開発案件。",
  "price": "90万円",
  "workRate": "週5日",
  "location": "フルリモート",
  "remoteType": "full_remote",
  "techStack": ["React", "Next.js", "TypeScript", "AWS"],
  "startDateText": "即日",
  "contractPeriod": "3ヶ月更新",
  "suggestedStatus": "reply_required",
  "suggestedNextAction": "希望単価と稼働開始可能日を返信する",
  "concerns": [
    "稼働開始時期の詳細が不明",
    "面談回数が不明"
  ]
}
```

### 面談準備

```json
{
  "questions": [
    {
      "question": "これまでのNext.jsの実務経験を教えてください",
      "category": "technical",
      "priority": "high"
    }
  ],
  "answers": [
    {
      "question": "これまでのNext.jsの実務経験を教えてください",
      "aiAnswer": "過去案件では、Next.jsを用いたWebアプリケーション開発に関わり..."
    }
  ],
  "reverseQuestions": [
    {
      "question": "今回期待されている役割は実装中心ですか、設計や要件整理も含みますか？",
      "category": "role"
    }
  ],
  "concerns": [
    "技術範囲が広く、期待役割の確認が必要"
  ],
  "strategy": "この案件では、PM経験と生成AI PoC経験を中心に話すとよい。",
  "checklist": [
    "案件概要を確認する",
    "想定質問への回答を確認する",
    "逆質問を確認する"
  ]
}
```

## 5.6 実装時の注意点

* AIの出力は必ずユーザーが確認して保存する
* ステータスはAIが勝手に確定しない
* Gmail本文はユーザー貼り付けのみ扱う
* Gmail API連携はMVPでは不要
* Gmail URLは外部リンクとして保存する
* Googleカレンダー連携は面談予定登録から始める
* 課金はMVP後半または公開前でよい
* ユーザーID単位で必ずデータを分離する

## 5.7 テスト観点

### 案件登録

* Gmail本文を貼り付けて登録できる
* Gmail URLなしでも登録できる
* AI整理結果を編集して保存できる

### カンバン

* ステータスごとに案件が表示される
* ドラッグ&ドロップで移動できる
* プルダウンでステータス変更できる

### 面談準備

* 想定質問を生成できる
* 回答案を生成できる
* 逆質問を生成できる
* 手編集して保存できる

### リマインド

* 返信必要の案件が要対応に出る
* 相手返信待ちが一定日数で表示される
* 面談前日に表示される

### Googleカレンダー

* 面談予定を作成できる
* Google Calendar URLを保存できる
* 案件詳細からカレンダー予定を確認できる

## 5.8 完了条件

MVP完了条件は以下。

* Googleログインできる
* 案件を登録できる
* Gmail本文からAI整理できる
* Gmail URLを保存できる
* カンバンで案件管理できる
* ステータス変更できる
* 案件詳細を確認できる
* 面談準備をAI生成できる
* 面談メモを保存できる
* 要対応案件を確認できる
