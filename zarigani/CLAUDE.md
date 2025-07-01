# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# プロジェクト概要
- ブラウザで動作するザリガニ釣りゲーム（JavaScript/Canvas製）
- 30秒間の制限時間内にザリガニを釣り上げるアクションゲーム
- シンプルなクリック操作でプレイ可能

## ゲーム仕様
- ゲームを開始すると、マウスで餌を投げ入れる場所を選択します。
- クリックして餌を入れると、近くにいるザリガニが近寄ってきます。
- 餌に食いついたザリガニは、しばらくすると餌を離さなくなります。
- 餌を離さなくなった状態でクリックするとザリガニを釣り上げることができます。
- 餌を離す状態でクリックするとザリガニを取り逃がします。
- 30秒間で釣り上げたザリガニがスコアになります。
- ザリガニの大きさはランダムで５種類のサイズを用意してください。

## ファイル構成
- `index.html` - メインのHTMLファイル、ゲームの基本構造
- `game.js` - ゲームロジック、Canvas描画処理、各種クラス定義
- `style.css` - UIスタイリング
- `resource/` - 画像リソース
  - `zarigani.png` - ザリガニの透過PNG画像
  - `surume.png` - 餌の画像

## 開発環境
- 静的ファイルのため、ローカルサーバーで動作確認
- `python -m http.server 8000` または Live Server拡張機能を使用
- モダンブラウザ対応（Canvas、Web Audio API使用）

## アーキテクチャ
- **ZariganiGame**: メインゲームクラス、ゲーム状態管理
- **Zarigani**: ザリガニオブジェクト、AI行動制御
- **Bait**: 餌オブジェクト
- **PointEffect**: スコア表示エフェクト

### ゲーム状態
- `menu` - タイトル画面
- `playing` - ゲーム中
- `gameOver` - ゲーム終了

### ザリガニ状態
- `normal` - 通常状態（ランダム移動）
- `approaching` - 餌に近づき中
- `nibbling` - 餌をつついている状態
- `biting` - 完全に食いついた状態（釣り上げ可能）

## 音響システム
- Web Audio APIを使用してシンプルな効果音を生成
- 餌投入音、食いつき音、釣り上げ成功音
