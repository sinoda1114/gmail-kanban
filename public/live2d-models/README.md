# Live2D Models

このディレクトリには Live2D Cubism モデルを配置します。

## 使用可能なモデル

### Hiyori（サンプルモデル）

Live2D Cubism SDK のサンプルモデル「Hiyori」を使用します。

**ライセンス**: Live2D Proprietary Software License Agreement
- 個人・非商用利用は無料
- サンプルモデルは学習・開発目的で使用可能
- 詳細: https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html

**ダウンロード方法**:

1. [Live2D Cubism SDK for Web](https://www.live2d.com/en/download/cubism-sdk/download-web/) からサンプルをダウンロード
2. `Samples/Resources/Hiyori` フォルダを `public/live2d-models/Hiyori` にコピー

または、以下の構造で配置:

```
public/live2d-models/
└── Hiyori/
    ├── Hiyori.model3.json
    ├── Hiyori.moc3
    ├── Hiyori.physics3.json
    ├── *.png (テクスチャファイル)
    └── *.motion3.json (モーションファイル)
```

## 代替モデル

他の無料 Live2D モデルを使用する場合:
- [Live2D 公式サンプル](https://www.live2d.com/en/download/sample-data/)
- [nizima](https://nizima.com/) (商用利用は要確認)
- カスタムモデル (Live2D Cubism Editor で作成)
