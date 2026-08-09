# 課金方針メモ（Stripe / RevenueCat）

> 長期方針。タスク Issue ではなくここに置く（`notes/task-management-issue-workflow.md` の例外）。  
> 記録日: 2026-08-09

## 結論

**Web の課金は Stripe のまま進める。RevenueCat は今は入れない。**

Stripe アカウントは既にある。Checkout / Webhook / `billing_subscriptions` / Billing UI（T-21）も Stripe 前提で載っている。Web サブスクだけなら直結の方が短い。

## 比較（この PJ 向け）

| | Stripe（採用） | RevenueCat |
|---|---|---|
| 向いているもの | Web サブスク | ネイティブ IAP の横断管理 |
| 現状との相性 | 実装・アカウントとも既存 | 載せ替え or 二重管理になる |
| 今やるか | **やる**（T-21 など） | **やらない** |

## RevenueCat を検討するタイミング

次が揃ったときだけ再検討する。

- ネイティブアプリ（iOS / Android）を出し、App Store / Google Play 課金もやる
- Web とアプリで「Pro かどうか」を同じ entitlement で揃えたい

その場合も「Stripe を捨てて RevenueCat 一本」ではなく、おおむね次の分け方を想定する。

- ストア課金: RevenueCat
- Web 課金: Stripe 継続、または RevenueCat 経由で Stripe

## 実装上の注意

- プラン上限・entitlement の判定は `src/lib/billing.ts` 周りに寄せ、UI や Checkout 詳細と分離しておく（将来 RC を足しても差し替えやすい）
- 価格・プラン表の正本が別ドキュメントに分かれたら、このメモからリンクする
