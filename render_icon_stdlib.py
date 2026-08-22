#!/usr/bin/env python3
"""Pure-stdlib 1024x1024 PNG renderer for the Landing Pack icon.
No PIL/cairo needed. Draws: gradient tile (rounded), accent trail dots, white paper plane.
Matches landingpack-icon.svg geometry.
"""
import struct, zlib, os

S = 1024

def lerp(a, b, t): return int(a + (b - a) * t)

def main():
    # pixel buffer RGBA
    buf = bytearray(S * S * 4)
    top = (0x13, 0x1a, 0x2e)
    bot = (0x2b, 0x58, 0x76)

    # rounded-rect mask (tile) params
    x0, y0, x1, y1 = 32, 32, 992, 992
    rx = ry = 232

    def in_tile(px, py):
        # outside bounding box -> no
        if px < x0 or px > x1 or py < y0 or py > y1:
            return False
        # corner regions
        cx = x0 + rx if px < x0 + rx else (x1 - rx if px > x1 - rx else None)
        cy = y0 + ry if py < y0 + ry else (y1 - ry if py > y1 - ry else None)
        if cx is None or cy is None:
            return True
        return (px - cx) ** 2 + (py - cy) ** 2 <= rx * ry

    def setpx(px, py, r, g, b, a):
        if px < 0 or py < 0 or px >= S or py >= S:
            return
        i = (py * S + px) * 4
        buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a

    def fill_circle(cx, cy, r, col):
        for yy in range(int(cy - r) - 1, int(cy + r) + 2):
            for xx in range(int(cx - r) - 1, int(cx + r) + 2):
                if (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r:
                    setpx(xx, yy, *col)

    def fill_poly(pts, col):
        # simple scanline fill of convex polygon
        ys = [p[1] for p in pts]
        ymin, ymax = int(min(ys)), int(max(ys))
        n = len(pts)
        for yy in range(ymin, ymax + 1):
            xs = []
            for i in range(n):
                x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
                if (y1 <= yy < y2) or (y2 <= yy < y1):
                    x = x1 + (yy - y1) / (y2 - y1) * (x2 - x1)
                    xs.append(x)
            xs.sort()
            for k in range(0, len(xs) - 1, 2):
                for xx in range(int(xs[k]), int(xs[k+1]) + 1):
                    setpx(xx, yy, *col)

    # 1. gradient background, clipped to tile
    for py in range(S):
        t = py / (S - 1)
        r = lerp(top[0], bot[0], t); g = lerp(top[1], bot[1], t); b = lerp(top[2], bot[2], t)
        for px in range(S):
            if in_tile(px, py):
                setpx(px, py, r, g, b, 255)

    # 2. accent trail dots (mint)
    accent = (0x16, 0xe0, 0xbd, 255)
    for (cx, cy, r) in [(372, 612, 13), (430, 690, 10), (486, 760, 8), (534, 822, 5)]:
        fill_circle(cx, cy, r, accent)

    # 3. white paper plane (from SVG transform: translate(512 470) rotate(28) scale(9) translate(-12 -12))
    import math
    ang = math.radians(28); ca, sa = math.cos(ang), math.sin(ang)
    def tf(ox, oy):
        # translate(-12,-12) then scale(9) then rotate(28) then translate(512,470)
        x = (ox - 12) * 9; y = (oy - 12) * 9
        xr = x * ca - y * sa; yr = x * sa + y * ca
        return xr + 512, yr + 470
    pts = [tf(2, 12), tf(21, 3), tf(14, 12), tf(21, 21)]
    fill_poly([(int(round(x)), int(round(y))) for x, y in pts], (255, 255, 255, 255))

    # encode PNG
    raw = bytearray()
    for py in range(S):
        raw.append(0)  # filter type 0
        for px in range(S):
            i = (py * S + px) * 4
            raw += bytes((buf[i], buf[i+1], buf[i+2], buf[i+3]))
    comp = zlib.compress(bytes(raw), 9)

    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        c += struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff)
        return c

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", S, S, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", comp)
    png += chunk(b"IEND", b"")

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "landingpack-icon.png")
    with open(out, "wb") as f:
        f.write(png)
    print("WROTE", out, len(png), "bytes")

if __name__ == "__main__":
    main()
