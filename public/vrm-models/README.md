# VRM Models

既定のライブ面談アバターは **CDN 上の Seed-san**（`DEFAULT_VRM_MODEL_PATH`）を使います。  
Preview / Production でも 404 にならないよう、リポジトリへ大きな `.vrm` は同梱していません。

## 既定モデル（デプロイ同梱不要）

- **Seed-san**（VirtualCast）— [VRM Public License 1.0](https://vrm.dev/en/licenses/1.0/)
- URL は `src/components/projects/VRMAvatar.tsx` の `DEFAULT_VRM_MODEL_PATH`（jsDelivr・コミット固定）

## 推奨の差し替え: 千駄ヶ谷しの（CC0）

日本人向け見た目の公式サンプルです。

1. [VRoid Hub - Sendagaya Shino](https://hub.vroid.com/characters/1073405538936718994/models/5708407034098335138) から Download
2. `public/vrm-models/sendagaya-shino.vrm` に配置
3. `DEFAULT_VRM_MODEL_PATH` を `"/vrm-models/sendagaya-shino.vrm"` に変更

**ライセンス**: CC0 — 商用可・改変可・クレジット不要（詳細は VRoid ヘルプ）

## ランタイム

- `@pixiv/three-vrm` / `three` — MIT
- リップシンクは再生 PCM レベル → VRM expression（Aa / Ih）。別 TTS なし

詳細手順: [`VRM_SETUP_GUIDE.md`](../../VRM_SETUP_GUIDE.md)
