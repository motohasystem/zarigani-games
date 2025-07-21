# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ザリガニシューティングゲーム (Zarigani Rockets)

水中を舞台にしたシューティングゲーム。ザリガニを発射してスルメを狙い、制限時間内に高得点を目指す。

## 開発環境

### 起動方法
```bash
# Python HTTP Server
python -m http.server 8000

# Node.js Serve
npx serve .

# Live Server (VS Code Extension)
# 右クリック > "Open with Live Server"
```

その後、ブラウザで `http://localhost:8000/rokets/` にアクセス。

### プロジェクト構成

```
rokets/
├── index.html     # ゲームのメインHTMLファイル
├── game.js        # メインゲームロジック (860行)
├── sound.js       # Web Audio APIによる音響管理 (265行)
├── style.css      # スタイルシート (221行)
├── interview.md   # ゲーム仕様のインタビュー記録
└── resource/      # 画像アセット
    ├── zarigani.png
    ├── surume.png
    └── surume_whole.png
```

### アーキテクチャ

**game.js - イベント駆動型アーキテクチャ**
- **状態管理**: `GameState` enum (TITLE, PLAYING, RESULT)
- **ゲームオブジェクト**: オブジェクトプールパターンで配列管理
  - `zariganis[]`: 発射されたザリガニ
  - `surumes[]`: ターゲットのスルメ
  - `effects[]`: 視覚エフェクト
  - `bubbles[]`: 背景の泡
  - `comboTexts[]`: コンボ表示
- **ゲームループ**: `requestAnimationFrame` による60fps更新
- **入力処理**: マウス・タッチ両対応のドラッグ操作

**sound.js - Web Audio API実装**
- `SoundManager`クラス: プロシージャル音響生成
- メソッド: `play(soundName)` - 'shoot', 'hit', 'combo', 'miss', 'warning'
- ユーザー操作後の初期化が必要（`soundManager.init()`）

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

### 重要な定数
```javascript
// game.js:9-16 GAME_CONFIG オブジェクト
const GAME_CONFIG = {
    GAME_TIME: 20,              // 制限時間（秒）
    SURUME_SPAWN_INTERVAL: 500, // スルメ出現間隔（ミリ秒）
    SURUME_MIN_SIZE: 10,        // スルメ最小サイズ
    SURUME_MAX_SIZE: 300,       // スルメ最大サイズ
    ZARIGANI_MIN_SIZE: 2,       // ザリガニ最小サイズ
    CANVAS_PADDING: 50          // キャンバス端からの余白
};
```

## コアゲームメカニクス

### ザリガニ発射システム
- **ドラッグ操作**: 距離が発射力とサイズを決定
- **発射方向**: ドラッグと逆方向に発射（`angle = Math.atan2(-dy, -dx)`）
- **速度計算**: `speed = size * 0.3`
- **ハサミ判定**: 進行方向前方80%位置でスルメとの衝突判定

### サイズベース食事システム
- **食べられる条件**: `canEat(zariganiSize, surumeSize)` in game.js:386-392
- **許容範囲**: ザリガニサイズの50%〜150%のスルメのみ食べられる
- **コンボシステム**: 連続ヒットで倍率増加（1倍→2倍→4倍→8倍...）

### ビジュアルフィードバック
- **ドラッグプレビュー**: 食べられるサイズ範囲を緑の円で表示
- **透明度制御**: 食べられないスルメは半透明（0.3）、食べられるものは不透明（1.0）
- **ミスエフェクト**: "Too Small!" または "Too Big!" テキスト表示

## 技術実装詳細

### キャンバス描画システム
- **レスポンシブサイズ**: ゲーム開始時に動的リサイズ（game.js:160-166）
- **画像フォールバック**: PNG画像未読み込み時は色付き矩形で代替描画
- **座標変換**: `ctx.translate()` + `ctx.rotate()` で回転描画

### 衝突判定アルゴリズム
```javascript
// game.js:368-383 checkCollision関数
// ザリガニのハサミ位置計算
const clawX = zarigani.x + Math.cos(zarigani.angle) * clawOffset;
const clawY = zarigani.y + Math.sin(zarigani.angle) * clawOffset;
// 距離ベース円形判定
const distance = Math.hypot(clawX - surume.x, clawY - surume.y);
return distance < (clawRadius + surume.size / 2);
```

### データ永続化
- **ハイスコア**: `localStorage` キー `'zariganiHighScore'`
- **保存タイミング**: 新記録達成時のみ
- **読み込み**: ページロード時に `loadHighScore()` 実行

## デバッグ・テスト

### 開発者ツール活用
```javascript
// 主要なログ出力ポイント
console.log('Canvas resized to:', canvas.width, 'x', canvas.height); // game.js:165
console.log('Images loaded successfully'); // game.js:249
```

### 重要な動作確認項目
1. **画像読み込み**: リソースフォルダの PNG ファイル
2. **サウンド初期化**: ユーザー操作後の Web Audio API 開始
3. **タッチ操作**: モバイルデバイスでのドラッグ操作
4. **ゲーム状態遷移**: TITLE → PLAYING → RESULT

## トラブルシューティング

### よくある問題
- **音が鳴らない**: `soundManager.init()` がユーザー操作前に呼ばれている
- **画像が表示されない**: `resource/` フォルダのパス確認、HTTPサーバー必須
- **タッチ操作不具合**: `touch-action: none` スタイルが適用されているか確認
- **Canvas サイズ**: ゲーム開始時の動的リサイズタイミング