#!/usr/bin/env python3
"""
해도리 방 소품 그림 정리 스크립트.

AI로 뽑은 소품 그림을 앱에서 바로 쓸 수 있게 다듬고 등록한다.
  1) 배경 제거 (투명 PNG면 그대로, 단색 배경이면 가장자리부터 지움)
  2) 여백 자르기 + 살짝 여유 두기
  3) 긴 변 기준 600px로 줄이기
  4) public/room-items/<key>.png 로 저장
  5) lib/room-items.ts 의 해당 소품에 image, aspect 자동 기록

사용법 (diary-frontend 폴더에서):
  python3 scripts/process-room-items.py raw-items/
  python3 scripts/process-room-items.py raw-items/ --dry-run     # 저장 없이 결과만 보기

raw-items/ 안의 파일 이름은 소품 키와 같아야 한다.
  예: wall_clock.png, plant.jpg, rug.webp
해도리 자세 그림은 pose_<자세>.png 로 넣는다 (lib/haedori-actions.ts 의 HAEDORI_POSES 키).
  예: pose_sit.png, pose_lie.png, pose_read.png
  → public/images/haedori-poses/<자세>.png 저장 + HAEDORI_POSES에 image 자동 기록
필요한 패키지: pip install pillow numpy
"""

from __future__ import annotations

import re
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "room-items"
CATALOG = ROOT / "lib" / "room-items.ts"
POSE_DIR = ROOT / "public" / "images" / "haedori-poses"
POSE_CATALOG = ROOT / "lib" / "haedori-actions.ts"
POSE_PREFIX = "pose_"

MAX_SIDE = 600
PADDING = 6          # 자른 뒤 남길 여백(px)
BG_TOLERANCE = 38    # 배경색과 이 정도까지 비슷하면 배경으로 본다 (0~441)
EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def known_keys() -> set[str]:
    text = CATALOG.read_text(encoding="utf-8")
    return set(re.findall(r'^\s{2}(\w+): \{ key: "\1"', text, flags=re.M))


def known_poses() -> set[str]:
    text = POSE_CATALOG.read_text(encoding="utf-8")
    block = text.split("HAEDORI_POSES", 1)[1].split("\n}", 1)[0]
    return set(re.findall(r"^\s{2}(\w+): \{", block, flags=re.M))


def register_pose(name: str) -> None:
    """lib/haedori-actions.ts 의 HAEDORI_POSES 해당 줄에 image를 넣거나 갱신한다."""
    text = POSE_CATALOG.read_text(encoding="utf-8")
    pattern = re.compile(rf"^(\s{{2}}{name}: \{{)(.*?)\}},$", re.M)
    m = pattern.search(text)
    if not m:
        raise ValueError(f"lib/haedori-actions.ts 에서 '{name}' 자세 줄을 못 찾았어요")
    rest = re.sub(r'\s*image: "[^"]*",?', "", m.group(2)).strip().strip(",").strip()
    inner = f'image: "/images/haedori-poses/{name}.png"' + (f", {rest}" if rest else "")
    line = f"{m.group(1)} {inner} }},"
    POSE_CATALOG.write_text(text[: m.start()] + line + text[m.end():], encoding="utf-8")


def remove_background(im: Image.Image) -> Image.Image:
    """투명 배경이면 그대로, 아니면 가장자리 색과 이어진 영역을 지운다."""
    im = im.convert("RGBA")
    arr = np.asarray(im).astype(np.int16)
    alpha = arr[..., 3]

    # 이미 투명 배경이 충분히 있으면 그대로 쓴다
    if (alpha < 10).mean() > 0.05:
        return im

    h, w = alpha.shape
    rgb = arr[..., :3]
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    close = np.sqrt(((rgb - bg) ** 2).sum(-1)) <= BG_TOLERANCE

    # 가장자리에서 시작해 배경색과 이어진 픽셀만 지운다 (그림 안쪽 흰색은 유지)
    visited = np.zeros((h, w), bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if close[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if close[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and close[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    out = np.asarray(im).copy()
    out[visited, 3] = 0
    return Image.fromarray(out, "RGBA")


def trim(im: Image.Image) -> Image.Image:
    bbox = im.getchannel("A").point(lambda a: 255 if a > 12 else 0).getbbox()
    if not bbox:
        raise ValueError("그림이 비어 있어요 (배경만 남음)")
    l, t, r, b = bbox
    l, t = max(0, l - PADDING), max(0, t - PADDING)
    r, b = min(im.width, r + PADDING), min(im.height, b + PADDING)
    return im.crop((l, t, r, b))


def fit(im: Image.Image) -> Image.Image:
    scale = MAX_SIDE / max(im.size)
    if scale < 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    return im


def register(key: str, aspect: float) -> None:
    """lib/room-items.ts 의 해당 줄에 image, aspect를 넣거나 갱신한다."""
    text = CATALOG.read_text(encoding="utf-8")
    pattern = re.compile(rf'^(\s{{2}}{key}: \{{ key: "{key}",.*?)(, image: "[^"]*", aspect: [\d.]+)? \}},$', re.M)
    m = pattern.search(text)
    if not m:
        raise ValueError(f"lib/room-items.ts 에서 '{key}' 줄을 못 찾았어요")
    line = f'{m.group(1)}, image: "/room-items/{key}.png", aspect: {aspect:.3f} }},'
    CATALOG.write_text(text[: m.start()] + line + text[m.end():], encoding="utf-8")


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if not args:
        print(__doc__)
        sys.exit(1)

    src = Path(args[0])
    keys = known_keys()
    files = sorted(p for p in src.iterdir() if p.suffix.lower() in EXTS)
    if not files:
        print(f"{src} 에 그림 파일이 없어요")
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    poses = known_poses()
    for f in files:
        key = f.stem
        if key.startswith(POSE_PREFIX):
            pose = key[len(POSE_PREFIX):]
            if pose not in poses:
                print(f"[skip] {f.name}: 없는 자세예요 (가능: {', '.join(sorted(poses))})")
                continue
            try:
                im = fit(trim(remove_background(Image.open(f))))
            except Exception as e:  # noqa: BLE001
                print(f"[fail] {f.name}: {e}")
                continue
            if dry:
                print(f"[dry-run] pose {pose}: {im.width}x{im.height}")
                continue
            POSE_DIR.mkdir(parents=True, exist_ok=True)
            out = POSE_DIR / f"{pose}.png"
            im.save(out, optimize=True)
            register_pose(pose)
            print(f"[ok] pose {pose}: {out.relative_to(ROOT)} {im.width}x{im.height}")
            continue
        if key not in keys:
            print(f"[skip] {f.name}: lib/room-items.ts 에 없는 키예요 (가능: {', '.join(sorted(keys))})")
            continue
        try:
            im = fit(trim(remove_background(Image.open(f))))
        except Exception as e:  # noqa: BLE001
            print(f"[fail] {f.name}: {e}")
            continue
        aspect = im.height / im.width
        if dry:
            print(f"[dry-run] {key}: {im.width}x{im.height} (비율 {aspect:.2f})")
            continue
        out = OUT_DIR / f"{key}.png"
        im.save(out, optimize=True)
        register(key, aspect)
        print(f"[ok] {key}: {out.relative_to(ROOT)} {im.width}x{im.height}, {out.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
