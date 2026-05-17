"""各ゲームのタイトル画面を Playwright でスクショして OGP 画像にする。

build.py から呼ばれる。`dist/` を localhost で配信し、各サブディレクトリの
index.html を 1200x630 で開いてスクショ → `dist/<game>/ogp.png` に保存。
戻りバー (`back-bar.js`) は `?ogp=1` で早期 return するので画面に映らない。
"""

from __future__ import annotations

import socket
import subprocess
import sys
import time
from contextlib import contextmanager
from pathlib import Path

from playwright.sync_api import sync_playwright

OGP_WIDTH = 1200
OGP_HEIGHT = 630
WAIT_AFTER_LOAD_MS = 1500  # Canvas初期描画待ち


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@contextmanager
def serve(dist: Path, port: int):
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"],
        cwd=str(dist),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        # 起動待ち
        for _ in range(50):
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                    break
            except OSError:
                time.sleep(0.1)
        yield
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


def capture(dist: Path) -> tuple[list[Path], list[tuple[Path, str]]]:
    captured: list[Path] = []
    errors: list[tuple[Path, str]] = []

    games = sorted(p.parent for p in dist.glob("*/index.html"))
    if not games:
        return captured, errors

    port = _free_port()
    with serve(dist, port), sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--no-sandbox"])
        try:
            context = browser.new_context(
                viewport={"width": OGP_WIDTH, "height": OGP_HEIGHT},
                device_scale_factor=1,
            )
            for game_dir in games:
                slug = game_dir.name
                url = f"http://127.0.0.1:{port}/{slug}/index.html?ogp=1"
                out = game_dir / "ogp.png"
                page = context.new_page()
                try:
                    page.goto(url, wait_until="networkidle", timeout=15000)
                    page.wait_for_timeout(WAIT_AFTER_LOAD_MS)
                    page.screenshot(path=str(out), full_page=False)
                    captured.append(out.relative_to(dist))
                except Exception as exc:  # noqa: BLE001
                    errors.append((Path(slug) / "index.html", str(exc)))
                finally:
                    page.close()
            context.close()
        finally:
            browser.close()

    return captured, errors


def main() -> int:
    dist = Path(__file__).resolve().parent.parent / "dist"
    if not dist.exists():
        print(f"ERROR: {dist} does not exist. Run build.py first.")
        return 1

    print(f"Capturing OGP screenshots into {dist} ...")
    captured, errors = capture(dist)
    print(f"  Captured ({len(captured)}):")
    for p in captured:
        print(f"    + {p}")
    if errors:
        print(f"  Errors ({len(errors)}):")
        for p, msg in errors:
            print(f"    ! {p}: {msg}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
