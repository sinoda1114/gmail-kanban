# Live2D アバター セットアップガイド

このガイドでは、Gmail Kanban の面談練習ライブモードで Live2D アバターを有効にする方法を説明します。

## 前提条件

- Node.js 18+ と pnpm がインストールされていること
- Gmail Kanban リポジトリがクローンされていること

## セットアップ手順

### 1. Live2D モデルの取得

#### オプション A: Live2D 公式サンプルモデル「Hiyori」を使用

1. [Live2D Cubism SDK for Web](https://www.live2d.com/en/download/cubism-sdk/download-web/) にアクセス
2. SDK をダウンロード（アカウント登録が必要）
3. ダウンロードした ZIP ファイルを解凍
4. `Samples/Resources/Hiyori` フォルダを見つける
5. `Hiyori` フォルダ全体を `public/live2d-models/` にコピー

最終的なディレクトリ構造:
```
public/live2d-models/
└── Hiyori/
    ├── Hiyori.model3.json
    ├── Hiyori.moc3
    ├── Hiyori.physics3.json
    ├── Hiyori.pose3.json
    ├── *.png (テクスチャファイル)
    └── *.motion3.json (モーションファイル)
```

#### オプション B: 他の Live2D モデルを使用

他の Live2D モデルを使用する場合:

1. モデルファイルを `public/live2d-models/<モデル名>/` に配置
2. `src/components/projects/Live2DAvatar.tsx` の `modelPath` プロパティを変更:
   ```tsx
   modelPath="/live2d-models/<モデル名>/<モデル名>.model3.json"
   ```

### 2. ライセンスの確認

Live2D モデルを使用する前に、必ずライセンスを確認してください。

**Live2D Cubism SDK サンプルモデル「Hiyori」のライセンス:**
- 個人・非商用利用: 無料
- 商用利用: Live2D Inc. からライセンスを取得する必要があります
- 詳細: [Live2D Proprietary Software License Agreement](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html)

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
6. Live2D アバターが表示され、相手役が話すと口が動くことを確認

### 4. トラブルシューティング

#### Live2D モデルが表示されない

**チェック項目:**

1. **モデルファイルのパス**
   - ブラウザの開発者ツール（F12）→ ネットワークタブで `Hiyori.model3.json` がロードされているか確認
   - 404 エラーが出ている場合は、パスが間違っています

2. **モデルファイルの破損**
   - コンソールに Live2D 関連のエラーが出ていないか確認
   - モデルファイルを再ダウンロードして配置し直す

3. **ブラウザの互換性**
   - Chrome、Edge、Firefox の最新版を使用してください
   - Safari は一部の機能が動作しない可能性があります

#### SVG アバターが表示される

Live2D モデルが見つからない場合、自動的に SVG アバター（既存のシンプルな顔）にフォールバックします。これは正常な動作です。

**対処法:**
- Live2D モデルファイルが正しく配置されているか確認
- ブラウザのコンソールでエラーメッセージを確認

#### リップシンクが動作しない

**チェック項目:**

1. **マイク許可**
   - ブラウザがマイクへのアクセスを許可しているか確認

2. **Gemini API キー**
   - 環境変数 `GOOGLE_GENERATIVE_AI_API_KEY` が設定されているか確認

3. **音声再生**
   - 相手役の音声が実際に再生されているか確認
   - 音量が小さすぎるとリップシンクが目立たない場合があります

## カスタマイズ

### アバターのサイズを変更

`src/components/projects/PracticeLivePresence.tsx` で調整:

```tsx
const avatarWidth = 200;  // 幅（ピクセル）
const avatarHeight = 260; // 高さ（ピクセル）
```

### リップシンク感度を調整

`src/components/projects/Live2DAvatar.tsx` で調整:

```tsx
// 音声レベルの増幅率（デフォルト: 2）
const targetMouthOpen = Math.max(0, Math.min(1, audioLevel * 2));

// スムージング速度（デフォルト: 12）
const smoothFactor = Math.min(1, deltaTime * 12);
```

## 本番環境へのデプロイ

1. Live2D モデルファイルを `public/live2d-models/` に配置
2. Git にコミット（`.gitignore` で除外されていないことを確認）
3. Vercel などのホスティングサービスにデプロイ

**注意:**
- モデルファイルのライセンスを必ず確認してください
- 商用利用の場合は適切なライセンスを取得してください

## 参考リンク

- [Live2D Cubism SDK for Web](https://www.live2d.com/en/sdk/download/web/)
- [pixi-live2d-display GitHub](https://github.com/guansss/pixi-live2d-display)
- [AITuber OnAir](https://github.com/shinshin86/aituber-onair) - リップシンクの参考実装

## サポート

問題が発生した場合は、GitHub Issues で報告してください。
