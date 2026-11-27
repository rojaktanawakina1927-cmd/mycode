#!/usr/bin/env python3
"""Low-memory preview renderer for the seat-belt animatic.

Draws 540x960 RGB frames with Pillow and streams them to ffmpeg; ffmpeg
upscales to 1080x1920 and muxes the original voice-over.

Examples:
    .venv/bin/python seatbelt/tools/render_preview.py --still 900
    .venv/bin/python seatbelt/tools/render_preview.py --out out/seatbelt-preview-v2.mp4
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import time
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parent
PLAN_PATH = BASE / "shot_plan.json"
AUDIO_PATH = BASE / "voice.wav"
OUT_DIR = ROOT / "remotion" / "out"

W, H = 540, 960
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

COL_BG = (5, 8, 15)
COL_GRID = (24, 48, 65)
COL_INK = (230, 247, 255)
COL_DIM = (110, 132, 155)
COL_CYAN = (82, 229, 255)
COL_BONE = (255, 212, 154)
COL_RED = (255, 90, 95)
COL_SKIN = (125, 139, 157)
COL_SKIN_LIGHT = (148, 164, 183)
COL_SKIN_DARK = (59, 75, 94)
COL_SEAT = (23, 34, 53)

LABELS = [
    ("PELVIS", 30.3, 31.0, (238, 585), (270, 580)),
    ("RIBS", 31.0, 31.6, (310, 470), (270, 455)),
    ("SHOULDER", 31.6, 32.2, (365, 390), (325, 390)),
    ("HIP BONE", 45.6, 46.2, (235, 615), (270, 600)),
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_PATH.replace("DejaVuSans.ttf", "DejaVuSans-Bold.ttf") if bold else FONT_PATH
    return ImageFont.truetype(path, size)


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def ease(t: float) -> float:
    t = clamp(t)
    return t * t * (3 - 2 * t)


def make_background() -> Image.Image:
    img = Image.new("RGB", (W, H), COL_BG)
    px = img.load()
    for y in range(H):
        t = y / H
        r = int(lerp(13, 2, t))
        g = int(lerp(27, 4, t))
        b = int(lerp(43, 10, t))
        for x in range(W):
            px[x, y] = (r, g, b)

    draw = ImageDraw.Draw(img)
    for x in range(0, W, 40):
        draw.line((x, 0, x, H), fill=COL_GRID, width=1)
    for y in range(0, H, 40):
        draw.line((0, y, W, y), fill=COL_GRID, width=1)

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for radius in range(270, 20, -18):
        alpha = int(18 * (1 - radius / 300))
        if alpha > 0:
            gd.ellipse((270 - radius, 430 - radius, 270 + radius, 430 + radius), fill=(20, 60, 86, alpha))
    return Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")


BASE_IMG = make_background()


def draw_text(draw: ImageDraw.ImageDraw, xy: tuple[float, float], text: str, size: int, fill=COL_INK) -> None:
    f = font(size, bold=True)
    x, y = xy
    draw.text((x + 1, y + 1), text, font=f, fill=(0, 0, 0))
    draw.text((x, y), text, font=f, fill=fill)


def draw_label(draw: ImageDraw.ImageDraw, text: str, xy: tuple[float, float], target: tuple[float, float]) -> None:
    x, y = xy
    tx, ty = target
    draw.line((x + 8, y + 10, tx, ty), fill=COL_CYAN, width=1)
    draw.ellipse((x, y + 5, x + 7, y + 12), fill=COL_CYAN)
    draw_text(draw, (x + 13, y - 2), text, 12)


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[float, float], end: tuple[float, float]) -> None:
    x1, y1 = start
    x2, y2 = end
    draw.line((x1, y1, x2, y2), fill=COL_CYAN, width=2)
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 8
    for delta in (-0.45, 0.45):
        xa = x2 - length * math.cos(angle + delta)
        ya = y2 - length * math.sin(angle + delta)
        draw.line((x2, y2, xa, ya), fill=COL_CYAN, width=2)


def draw_particles(draw: ImageDraw.ImageDraw, frame: int) -> None:
    for i in range(16):
        x = (i * 97 + frame * 0.55) % W
        y = (i * 61 + math.sin(frame * 0.035 + i) * 22) % H
        r = 1 if i % 3 else 2
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(24, 64, 82))


def draw_mannequin(
    draw: ImageDraw.ImageDraw,
    cx: float = 270,
    cy: float = 470,
    scale: float = 1.0,
    lean: float = 0.0,
    glow: float = 0.8,
    bones: bool = False,
    arrows: bool = False,
    phase: float = 0.0,
) -> None:
    def p(x: float, y: float) -> tuple[float, float]:
        return (cx + x * scale, cy + y * scale)

    def box(x1: float, y1: float, x2: float, y2: float) -> tuple[float, float, float, float]:
        return (cx + x1 * scale, cy + y1 * scale, cx + x2 * scale, cy + y2 * scale)

    bob = math.sin(phase) * 2.0 * scale
    sway = math.sin(phase * 0.8 + 1.2) * 2.0 * scale
    shift = math.sin(math.radians(lean)) * 34 * scale

    shadow_w = 86 * scale
    draw.ellipse((cx - shadow_w, cy + 252 * scale, cx + shadow_w, cy + 282 * scale), fill=(5, 11, 17))

    head = (cx + shift + sway * 0.5, cy - 130 * scale + bob)
    draw.ellipse(
        (head[0] - 38 * scale, head[1] - 48 * scale, head[0] + 38 * scale, head[1] + 48 * scale),
        fill=COL_SKIN,
    )
    draw.ellipse(
        (head[0] - 25 * scale, head[1] - 32 * scale, head[0] + 9 * scale, head[1] + 5 * scale),
        fill=COL_SKIN_LIGHT,
    )
    torso_top = cy - 92 * scale + bob * 0.5
    torso_bottom = cy + 72 * scale + bob * 0.2
    draw.rounded_rectangle(
        (cx - 62 * scale + shift, torso_top, cx + 62 * scale + shift, torso_bottom),
        radius=32 * scale,
        fill=COL_SKIN,
    )
    draw.rounded_rectangle(
        (cx - 42 * scale + shift, torso_top + 16 * scale, cx + 18 * scale + shift, torso_bottom - 18 * scale),
        radius=20 * scale,
        fill=COL_SKIN_LIGHT,
    )
    draw.ellipse(box(-70, 45, 70, 112), fill=COL_SKIN)

    arm_sway = math.sin(phase * 0.9 + 0.4) * 2.3 * scale
    draw.line((p(-55, -62), p(-118 + arm_sway, 35)), fill=COL_SKIN_DARK, width=max(2, int(17 * scale)))
    draw.line((p(55, -62), p(118 - arm_sway, 35)), fill=COL_SKIN_DARK, width=max(2, int(17 * scale)))
    draw.line((p(-25, 96), p(-48, 250)), fill=COL_SKIN_DARK, width=max(2, int(21 * scale)))
    draw.line((p(25, 96), p(48, 250)), fill=COL_SKIN_DARK, width=max(2, int(21 * scale)))
    draw.ellipse(box(-70, 238, -24, 266), fill=COL_SKIN_DARK)
    draw.ellipse(box(24, 238, 70, 266), fill=COL_SKIN_DARK)

    belt_start = p(-58, -70)
    belt_end = p(62, 62)
    draw.line((*belt_start, *belt_end), fill=(20, 40, 55), width=max(3, int(9 * scale)))
    draw.line((*belt_start, *belt_end), fill=COL_CYAN, width=max(1, int((3 + glow) * scale)))

    draw.rounded_rectangle(box(-72, 55, 72, 82), radius=max(3, int(14 * scale)), fill=(24, 45, 60))
    draw.rounded_rectangle(box(-72, 55, 72, 82), radius=max(3, int(14 * scale)), outline=COL_CYAN, width=max(1, int((2 + glow * 0.6) * scale)))
    draw.rounded_rectangle(box(48, 58, 75, 79), radius=3, fill=COL_CYAN)

    if bones:
        pulse = 1 + 0.18 * math.sin(phase * 1.7)
        for bx, by in [(-0, 72), (0, -8), (55, -62)]:
            x, y = p(bx, by)
            r = 5 * scale * pulse
            draw.ellipse((x - r, y - r, x + r, y + r), fill=COL_BONE)

    if arrows:
        pulse = 3 * math.sin(phase * 1.3)
        draw_arrow(draw, (80, 600), (cx - 20 - pulse, 580))
        draw_arrow(draw, (460, 455), (cx + 28 + pulse, 455))
        draw_arrow(draw, (420, 390), (cx + 60 - pulse, 390))


def draw_car_side(draw: ImageDraw.ImageDraw, progress: float, phase: float) -> None:
    shift = lerp(35, -25, ease(progress))
    shake = math.sin(phase * 9) * max(0, 1 - progress * 3) * 5
    bounce = abs(math.sin(progress * 15)) * max(0, 1 - progress * 2) * 3
    dx, dy = shift, shake + bounce

    draw.rounded_rectangle((30 + dx, 360 + dy, 90 + dx, 600 + dy), radius=8, fill=(32, 56, 74))
    draw.rounded_rectangle((110 + dx, 430 + dy, 450 + dx, 610 + dy), radius=30, fill=(13, 23, 37), outline=(46, 75, 94), width=2)
    draw.polygon(
        [(145 + dx, 438 + dy), (190 + dx, 360 + dy), (355 + dx, 360 + dy), (410 + dx, 438 + dy)],
        fill=(16, 30, 44),
        outline=(46, 75, 94),
    )
    draw.rounded_rectangle((205 + dx, 375 + dy, 330 + dx, 430 + dy), radius=12, fill=(25, 49, 67))
    for wx in (175, 385):
        cx, cy = wx + dx, 619 + dy
        draw.ellipse((cx - 34, cy - 34, cx + 34, cy + 34), fill=(8, 16, 25), outline=(46, 75, 94), width=3)
        for k in range(4):
            a = phase * 0.5 + k * math.pi / 2
            draw.line((cx, cy, cx + 22 * math.cos(a), cy + 22 * math.sin(a)), fill=(25, 50, 67), width=2)
    draw_mannequin(draw, cx=270 + dx, cy=520 + dy, scale=0.42, lean=8, glow=1.0, phase=phase)

    for i in range(4):
        x = 430 + dx - ((phase * 18 + i * 18) % 70)
        y = 455 + i * 25 + dy
        draw.line((x, y, x + 55, y), fill=COL_CYAN, width=1)

    for i in range(5):
        px = 105 + i * 18 + dx
        py = 600 + math.sin(phase + i) * 8
        draw.ellipse((px, py, px + 4, py + 4), fill=(38, 66, 82))


def draw_macro(draw: ImageDraw.ImageDraw, progress: float, phase: float) -> None:
    width = 44 + 3 * math.sin(phase * 2)
    draw.line((95, 475, 440, 605), fill=(26, 48, 64), width=int(width))
    draw.line((95, 475, 440, 605), fill=COL_CYAN, width=9 + int(2 * math.sin(phase * 1.5)))
    draw.ellipse((385, 545, 465, 625), fill=(10, 23, 34), outline=COL_CYAN, width=4)
    draw.ellipse((410, 570, 440, 600), fill=(24, 48, 64), outline=COL_CYAN, width=2)
    for k in range(5):
        a = phase * 0.7 + k * 2 * math.pi / 5
        draw.line((425, 585, 425 + 13 * math.cos(a), 585 + 13 * math.sin(a)), fill=(40, 80, 100), width=2)

    pts = []
    count = max(2, int(progress * 20) + 1)
    for i in range(count):
        t = i / 20
        x = lerp(100, 460, t)
        y = 690 - 55 * math.sin(t * math.pi) - 20 * progress
        pts.append((x, y))
    if len(pts) > 1:
        draw.line(pts, fill=COL_CYAN, width=2)
    if pts:
        x, y = pts[-1]
        draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=COL_CYAN)
    draw.ellipse((96, 686, 104, 694), fill=COL_CYAN)


def draw_ball(draw: ImageDraw.ImageDraw, progress: float, phase: float) -> None:
    catch = ease(clamp((progress - 0.1) / 0.42))
    pull = ease(clamp((progress - 0.62) / 0.38))
    bx = lerp(145, 355, catch)
    hx = 405 + 20 * pull
    impact = math.sin(catch * math.pi)
    bw = 43 * (1 + 0.12 * impact)
    bh = 43 * (1 - 0.10 * impact)
    by = 548 - 4 * impact

    for i in range(4):
        tx = bx - 22 - i * 16
        ty = by + 10 + math.sin(phase + i) * 5
        draw.ellipse((tx - 2, ty - 2, tx + 2, ty + 2), fill=(255, 190, 110))

    draw.ellipse((bx - bw, by - bh, bx + bw, by + bh), fill=(255, 159, 67))
    draw.ellipse((bx - 24, by - 30, bx - 3, by - 9), fill=(255, 210, 154))

    hand_y = 548 + 5 * math.sin(phase + 0.5)
    draw.ellipse((hx - 55, hand_y - 35, hx + 55, hand_y + 35), fill=(169, 183, 198))
    for i in range(3):
        y = hand_y - 20 + i * 20
        draw.line((hx + 25, y, hx + 105, y - 8 + i * 8), fill=(169, 183, 198), width=11)
    draw.line((bx + 52, by, hx - 62, hand_y), fill=COL_CYAN, width=1)

    force = lerp(0.9, 0.3, ease(clamp((progress - 0.5) / 0.5)))
    draw_text(draw, (390, 740), "PEAK FORCE", 9, COL_DIM)
    draw.rounded_rectangle((390, 758, 510, 766), radius=4, fill=(35, 55, 68))
    draw.rounded_rectangle((390, 758, 390 + 120 * force, 766), radius=4, fill=COL_CYAN)


def draw_fit(draw: ImageDraw.ImageDraw, progress: float, phase: float) -> None:
    if progress <= 0.5:
        slide = ease(progress / 0.5)
        draw_mannequin(draw, cx=270 - (1 - slide) * 38, cy=470, scale=1.0, glow=1.0, bones=True, phase=phase)
        x_alpha = 0.6 + 0.4 * math.sin(phase * 2)
        draw.ellipse((178, 558, 208, 588), outline=COL_RED, width=4)
        draw.line((184, 564, 202, 582), fill=COL_RED, width=4)
        draw.line((202, 564, 184, 582), fill=COL_RED, width=4)
    else:
        slide = ease((progress - 0.5) / 0.5)
        draw_mannequin(draw, cx=175 - (1 - slide) * 30, cy=470, scale=0.72, glow=1.0, bones=True, phase=phase)
        draw_mannequin(draw, cx=375 + (1 - slide) * 30, cy=470, scale=0.72, glow=0.8, phase=phase + 0.8)
        draw.ellipse((315, 540, 345, 570), outline=COL_RED, width=4)
        draw.line((321, 546, 339, 564), fill=COL_RED, width=4)
        draw.line((339, 546, 321, 564), fill=COL_RED, width=4)


def draw_scene(draw: ImageDraw.ImageDraw, shot: int, progress: float, frame: int) -> None:
    phase = frame * 0.12
    if shot == 2:
        draw_car_side(draw, progress, phase)
    elif shot == 5:
        draw_macro(draw, progress, phase)
    elif shot == 7:
        draw_ball(draw, progress, phase)
    elif shot == 8:
        draw_fit(draw, progress, phase)
    elif shot == 4:
        draw.rounded_rectangle((130, 330, 420, 650), radius=35, fill=(13, 23, 37), outline=(46, 75, 94), width=2)
        draw_mannequin(draw, cx=270, cy=500, scale=0.55, glow=0.9, phase=phase)
        for i in range(5):
            x = 330 + i * 14 + 5 * math.sin(phase + i)
            y = 420 - i * 12
            draw.ellipse((x, y, x + 6, y + 6), fill=COL_CYAN)
    else:
        lean = math.sin(progress * math.pi) * 16 if shot == 3 else 0
        if shot == 3:
            lean += math.exp(-progress * 7) * math.sin(phase * 5) * 5
        glow = 0.75 + 0.25 * math.sin(phase * 0.8)
        draw_mannequin(draw, lean=lean, glow=glow, bones=shot == 6, arrows=shot == 6, phase=phase)
        if shot == 1:
            scan_x = 210 + (frame * 1.7) % 150
            draw.rounded_rectangle((210, 505, 360, 511), radius=3, fill=COL_CYAN)
            draw.ellipse((scan_x - 8, 497, scan_x + 8, 513), fill=COL_CYAN)
        if shot == 6:
            for k in range(3):
                angle = phase * 0.4 + k * 2 * math.pi / 3
                x = 270 + 95 * math.cos(angle)
                y = 470 + 95 * math.sin(angle)
                draw.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(30, 90, 110))
        if shot == 9:
            draw.rounded_rectangle((150, 560, 410, 596), radius=18, fill=(24, 45, 60), outline=COL_CYAN, width=4)
            draw.rounded_rectangle((355, 565, 395, 590), radius=5, fill=COL_CYAN)


def draw_overlay(draw: ImageDraw.ImageDraw, frame: int, fps: int, shot: int, progress: float) -> None:
    time_s = frame / fps
    pulse = 1 + 0.08 * math.sin(frame * 0.3)
    for text, start, end, xy, target in LABELS:
        if start <= time_s <= end:
            x, y = xy
            draw_label(draw, text, (x, y - (pulse - 1) * 8), target)


def apply_camera(img: Image.Image, shot: int, progress: float, frame: int) -> Image.Image:
    if shot == 1:
        zoom = 1.01 + 0.04 * ease(progress)
        pan_x, pan_y = 0.0, -0.01 * progress
    elif shot == 2:
        zoom = 1.03
        pan_x = lerp(-0.06, 0.06, ease(progress)) + 0.008 * math.sin(frame * 0.9)
        pan_y = 0.01 * math.sin(frame * 0.7)
    elif shot == 3:
        zoom = 1.03 + 0.03 * ease(progress)
        pan_x = 0.015 * math.sin(progress * math.pi)
        pan_y = 0.01 + math.exp(-progress * 5) * 0.015 * math.sin(frame * 1.2)
    elif shot == 4:
        zoom = 1.03
        pan_x = 0.035 * math.sin(progress * math.pi)
        pan_y = 0.0
    elif shot == 5:
        zoom = 1.08 + 0.04 * ease(progress)
        pan_x = lerp(-0.03, 0.03, ease(progress))
        pan_y = 0.008
    elif shot == 6:
        zoom = 1.02 + 0.04 * ease(progress)
        pan_x = lerp(-0.03, 0.03, ease(progress))
        pan_y = 0.01
    elif shot == 7:
        zoom = 1.0 + 0.05 * ease(progress)
        pan_x, pan_y = 0.0, 0.0
    elif shot == 8:
        zoom = 1.05 if progress > 0.5 else 1.02
        pan_x = 0.04 if progress > 0.5 else 0.0
        pan_y = 0.0
    else:
        zoom = 1.06 - 0.06 * ease(progress)
        pan_x, pan_y = 0.0, 0.0

    nw, nh = int(W * zoom), int(H * zoom)
    if nw <= W or nh <= H:
        return img
    scaled = img.resize((nw, nh), Image.Resampling.BILINEAR)
    left = int(clamp((nw - W) / 2 + pan_x * W, 0, nw - W))
    top = int(clamp((nh - H) / 2 + pan_y * H, 0, nh - H))
    return scaled.crop((left, top, left + W, top + H))


def find_shot(shots: list[dict], frame: int) -> dict:
    for shot in shots:
        if shot["start"] <= frame < shot["end"]:
            return shot
    return shots[-1]


def render_frame(frame: int, shots: list[dict]) -> Image.Image:
    shot = find_shot(shots, frame)
    progress = clamp((frame - shot["start"]) / max(1, shot["end"] - shot["start"]))
    img = BASE_IMG.copy()
    draw = ImageDraw.Draw(img)
    draw_particles(draw, frame)
    draw_scene(draw, shot["id"], progress, frame)
    img = apply_camera(img, shot["id"], progress, frame)

    if shot["id"] == 3 and progress < 0.08:
        flash = Image.new("RGB", (W, H), (170, 235, 255))
        img = Image.blend(img, flash, 0.12 * (1 - progress / 0.08))

    draw = ImageDraw.Draw(img)
    draw_overlay(draw, frame, 30, shot["id"], progress)
    return img


def render_still(frame: int, out: Path) -> None:
    shots = json.loads(PLAN_PATH.read_text())["shots"]
    img = render_frame(frame, shots)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    print(out)


def render_video(out: Path, limit: int | None = None) -> None:
    plan = json.loads(PLAN_PATH.read_text())
    shots = plan["shots"]
    total = plan["duration_frames"] if limit is None else min(limit, plan["duration_frames"])
    out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    log = out.with_suffix(".ffmpeg.log")
    cmd = [
        ffmpeg, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
        "-i", str(AUDIO_PATH),
        "-map", "0:v:0", "-map", "1:a:0",
        "-vf", "scale=1080:1920:flags=lanczos",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-shortest", "-t", f"{total / 30:.3f}",
        "-movflags", "+faststart",
        str(out),
    ]
    print("output:", out)
    print("frames:", total)
    with log.open("wb") as err:
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=err)
        assert proc.stdin is not None
        started = time.time()
        try:
            for frame in range(total):
                img = render_frame(frame, shots)
                proc.stdin.write(img.tobytes())
                if frame % 120 == 0:
                    elapsed = time.time() - started
                    print(f"frame {frame}/{total}  {elapsed:.1f}s", flush=True)
        finally:
            proc.stdin.close()
            code = proc.wait()
        print(f"ffmpeg exit={code} log={log}")
        if code != 0:
            raise SystemExit(code)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--still", type=int, default=None)
    parser.add_argument("--out", type=Path, default=OUT_DIR / "seatbelt-preview.mp4")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()
    if args.still is not None:
        render_still(args.still, args.out.with_suffix(".png"))
    else:
        render_video(args.out, args.limit)


if __name__ == "__main__":
    main()
