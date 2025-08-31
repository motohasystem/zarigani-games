# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# プロジェクト概要
「ザリガニゲームス」 - CoderDojo神山で制作されたブラウザゲーム集です。4つの独立したHTML5/JavaScript Canvas製ゲームを収録しています。

## ゲーム構成
- **zarigani/** - ザリガニ釣りゲーム（30秒制限のアクションゲーム）
- **rokets/** - ザリガニロケット（シューティングゲーム）
- **battle/** - ザリガニ大決戦（成長型アクションゲーム、60秒制限）
- **yuduki/** - ゴブリンアドベンチャー（RPG風ゲーム）

## ポータルサイト構造
- `index.html` - メインのポータルページ、各ゲームへのリンクカード表示
- `links.json` - ゲーム一覧データ（title, path, iconを含む）
- 各ゲームディレクトリに独立した完全なゲームファイル

## ファイル構成パターン
各ゲームディレクトリは以下の構造を持ちます：
```
game-directory/
├── index.html    # メインHTMLファイル
├── game.js       # ゲームロジック・Canvas描画
├── style.css     # UIスタイリング  
├── CLAUDE.md     # ゲーム固有の開発ガイド
└── resource/     # 画像リソース
    ├── zarigani.png
    ├── surume.png
    └── ...
```

## 開発環境・コマンド
```bash
# ローカルサーバー起動（Python）
python -m http.server 8000

# ローカルサーバー起動（Node.js）
npx serve .
```

## アーキテクチャ共通パターン
全ゲームで共通のJavaScriptパターンを使用：
- **Game**クラス - メインゲームクラス、状態管理
- **GameObject**クラス群 - ゲームオブジェクト（プレイヤー、敵、アイテム等）
- Canvas 2Dレンダリング
- Web Audio APIによる効果音生成
- ゲーム状態：`menu` → `playing` → `gameOver`

## 新しいゲーム追加手順
1. 新しいディレクトリを作成
2. `template/`ディレクトリからベースファイルをコピー
3. `links.json`にゲーム情報を追加
4. 各ファイルを編集してゲーム固有の実装を追加

## 画像リソース管理
- 各ゲームの`resource/`ディレクトリに透過PNG画像を配置
- 共通リソースは`resource/`ディレクトリ（ルートレベル）
- 画像ファイル名は統一命名規則（zarigani.png, surume.png等）

## 技術仕様
- 静的ファイル構成（サーバー不要）
- モダンブラウザ対応（Canvas、Web Audio API使用）
- レスポンシブデザイン対応
- 日本語UI

## 実行方法
1. ローカルサーバーを起動
2. ブラウザで `http://localhost:8000` にアクセス  
3. ポータルページから各ゲームを選択