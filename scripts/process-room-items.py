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
BODY_IMAGE = ROOT / "public" / "images" / "haedori-body.png"
# 서 있는 자세: 키(높이)를 기본 해도리와 맞추는 기준으로 쓴다
STANDING_POSES = {"stand", "look", "read", "water"}
POSE_OUT_SCALE = 0.5  # 기본 해도리 캔버스(1024x1536)의 절반 크기로 저장

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
    # 그림이 생기면 임시로 쓰던 scale은 뺀다 (그림 자체가 자세 크기를 가짐)
    rest = re.sub(r'\s*(image: "[^"]*"|scale: [\d.]+),?', "", m.group(2)).strip().strip(",").strip()
    inner = f'image: "/images/haedori-poses/{name}.png"' + (f", {rest}" if rest else "")
    line = f"{m.group(1)} {inner} }},"
    POSE_CATALOG.write_text(text[: m.start()] + line + text[m.end():], encoding="utf-8")


def defringe(im: Image.Image) -> Image.Image:
    """AI 투명 배경 가장자리에 남는 붉은 테두리를 정리한다."""
    a = np.asarray(im.convert("RGBA")).copy()
    alpha = a[..., 3]
    a[alpha < 16, 3] = 0
    faint = (alpha >= 16) & (alpha < 60)
    a[faint, 0:3] = (140, 91, 62)  # 외곽선 갈색
    return Image.fromarray(a, "RGBA")


def body_layout() -> tuple[Image.Image, tuple[int, int, int, int]]:
    body = Image.open(BODY_IMAGE).convert("RGBA")
    return body, body.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()


def place_on_body_canvas(char: Image.Image, scale: float) -> Image.Image:
    """
    자세 그림을 기본 해도리 그림과 같은 캔버스·같은 키 기준으로 놓는다.
    앱에서 기본 그림과 똑같은 크기 상자에 그려도 해도리 크기와 발 위치가 맞는다.
    """
    body, (bl, bt, br, bb) = body_layout()
    s = POSE_OUT_SCALE
    canvas = Image.new("RGBA", (round(body.width * s), round(body.height * s)), (0, 0, 0, 0))
    char = char.resize((max(1, round(char.width * scale * s)), max(1, round(char.height * scale * s))), Image.LANCZOS)
    center_x = (bl + br) / 2 * s
    left = round(center_x - char.width / 2)
    left = min(max(0, left), canvas.width - char.width)  # 옆으로 긴 그림(눕기)도 안 잘리게
    top = round(bb * s) - char.height  # 발끝 = 기본 해도리 발끝
    canvas.alpha_composite(char, (left, max(0, top)))
    return canvas


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


def process_poses(pose_files: list[Path], poses: set[str], dry: bool) -> None:
    """
    자세 그림들을 한 번에 처리한다.
    서 있는 자세들의 키 높이 중간값을 기본 해도리 키와 맞추는 배율로 쓰고,
    같은 배율을 앉기·눕기에도 적용한다 (같은 대화에서 뽑은 그림은 캐릭터 크기가 거의 같음).
    """
    chars: dict[str, Image.Image] = {}
    for f in pose_files:
        pose = f.stem[len(POSE_PREFIX):]
        if pose not in poses:
            print(f"[skip] {f.name}: 없는 자세예요 (가능: {', '.join(sorted(poses))})")
            continue
        try:
            chars[pose] = trim(defringe(remove_background(Image.open(f))))
        except Exception as e:  # noqa: BLE001
            print(f"[fail] {f.name}: {e}")
    if not chars:
        return

    _, (_, bt, _, bb) = body_layout()
    body_h = bb - bt
    standing = sorted(im.height for p, im in chars.items() if p in STANDING_POSES)
    if standing:
        ref_h = standing[len(standing) // 2]
    else:
        # 서 있는 자세가 없으면 앉기 그림 키를 서 있는 키의 85%로 본다
        ref_h = max(im.height for im in chars.values()) / 0.85
    scale = body_h / ref_h
    print(f"[pose] 배율 {scale:.3f} (기본 해도리 키 {body_h}px / 서 있는 자세 키 {ref_h}px)")

    for pose, char in chars.items():
        out_im = place_on_body_canvas(char, scale)
        if dry:
            print(f"[dry-run] pose {pose}: 캔버스 {out_im.width}x{out_im.height}")
            continue
        POSE_DIR.mkdir(parents=True, exist_ok=True)
        out = POSE_DIR / f"{pose}.png"
        out_im.save(out, optimize=True)
        register_pose(pose)
        print(f"[ok] pose {pose}: {out.relative_to(ROOT)} {out.stat().st_size // 1024}KB")


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
    pose_files = [f for f in files if f.stem.startswith(POSE_PREFIX)]
    files = [f for f in files if not f.stem.startswith(POSE_PREFIX)]
    if pose_files:
        process_poses(pose_files, poses, dry)

    for f in files:
        key = f.stem
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
