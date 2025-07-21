# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ザリガニシューティングゲーム (Zarigani Rockets)

水中を舞台にしたシューティングゲーム。ザリガニを発射してスルメを狙い、制限時間内に高得点を目指す。

## プロジェクト構成

### ファイル構造
```
rokets/
├── index.html    # ゲームのHTMLファイル
├── game.js       # メインゲームロジック
├── sound.js      # Web Audio APIによる音響管理
├── style.css     # スタイルシート
└── resource/     # アセット（画像など）
```

### 主要コンポーネント

**game.js**
- `Game`クラス: ゲーム全体の管理（状態遷移、更新、描画）
- `Zarigani`クラス: 発射されるザリガニの実装
- `Surume`クラス: ターゲットとなるスルメの実装
- 状態管理: menu → playing → gameOver

**sound.js**
- `SoundManager`クラス: Web Audio APIを使用した音響効果
- メソッド: `playLaunchSound()`, `playHitSound()`, `playBGM()`, `playTimeWarning()`

## ゲーム仕様

### 基本ルール
- **制限時間**: 20秒
- **操作方法**: マウスドラッグで発射するザリガニの大きさと向きを決定、ボタンリリースで発射
- **ザリガニ**: 残弾無限、スルメを貫通する
- **スルメ**: 水中を漂うスルメがランダムな位置に次々と出現
- **得点**: スルメの大きさに応じて得点が変化（大きいほど高得点）

### ゲームメカニクス
- ドラッグの長さでザリガニの大きさが決定
- ザリガニが大きいほど速度が速く、多くのスルメを射抜ける
- スルメは一度出現したら消えることなく画面上に蓄積される

### 主要パラメータ
```javascript
// ゲーム設定
const GAME_TIME = 20; // 制限時間（秒）

// ザリガニ
const MIN_ZARIGANI_SIZE = 2; // 最小サイズ
const ZARIGANI_SPEED_MULTIPLIER = 0.2; // サイズに基づく速度係数

// スルメ
const MIN_SURUME_SIZE = 10;
const MAX_SURUME_SIZE = 300;
const SURUME_SPAWN_INTERVAL = 500; // 出現間隔（ミリ秒）
```

## 開発環境

### 起動方法
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

その後、ブラウザで `http://localhost:8000/rokets/` にアクセス。

### デバッグ
- ブラウザの開発者ツールでコンソールログを確認
- `game.js`内の`console.log`文でゲーム状態を監視

## アーキテクチャ

### ゲームループ
1. `update()`: ゲーム状態の更新（60fps）
2. `draw()`: Canvas描画
3. `requestAnimationFrame`による連続実行

### 状態管理
- `gameState`: 'menu', 'playing', 'gameOver'
- 各状態で異なる更新・描画処理を実行

### 衝突判定
- 円形の当たり判定（ザリガニとスルメ両方）
- 距離計算による単純な判定

### データ永続化
- ハイスコアは`localStorage`に保存
- キー: `zariganiShootingHighScore`

## 注意事項
- タッチイベントとマウスイベントの両方に対応
- ゲーム終了時にザリガニの状態をリセット
- スルメの吸い込みアニメーションは`shrinkRate`で制御