# VRM Models

このディレクトリには VRM アバターモデルを配置します。

## 使用可能なモデル

### 千駄ヶ谷しの（Sendagaya Shino）

VRoid Hub 公式サンプルモデル「千駄ヶ谷しの」を使用します。

**ライセンス**: CC0 (パブリックドメイン)
- 商用利用: ✅ 可能
- 改変: ✅ 可能
- クレジット表示: 不要（推奨）
- 詳細: https://vroid.pixiv.help/hc/en-us/articles/360013482714-Sendagaya-Shino

**ダウンロード方法**:

1. [VRoid Hub - Sendagaya Shino](https://hub.vroid.com/characters/1073405538936718994/models/5708407034098335138) にアクセス
2. 「Download」ボタンをクリック
3. ダウンロードした `.vrm` ファイルを `sendagaya-shino.vrm` にリネーム
4. `public/vrm-models/` に配置

または、以下のコマンドで直接ダウンロード:

```bash
# VRoid Hub から直接ダウンロード（要認証）
# または手動でダウンロードして配置
cd public/vrm-models/
# ダウンロードしたファイルを sendagaya-shino.vrm として配置
```

最終的なディレクトリ構造:

```
public/vrm-models/
└── sendagaya-shino.vrm
```

## 代替モデル

他の VRM モデルを使用する場合:

1. **CC0 または商用利用可能なライセンスのモデルを選択**
   - [VRoid Hub](https://hub.vroid.com/) でライセンスを確認
   - CC0 / MIT / Apache 2.0 などのオープンライセンス推奨

2. モデルファイルを `public/vrm-models/<モデル名>.vrm` に配置

3. `src/components/projects/VRMAvatar.tsx` の `modelPath` を変更:
   ```tsx
   modelPath="/vrm-models/<モデル名>.vrm"
   ```

## ライセンス情報

### ランタイムライブラリ

- **@pixiv/three-vrm**: MIT License
- **three-vrm-lip-sync**: MIT License
- **Three.js**: MIT License

### 推奨モデル

- **千駄ヶ谷しの (Sendagaya Shino)**: CC0 (パブリックドメイン)
  - 作者: VRoid Project (Pixiv Inc.)
  - 商用利用可能、クレジット表示不要

## 注意事項

- モデルファイルはリポジトリに含まれていません（サイズとライセンスの都合）
- 本番環境で使用する場合は、必ずモデルのライセンスを確認してください
- VRM モデルは VRoid Studio などで作成できます

## カスタムモデルの作成

VRoid Studio（無料）を使用して独自のモデルを作成できます:

1. [VRoid Studio](https://vroid.com/studio) をダウンロード
2. キャラクターを作成
3. VRM 形式でエクスポート
4. `public/vrm-models/` に配置
