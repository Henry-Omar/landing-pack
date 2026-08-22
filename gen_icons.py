#!/usr/bin/env python3
"""Generate Landing Pack app-icon PNGs (1024/512/192/144/96/48), pure stdlib.
Icon = open parcel/box (isometric) + landing-down arrow + shadow. Dark techno tile.
Matches landingpack-icon.svg geometry.
"""
import struct, zlib, os, math

HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, "icon-set")
os.makedirs(OUTDIR, exist_ok=True)
TOP = (0x13, 0x1a, 0x2e); BOT = (0x2b, 0x58, 0x76)
ACC = (0x16, 0xe0, 0xbd, 255)

def lerp(a, b, t): return int(a + (b - a) * t)

def render(S):
    buf = bytearray(S * S * 4)
    k = S / 1024.0
    def P(x, y): return (x * k, y * k)
    x0, y0, x1, y1 = int(round(32*k)), int(round(32*k)), int(round(992*k)), int(round(992*k))
    rx = ry = int(round(232*k))

    def in_tile(px, py):
        if px < x0 or px > x1 or py < y0 or py > y1: return False
        cx = x0 + rx if px < x0 + rx else (x1 - rx if px > x1 - rx else None)
        cy = y0 + ry if py < y0 + ry else (y1 - ry if py > y1 - ry else None)
        if cx is None or cy is None: return True
        return (px - cx) ** 2 + (py - cy) ** 2 <= rx * ry

    def setpx(px, py, r, g, b, a):
        if 0 <= px < S and 0 <= py < S:
            i = (py * S + px) * 4; buf[i]=r; buf[i+1]=g; buf[i+2]=b; buf[i+3]=a

    def fill_circle(cx, cy, r, col):
        for yy in range(int(cy-r)-1, int(cy+r)+2):
            for xx in range(int(cx-r)-1, int(cx+r)+2):
                if (xx-cx)**2 + (yy-cy)**2 <= r*r: setpx(xx, yy, *col)

    def fill_poly(pts, col, outline=None):
        # fill
        ys=[p[1] for p in pts]; ymin,ymax=int(min(ys)),int(max(ys)); n=len(pts)
        for yy in range(ymin, ymax+1):
            xs=[]
            for i in range(n):
                x1,y1=pts[i]; x2,y2=pts[(i+1)%n]
                if (y1<=yy<y2) or (y2<=yy<y1): xs.append(x1+(yy-y1)/(y2-y1)*(x2-x1))
            xs.sort()
            for j in range(0,len(xs)-1,2):
                for xx in range(int(xs[j]), int(xs[j+1])+1): setpx(xx, yy, *col)
        # outline (slightly thicker for visibility)
        if outline:
            for i in range(n):
                x1,y1=pts[i]; x2,y2=pts[(i+1)%n]
                steps=int(max(abs(x2-x1),abs(y2-y1)))+1
                for s in range(steps+1):
                    xx=x1+(x2-x1)*s/steps; yy=y1+(y2-y1)*s/steps
                    for dx in (-1,0,1):
                        for dy in (-1,0,1):
                            setpx(int(round(xx))+dx, int(round(yy))+dy, *outline)

    def stroke_line(a, b, col, w=2):
        steps=int(max(abs(b[0]-a[0]),abs(b[1]-a[1])))+1
        for s in range(steps+1):
            xx=a[0]+(b[0]-a[0])*s/steps; yy=a[1]+(b[1]-a[1])*s/steps
            for dx in range(-w,w+1):
                for dy in range(-w,w+1):
                    setpx(int(round(xx))+dx, int(round(yy))+dy, *col)

    # tile gradient
    for py in range(S):
        t=py/(S-1); r=lerp(TOP[0],BOT[0],t); g=lerp(TOP[1],BOT[1],t); b=lerp(TOP[2],BOT[2],t)
        for px in range(S):
            if in_tile(px,py): setpx(px,py,r,g,b,255)

    # landing shadow
    fill_circle(*P(512,716), 150*k, (ACC[0],ACC[1],ACC[2],int(0.35*255)))

    # landing arrow (down) - accent
    ax,ay=P(492,250); bx,by=P(532,250); cx,cy=P(532,370); dx,dy=P(492,370)
    fill_poly([(int(ax),int(ay)),(int(bx),int(by)),(int(cx),int(cy)),(int(dx),int(dy))], ACC)
    # arrow head (triangle)
    fill_poly([(int(P(452,372)[0]),int(P(452,372)[1])),(int(P(572,372)[0]),int(P(572,372)[1])),(int(P(540,330)[0]),int(P(540,330)[1])),(int(P(484,330)[0]),int(P(484,330)[1]))], ACC)
    stroke_line(P(452,372),P(512,440),ACC,max(2,int(8*k)))
    stroke_line(P(572,372),P(512,440),ACC,max(2,int(8*k)))
    stroke_line(P(540,330),P(512,440),ACC,max(2,int(8*k)))
    stroke_line(P(484,330),P(512,440),ACC,max(2,int(8*k)))

    # parcel box (isometric)
    L=P(408,470); T=P(512,400); R=P(616,470); Bm=P(512,540); Lb=P(408,630); Rb=P(616,630); Bb=P(512,700)
    fill_poly([(int(L[0]),int(L[1])),(int(Bm[0]),int(Bm[1])),(int(Lb[0]),int(Lb[1]))], (0xdf,0xe7,0xf0,255))   # left face
    fill_poly([(int(R[0]),int(R[1])),(int(Bm[0]),int(Bm[1])),(int(Rb[0]),int(Rb[1]))], (0xff,0xff,0xff,255))   # right face
    fill_poly([(int(T[0]),int(T[1])),(int(R[0]),int(R[1])),(int(Bm[0]),int(Bm[1])),(int(L[0]),int(L[1]))], (0xf5,0xf8,0xfc,255))  # top
    # accent edges
    for seg in [(L,Bm),(Bm,R),(Bm,Bb),(L,Lb),(Lb,Bb),(R,Rb),(Rb,Bb),(T,L),(T,R)]:
        stroke_line(seg[0], seg[1], ACC, max(2,int(7*k)))

    # png encode
    raw=bytearray()
    for py in range(S):
        raw.append(0)
        for px in range(S):
            i=(py*S+px)*4; raw+=bytes((buf[i],buf[i+1],buf[i+2],buf[i+3]))
    comp=zlib.compress(bytes(raw),9)
    def chunk(typ,data): return struct.pack(">I",len(data))+typ+data+struct.pack(">I",zlib.crc32(typ+data)&0xffffffff)
    png=b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack(">IIBBBBB",S,S,8,6,0,0,0))+chunk(b"IDAT",comp)+chunk(b"IEND",b"")
    with open(os.path.join(OUTDIR,f"icon-{S}.png"),"wb") as f: f.write(png)

if __name__=="__main__":
    for s in (1024,512,192,144,96,48):
        render(s); print("wrote icon-%d.png"%s)
