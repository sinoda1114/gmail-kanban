# ライブ面談アバター方針

## 現在の既定

ライブ面談の相手役は **`InterviewerAvatar`**（イラストの面接官）です。

- ビジネススーツの SVG
- Gemini Live の再生レベルで口パク（別 TTS なし）
- 大きな `.vrm` の同梱・CDN 依存なし

実装: `src/components/projects/InterviewerAvatar.tsx`  
配線: `src/components/projects/PracticeLivePresence.tsx`

## なぜ VRM を既定にしないか

以前の既定だった Seed-san など VTuber 向けサンプルは、背面メカアームなど面接官として違和感が出やすいです。  
商用可能な日本人向けモデル（例: 千駄ヶ谷しの CC0）は配布サイズが大きく、リポジトリ同梱にも向きません。

そのため **イラスト面接官を正** とし、`@pixiv/three-vrm` / `three` 依存は外しています。

## 将来 VRM を再導入する場合

1. 商用可能な `.vrm` の配布方法（CDN 固定 or ユーザー配置）を決める  
2. `@pixiv/three-vrm` と `three` を再追加  
3. `PracticeLivePresence` に明示的な切替（例: `avatar="illustration" | "vrm"`）を用意し、docs と一致させる  

「ファイルを置いただけ」で切り替わる状態にはしない（幽霊 API を作らない）。
