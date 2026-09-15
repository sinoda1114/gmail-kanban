# VRM Models

ライブ面談の既定アバターは **イラストの面接官**（`InterviewerAvatar`）です。  
VTuber 寄りの Seed-san は面接官として違和感が出るため、既定では使いません。

VRM を使いたい場合のみ、下の手順でローカル配置してください（大きな `.vrm` はリポジトリに同梱しません）。

## 推奨モデル: 千駄ヶ谷しの（CC0）

1. [VRoid Hub - Sendagaya Shino](https://hub.vroid.com/characters/1073405538936718994/models/5708407034098335138) から Download
2. `public/vrm-models/sendagaya-shino.vrm` に配置
3. `PracticeLivePresence` で `VRMAvatar` を有効化し、`DEFAULT_VRM_MODEL_PATH`（`"/vrm-models/sendagaya-shino.vrm"`）を渡す

**ライセンス**: CC0 — 商用可・改変可・クレジット不要

## ランタイム

- `@pixiv/three-vrm` / `three` — MIT（任意の VRM 表示用）
- 既定のイラスト面接官は SVG＋再生レベルによる口パク（別 TTS なし）

詳細: [`VRM_SETUP_GUIDE.md`](../../VRM_SETUP_GUIDE.md)
