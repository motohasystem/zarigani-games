"""AWS Amplify 用のビルドスクリプト。

- リポジトリの公開対象ファイルを `dist/` にコピー
- 各ゲームの index.html に `../back-bar.js` のscriptタグを自動挿入
  （既に手動で入っているファイルはスキップ）
- `--screenshots` フラグが渡された場合のみ、Playwright で各ゲームを
  撮影して `dist/<game>/ogp.png` を生成し、`og:image` meta を自動挿入

ローカル開発時はフラグなしで実行することで、Chromiumの重い処理をスキップできる。
Amplify ビルド時は `--screenshots` を付ける。
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

EXCLUDE_DIRS = {
    ".git",
    ".github",
    ".vscode",
    ".claude",
    "scripts",
    "dist",
    "node_modules",
    "template",
}
EXCLUDE_ROOT_FILES = {"CLAUDE.md", "README.md", ".gitignore"}

HAS_BACK_BAR_RE = re.compile(r"<script[^>]*back-bar\.js", re.IGNORECASE)
BODY_CLOSE_RE = re.compile(r"</body\s*>", re.IGNORECASE)
HEAD_CLOSE_RE = re.compile(r"</head\s*>", re.IGNORECASE)
HAS_OG_IMAGE_RE = re.compile(r"<meta[^>]+property=[\"']og:image[\"']", re.IGNORECASE)

SCRIPT_TAG = '    <script src="../back-bar.js"></script>\n'
OG_IMAGE_META = '    <meta property="og:image" content="./ogp.png" />\n'


def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if rel.parts[0] in EXCLUDE_DIRS:
        return True
    if path.is_file() and len(rel.parts) == 1 and path.name in EXCLUDE_ROOT_FILES:
        return True
    return False


def copy_tree() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for src in ROOT.rglob("*"):
        if should_skip(src):
            continue
        rel = src.relative_to(ROOT)
        dst = DIST / rel
        if src.is_dir():
            dst.mkdir(parents=True, exist_ok=True)
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)


def inject_back_bar() -> tuple[list[Path], list[Path], list[Path]]:
    inserted: list[Path] = []
    skipped: list[Path] = []
    missing_body: list[Path] = []

    for index_path in sorted(DIST.glob("*/index.html")):
        content = index_path.read_text(encoding="utf-8")
        rel = index_path.relative_to(DIST)

        if HAS_BACK_BAR_RE.search(content):
            skipped.append(rel)
            continue

        matches = list(BODY_CLOSE_RE.finditer(content))
        if not matches:
            missing_body.append(rel)
            continue

        last = matches[-1]
        new_content = content[: last.start()] + SCRIPT_TAG + content[last.start() :]
        index_path.write_text(new_content, encoding="utf-8")
        inserted.append(rel)

    return inserted, skipped, missing_body


def inject_og_image(captured: set[str]) -> tuple[list[Path], list[Path]]:
    """og:image meta タグを各ゲームの index.html に挿入。

    captured: スクショ生成に成功したゲーム slug の集合。これに含まれないゲームは
    `dist/<slug>/ogp.png` が無いはずなので meta 挿入もスキップ。
    """
    inserted: list[Path] = []
    skipped: list[Path] = []

    for index_path in sorted(DIST.glob("*/index.html")):
        rel = index_path.relative_to(DIST)
        slug = rel.parts[0]
        if slug not in captured:
            continue

        content = index_path.read_text(encoding="utf-8")
        if HAS_OG_IMAGE_RE.search(content):
            skipped.append(rel)
            continue

        head_match = HEAD_CLOSE_RE.search(content)
        if not head_match:
            continue

        new_content = (
            content[: head_match.start()] + OG_IMAGE_META + content[head_match.start() :]
        )
        index_path.write_text(new_content, encoding="utf-8")
        inserted.append(rel)

    return inserted, skipped


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--screenshots",
        action="store_true",
        help="Playwright で各ゲームのOGPスクショを生成（重い）",
    )
    args = parser.parse_args()

    print(f"Copying tree to {DIST} ...")
    copy_tree()

    print("Injecting back-bar.js into subdirectory index.html files ...")
    inserted, skipped, missing_body = inject_back_bar()
    print(f"  Inserted ({len(inserted)}):")
    for p in inserted:
        print(f"    + {p}")
    print(f"  Skipped, already present ({len(skipped)}):")
    for p in skipped:
        print(f"    - {p}")
    if missing_body:
        print(f"  WARNING: no </body> tag found ({len(missing_body)}):")
        for p in missing_body:
            print(f"    ! {p}")
        return 1

    if args.screenshots:
        print("Capturing OGP screenshots (Playwright) ...")
        from screenshot_ogp import capture

        captured_paths, errors = capture(DIST)
        captured_slugs: set[str] = {p.parts[0] for p in captured_paths}
        print(f"  Captured ({len(captured_paths)}):")
        for p in captured_paths:
            print(f"    + {p}")
        if errors:
            print(f"  Screenshot errors ({len(errors)}):")
            for path, msg in errors:
                print(f"    ! {path}: {msg}")

        print("Injecting og:image meta tags ...")
        og_inserted, og_skipped = inject_og_image(captured_slugs)
        print(f"  Inserted ({len(og_inserted)}):")
        for p in og_inserted:
            print(f"    + {p}")
        print(f"  Skipped, already present ({len(og_skipped)}):")
        for p in og_skipped:
            print(f"    - {p}")

        if errors:
            return 1
    else:
        print("(Skipped OGP screenshots; pass --screenshots to enable)")

    print("Build complete.")
    return 0


if __name__ == "__main__":
    # screenshot_ogp.py を import 可能にするため scripts/ を sys.path に追加
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    sys.exit(main())
