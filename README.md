# ザリガニゲームス

CoderDojo神山で制作されたブラウザゲーム集です。

## ゲーム一覧

| ゲーム | 説明 |
|--------|------|
| ザリガニ釣りゲーム | 30秒制限のアクションゲーム |
| ザリガニロケット | シューティングゲーム |
| ザリガニ大決戦 | 成長型アクションゲーム（60秒制限） |
| ゴブリンアドベンチャー | RPG風ゲーム |
| ラン&ジャンプ | ランニングアクション |
| セカイクラベ | 国の大きさを比較 |
| ウチュークラベ | 天体のサイズを比較 |
| 魚サイズくらべアクアリウム | 魚のサイズを比較 |
| わくわくベースボール | 野球ゲーム |
| エビフライの星キャッチ | アクションゲーム |

## 遊び方

### オンライン

GitHub Pagesなどでホスティングされている場合、ブラウザから直接アクセスできます。

### ローカル

```bash
# リポジトリをクローン
git clone https://github.com/your-repo/zarigani-games.git
cd zarigani-games

# ローカルサーバーを起動（Python）
python -m http.server 8000

# または Node.js
npx serve .
```

ブラウザで http://localhost:8000 にアクセスしてください。

## 技術仕様

- HTML5 Canvas
- Vanilla JavaScript
- Web Audio API（効果音）
- レスポンシブデザイン対応

## 新しいゲームの追加

1. 新しいディレクトリを作成
2. `links.json` にゲーム情報を追加:

```json
{
    "path": "./new-game/",
    "title": "ゲームタイトル",
    "description": "説明文（任意）",
    "icon": "絵文字または画像パス"
}
```

## リンク

- [CoderDojo神山](https://coderdojo.kamiyama.club/)
- [CoderDojo Japan](https://coderdojo.jp/)

## ライセンス

このプロジェクトはCoderDojo神山で制作されました。
