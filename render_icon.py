#!/usr/bin/env python3
"""Render landingpack-icon.svg -> landingpack-icon.png at 1024x1024.
Tries cairosvg first (pixel-perfect), falls back to Pillow raster of the same geometry."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SVG = os.path.join(HERE, "landingpack-icon.svg")
OUT = os.path.join(HERE, "landingpack-icon.png")

def render_cairo():
    import cairosvg
    cairosvg.svg2png(url=SVG, write_to=OUT, output_width=1024, output_height=1024)
    return True

def render_pil():
    from PIL import Image, ImageDraw
    S = 1024
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    top = (0x13, 0x1a, 0x2e)
    bot = (0x2b, 0x58, 0x76)
    # vertical gradient tile
    for y in range(S):
        t = y / (S - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        d.line([(0, y), (S, y)], fill=(r, g, b, 255))
    # rounded-rect mask: keep only inside tile (32..992, rx 232)
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([32, 32, 992, 992], radius=232, fill=255)
    # accent dots (descending trail)
    accent = (0x16, 0xe0, 0xbd, 255)
    for (cx, cy, r) in [(372, 612, 13), (430, 690, 10), (486, 760, 8), (534, 822, 5)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=accent)
    # paper plane (white dart) computed from the SVG transform
    plane = [(432, 428), (621, 436), (528, 478), (545, 579)]
    d.polygon(plane, fill=(255, 255, 255, 255))
    # apply tile mask (cut corners to transparent)
    img.putalpha(mask)
    img.save(OUT, "PNG")
    return True

if __name__ == "__main__":
    try:
        render_cairo()
        print("RENDERED cairosvg ->", OUT)
    except Exception as e1:
        try:
            render_pil()
            print("RENDERED pillow ->", OUT, "(fallback)")
        except Exception as e2:
            print("BOTH_FAILED", repr(e1), repr(e2))
            raise SystemExit(1)
