# VRM Models

ライブ面談の既定アバターは **イラストの面接官**（`InterviewerAvatar`）です。  
ファイルを置いただけでは VRM には切り替わりません（意図的）。

## 任意: VRM に差し替える手順

1. [VRoid Hub - Sendagaya Shino](https://hub.vroid.com/characters/1073405538936718994/models/5708407034098335138) から CC0 モデルを Download  
2. `public/vrm-models/sendagaya-shino.vrm` に配置  
3. `PracticeLivePresence.tsx` で `InterviewerAvatar` の代わりに `VRMAvatar` を描画するよう変更する例:

```tsx
import { DEFAULT_VRM_MODEL_PATH, VRMAvatar } from "./VRMAvatar";

<VRMAvatar
  audioLevelRef={playbackLevelRef}
  lipSyncActive={talking}
  width={200}
  height={260}
  modelPath={DEFAULT_VRM_MODEL_PATH} // "/vrm-models/sendagaya-shino.vrm"
  onLoadError={() => { /* fall back to InterviewerAvatar if desired */ }}
/>
```

**ライセンス**: 千駄ヶ谷しの — CC0（商用可・改変可・クレジット不要）

## ランタイム

- 既定: SVG 面接官 + 再生レベル口パク（別 TTS なし）
- 任意 VRM: `@pixiv/three-vrm` / `three`（MIT）

詳細: [`VRM_SETUP_GUIDE.md`](../../VRM_SETUP_GUIDE.md)
