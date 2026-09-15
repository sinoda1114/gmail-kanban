# VRM / アバター セットアップガイド

> 短い配置メモは [`public/vrm-models/README.md`](./public/vrm-models/README.md) も参照。

ライブ面談の**既定アバターはイラストの面接官**（`InterviewerAvatar`）です。  
スーツ姿の簡易イラスト＋再生レベル口パクで、VTuber 風モデルより面接官らしく見せます。

任意で VRM（例: 千駄ヶ谷しの CC0）に差し替える場合の手順を以下に書きます。  
モデルパスの正本は `DEFAULT_VRM_MODEL_PATH`（`src/components/projects/VRMAvatar.tsx`）。

## 前提条件

- Node.js 20.9+ と pnpm がインストールされていること（Next.js 16 の engines 要件）
- Gmail Kanban リポジトリがクローンされていること

## セットアップ手順（任意: VRM に差し替え）

### 1. VRM モデルを置く

既定はイラスト面接官のため、モデルなしで動作します。VRM にする場合:

#### 推奨: 千駄ヶ谷しの（CC0）

1. [VRoid Hub - Sendagaya Shino](https://hub.vroid.com/characters/1073405538936718994/models/5708407034098335138) から Download
2. `public/vrm-models/sendagaya-shino.vrm` に配置
3. `PracticeLivePresence` で `VRMAvatar` を有効化し、`DEFAULT_VRM_MODEL_PATH`（`"/vrm-models/sendagaya-shino.vrm"`）を渡す

**ライセンス**: CC0（商用可・改変可・クレジット不要）

> Seed-san など背面にメカアームのある VTuber サンプルは、面接官としては違和感が出やすいので推奨しません。

#### オプション B: 他の VRM モデル

他の VRM モデルを使用する場合:

1. **商用利用可能なライセンスのモデルを選択**
   - [VRoid Hub](https://hub.vroid.com/) でモデルを探す
   - ライセンスを必ず確認（CC0 / MIT / Apache 2.0 など推奨）
   
2. モデルファイルを `public/vrm-models/<モデル名>.vrm` に配置

3. `src/components/projects/VRMAvatar.tsx` の `DEFAULT_VRM_MODEL_PATH` を変更:
   ```tsx
   export const DEFAULT_VRM_MODEL_PATH = "/vrm-models/<モデル名>.vrm";
   ```
   Presence も同じ定数を参照する（HEAD による別 URL チェックはしない）。

#### オプション C: カスタムモデルを作成

VRoid Studio（無料）で独自のモデルを作成:

1. [VRoid Studio](https://vroid.com/studio) をダウンロード
2. キャラクターを作成
3. VRM 形式でエクスポート
4. `public/vrm-models/` に配置

### 2. ライセンスの確認

VRM モデルを使用する前に、必ずライセンスを確認してください。

**推奨モデル「千駄ヶ谷しの」のライセンス:**
- ライセンス: CC0 (パブリックドメイン)
- 商用利用: ✅ 可能
- 改変: ✅ 可能
- クレジット表示: 不要（推奨はされる）
- 詳細: https://vroid.pixiv.help/hc/en-us/articles/360013482714-Sendagaya-Shino

**使用ライブラリのライセンス:**
- `@pixiv/three-vrm`: MIT License
- `three.js`: MIT License

リップシンクは別 TTS／別パッケージではなく、Gemini Live の再生音声レベルで
`@pixiv/three-vrm` の expression（Aa / Ih）を直接駆動します。

すべて商用利用可能です。

### 3. 動作確認

#### ローカル開発環境で確認

```bash
# 開発サーバーを起動
pnpm dev

# ブラウザで http://localhost:3000 を開く
```

#### 動作確認手順

1. Gmail Kanban にサインイン
2. 案件を1つ作成（または既存の案件を開く）
3. 案件詳細ページで「面談練習」タブに移動
4. 「通し練習を開始」→「ライブモード」を選択
5. マイクの許可を出す
6. イラストの面接官アバターが表示され、相手役が話すと口が動くことを確認  
   （任意で VRM に差し替えている場合は、そのモデルが表示されること）

### 4. トラブルシューティング

#### アバター／VRM が表示されない

**チェック項目:**

1. **既定（イラスト面接官）**
   - `PracticeLivePresence` が `InterviewerAvatar` を描画していること
2. **任意 VRM に差し替えた場合**
   - ネットワークタブで `sendagaya-shino.vrm`（または指定パス）が 200 であること
   - `PracticeLivePresence` で `VRMAvatar` への差し替え配線が済んでいること（ファイル配置だけでは切り替わりません）

#### イラスト面接官のままになる

既定動作です。VRM にするには `public/vrm-models/README.md` の差し替え手順（`VRMAvatar` への配線）を行ってください。

#### リップシンクが動作しない

**チェック項目:**

1. **マイク許可**
   - ブラウザがマイクへのアクセスを許可しているか確認

2. **Gemini API キー**
   - 環境変数 `GOOGLE_GENERATIVE_AI_API_KEY` が設定されているか確認

3. **音声再生**
   - 相手役の音声が実際に再生されているか確認
   - 音量が小さすぎるとリップシンクが目立たない場合があります

#### 3D レンダリングが重い

**対処法:**

1. **低ポリゴンモデルを使用**
   - VRoid Studio で「軽量化」オプションを有効にしてエクスポート

2. **レンダリング品質を下げる**
   - `src/components/projects/VRMAvatar.tsx` で調整:
   ```tsx
   renderer.setPixelRatio(1); // デバイスピクセル比を1に固定
   ```

## カスタマイズ

### アバターのサイズを変更

`src/components/projects/PracticeLivePresence.tsx` で調整:

```tsx
const avatarWidth = 200;  // 幅（ピクセル）
const avatarHeight = 260; // 高さ（ピクセル）
```

### カメラ位置を調整

`src/components/projects/VRMAvatar.tsx` で調整:

```tsx
camera.position.set(0, 1.3, 1.5); // x, y, z
camera.lookAt(0, 1.3, 0);         // 注視点
```

### リップシンク感度を調整

`src/components/projects/VRMAvatar.tsx` で調整:

```tsx
// 音声レベルの増幅率（デフォルト: 1.8）
const smoothedLevel = Math.max(0, Math.min(1, activeLevel * 1.8));
```

## 本番環境へのデプロイ

既定のイラスト面接官は追加アセット不要です。Preview / Production でもそのまま表示されます。

任意でローカル VRM を使う場合のみ:

1. VRM を `public/vrm-models/` に配置し、`PracticeLivePresence` を `VRMAvatar` に差し替える
2. Git にコミットして Vercel へデプロイ

**注意:**
- 大きな `.vrm` は最適化（VRoid Studio の軽量化）を検討してください

## 参考リンク

- [VRoid Hub](https://hub.vroid.com/) - VRM モデル配布プラットフォーム
- [VRoid Studio](https://vroid.com/studio) - VRM モデル作成ツール
- [@pixiv/three-vrm GitHub](https://github.com/pixiv/three-vrm)
- [千駄ヶ谷しの ライセンス情報](https://vroid.pixiv.help/hc/en-us/articles/360013482714-Sendagaya-Shino)

## サポート

問題が発生した場合は、GitHub Issues で報告してください。
