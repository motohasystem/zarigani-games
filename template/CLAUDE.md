# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# プロジェクト概要
- ブラウザで動作するHTML5/JavaScript Canvas製ゲーム
- 静的ファイルのシンプルな構成
- 画像リソースとして透過PNG画像を使用

## ファイル構成
- `index.html` - メインのHTMLファイル、ゲームの基本構造
- `game.js` - ゲームロジック、Canvas描画処理、各種クラス定義
- `style.css` - UIスタイリング
- `resource/` - 画像リソース
  - `zarigani.png` - ザリガニの透過PNG画像
  - `surume.png` - スルメの画像
  - `surume_whole.png` - 完全なスルメの画像

## 開発環境
- 静的ファイルのため、ローカルサーバーで動作確認
- `python -m http.server 8000` または Live Server拡張機能を使用
- モダンブラウザ対応（Canvas、Web Audio API使用）

## アーキテクチャ
JavaScriptゲームのため、一般的なクラス構造：
- **Game**: メインゲームクラス、ゲーム状態管理
- **GameObject**: ゲームオブジェクトの基底クラス
- **UI**: ユーザーインターフェース管理

### ゲーム状態
- `menu` - タイトル画面
- `playing` - ゲーム中
- `gameOver` - ゲーム終了

## 音響システム
- Web Audio APIを使用してシンプルな効果音を生成
- 各種効果音（発射音、命中音、BGM）

## 開発コマンド
```bash
# ローカルサーバーを起動（Python）
python -m http.server 8000

# ローカルサーバーを起動（Node.js）
npx serve .
```

## 実行方法
1. ローカルサーバーを起動
2. ブラウザで `http://localhost:8000` にアクセス
3. index.htmlを開く