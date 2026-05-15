"""GitHub Pages 用のビルドスクリプト。

- リポジトリの公開対象ファイルを `dist/` にコピー
- 各ゲームディレクトリの index.html に `../back-bar.js` のscriptタグが
  入っていなければ、`</body>` 直前に自動挿入する
- 既に手動で入っているファイルはスキップ（二重挿入しない）
"""

from __future__ import annotations

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
SCRIPT_TAG = '    <script src="../back-bar.js"></script>\n'


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


def main() -> int:
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

    print("Build complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
