#!/usr/bin/env python3
"""
Build web sky JPGs from Poly Haven puresky EXRs.

Usage:
  python3 scripts/build-skies.py <src_dir_with_named_exrs> <public/images/skyscapes> [names...]

Looks for <src>/<name>.exr for every name in SKIES (night, dawn, morning, day,
evening, dusk). Missing EXRs are SKIPPED, so you can rebuild just a few skies.
Optionally pass names to build only those, e.g.:  ... dawn morning day

Writes per sky:
  sky-<name>.jpg              4096x2048 (full, high tier)
  sky-<name>-medium.jpg       2048x1024 (medium/low tier)
  sky-<name>-placeholder.jpg   128x64   (instant load + lighting analysis)

Tonemapping: auto-exposure from the log-average luminance of the upper
hemisphere (sky only), scaled to a per-sky "key", then ACES filmic, then sRGB.
If a sky comes out too bright/dark, nudge its "ev" (+1 = 2x brighter) and re-run.
"""
import os
import sys
from pathlib import Path

os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"
import cv2  # noqa: E402
import numpy as np  # noqa: E402

SKIES = {
    "night":   {"key": 0.06, "ev": 0.0},
    "dawn":    {"key": 0.16, "ev": 0.0},
    "morning": {"key": 0.18, "ev": 0.0},
    "day":     {"key": 0.18, "ev": 0.0},
    "evening": {"key": 0.16, "ev": 0.0},
    "dusk":    {"key": 0.10, "ev": 0.0},
}

# (suffix, width, jpeg quality)
SIZES = [("", 4096, 92), ("-medium", 2048, 88), ("-placeholder", 128, 85)]


def aces(x: np.ndarray) -> np.ndarray:
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0)


def to_srgb(x: np.ndarray) -> np.ndarray:
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(x, 1.0 / 2.4) - 0.055)


def build(name: str, cfg: dict, path: Path, out: Path) -> None:
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"ERROR cannot read {path}")
        return
    img = np.maximum(img[:, :, :3].astype(np.float32), 0.0)  # BGR, linear
    h, w = img.shape[:2]
    if w != 2 * h:
        print(f"WARNING {name}: {w}x{h} is not 2:1 equirect")

    upper = img[: h // 2]
    lum = 0.0722 * upper[..., 0] + 0.7152 * upper[..., 1] + 0.2126 * upper[..., 2]
    log_avg = float(np.exp(np.mean(np.log(lum + 1e-4))))
    scale = cfg["key"] / max(log_avg, 1e-6) * (2.0 ** cfg["ev"])

    ldr = to_srgb(aces(img * scale))
    img8 = np.clip(ldr * 255.0 + 0.5, 0, 255).astype(np.uint8)

    for suffix, width, quality in SIZES:
        height = width // 2
        res = img8 if (width == w and height == h) else cv2.resize(
            img8, (width, height), interpolation=cv2.INTER_AREA
        )
        dst = out / f"sky-{name}{suffix}.jpg"
        cv2.imwrite(
            str(dst),
            res,
            [cv2.IMWRITE_JPEG_QUALITY, quality, cv2.IMWRITE_JPEG_PROGRESSIVE, 1],
        )
        kb = dst.stat().st_size // 1024
        print(f"{dst.name:32s} {width}x{height}  {kb} KB")
    print(f"  {name}: log-avg={log_avg:.4f} scale={scale:.3f}")


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src = Path(sys.argv[1]).expanduser()
    out = Path(sys.argv[2]).expanduser()
    only = set(sys.argv[3:])
    out.mkdir(parents=True, exist_ok=True)

    unknown = only - set(SKIES)
    if unknown:
        sys.exit(f"unknown sky names: {', '.join(sorted(unknown))}")

    built = 0
    for name, cfg in SKIES.items():
        if only and name not in only:
            continue
        path = src / f"{name}.exr"
        if not path.exists():
            print(f"skip {name} (no {path.name})")
            continue
        build(name, cfg, path, out)
        built += 1
    print(f"done: {built} sky/skies built")


if __name__ == "__main__":
    main()
