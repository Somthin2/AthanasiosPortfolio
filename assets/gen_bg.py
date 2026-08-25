#!/usr/bin/env python3
"""Generate P5R-quality background art — v2 (bolder, more dramatic)."""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, math, os, random

W, H   = 2560, 1440
OUT    = os.path.dirname(os.path.abspath(__file__)) + "/menus"
BLACK  = np.array([11, 11, 13],  dtype=np.float32)
RED    = np.array([230, 0, 18],  dtype=np.float32)
DRED   = np.array([90,  0,  7],  dtype=np.float32)
WHITE  = np.array([255,255,255], dtype=np.float32)
CREAM  = np.array([248,240,222], dtype=np.float32)

# ─── helpers ──────────────────────────────────────────────────────────────────

def lin_grad(c1, c2, angle=135):
    rad = math.radians(angle)
    xs = np.linspace(-.5,.5,W); ys = np.linspace(-.5,.5,H)
    xx,yy = np.meshgrid(xs,ys)
    t = xx*math.cos(rad)+yy*math.sin(rad)
    t = (t-t.min())/(t.max()-t.min())
    return Image.fromarray((c1*(1-t[...,None])+c2*t[...,None]).astype(np.uint8))

def blank():
    return Image.new('RGBA',(W,H),(0,0,0,0))

def comp(base, layer):
    b = base.convert('RGBA')
    b.alpha_composite(layer)
    return b.convert('RGB')

def grain(img, sigma=7, seed=42):
    rng = np.random.RandomState(seed)
    a = np.array(img,dtype=np.float32)
    return Image.fromarray(np.clip(a+rng.normal(0,sigma,a.shape),0,255).astype(np.uint8))

def vignette(img, s=0.55):
    a = np.array(img,dtype=np.float32)
    xs=np.linspace(-1,1,W); ys=np.linspace(-1,1,H)
    xx,yy=np.meshgrid(xs,ys)
    r=np.clip(np.sqrt(xx**2+yy**2)/1.45,0,1)**1.6
    v=np.clip(1-r*s,0,1)[...,None]
    return Image.fromarray(np.clip(a*v,0,255).astype(np.uint8))

def stripe(draw, p1, p2, w, col, alpha=255):
    dx,dy=p2[0]-p1[0],p2[1]-p1[1]
    ln=math.sqrt(dx*dx+dy*dy)
    if ln==0: return
    nx,ny=-dy/ln,dx/ln
    hw=w/2
    pts=[(p1[0]+nx*hw,p1[1]+ny*hw),(p2[0]+nx*hw,p2[1]+ny*hw),
         (p2[0]-nx*hw,p2[1]-ny*hw),(p1[0]-nx*hw,p1[1]-ny*hw)]
    c=(*[int(x) for x in col],alpha)
    draw.polygon(pts,fill=c)

def diamond(draw, cx, cy, sz, col, alpha=255, outline=False, lw=3):
    pts=[(cx,cy-sz),(cx+sz,cy),(cx,cy+sz),(cx-sz,cy)]
    c=(*[int(x) for x in col],alpha)
    if outline: draw.polygon(pts,outline=c,width=lw)
    else: draw.polygon(pts,fill=c)

def glow_ellipse(cx, cy, rx, ry, col, alpha, blur):
    g=blank(); d=ImageDraw.Draw(g)
    d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry],fill=(*[int(x) for x in col],alpha))
    return g.filter(ImageFilter.GaussianBlur(blur))

def fade_right(base, start=0.55, strength=180):
    """Darken right side for text legibility."""
    l=blank(); d=ImageDraw.Draw(l)
    for x in range(W):
        t=max(0,(x/W-start)/(1-start))
        a=int(t**1.2*strength)
        if a: d.line([(x,0),(x,H)],fill=(11,11,13,a))
    return comp(base,l)

def fade_left(base, end=0.48, strength=180):
    """Darken left side for text legibility."""
    l=blank(); d=ImageDraw.Draw(l)
    for x in range(W):
        t=max(0,1-x/(W*end))
        a=int(t**1.2*strength)
        if a: d.line([(x,0),(x,H)],fill=(11,11,13,a))
    return comp(base,l)

# ═══════════════════════════════════════════════════════════════════════════════
# ABOUT — "PHANTOM IDENTITY"  (v2 — bigger mask, dramatic stripe, richer scene)
# ═══════════════════════════════════════════════════════════════════════════════

def gen_about():
    # Base: near-black with deep-red warmth bleeding from upper-left
    base = lin_grad(np.array([18,3,5],dtype=np.float32), BLACK, angle=195)

    # ── STRIPE lives in the UPPER-LEFT corner, mask is clear below-center ──
    # Stripe path: from top-left corner area diagonally across upper portion only
    s_p1 = (-80, int(H*0.52))   # left edge, roughly middle-left
    s_p2 = (int(W*0.44), -80)   # top edge, left of center

    # Glow behind stripe
    gl=blank(); gd=ImageDraw.Draw(gl)
    stripe(gd, s_p1, s_p2, 380, RED, 55)
    gl=gl.filter(ImageFilter.GaussianBlur(90))
    base=comp(base,gl)

    # Main stripe
    sl=blank(); sd=ImageDraw.Draw(sl)
    stripe(sd, s_p1, s_p2, 195, RED, 248)
    # Thin accent stripe parallel, offset inward
    s2_p1 = (-80, int(H*0.52)+235); s2_p2 = (int(W*0.44)+190, -80)
    stripe(sd, s2_p1, s2_p2, 24, RED, 200)
    # Fine white scan-lines through stripe (for texture)
    for k in range(-10,11):
        off = k*14
        stripe(sd,(s_p1[0]+off,s_p1[1]),(s_p2[0]+off,s_p2[1]), 1, WHITE, 52)
    base=comp(base,sl)

    # ── MASK — centred below the stripe, fully clear of it ──
    mx, my = int(W*0.33), int(H*0.57)   # shifted down so stripe clears eyes
    rx, ry = 370, 274

    # Drop shadow
    sh=blank(); shd=ImageDraw.Draw(sh)
    shd.ellipse([mx-rx+30,my-ry+36,mx+rx+30,my+ry+36],fill=(0,0,0,215))
    sh=sh.filter(ImageFilter.GaussianBlur(34))
    base=comp(base,sh)

    # Red halo behind mask
    base=comp(base, glow_ellipse(mx,my,rx+90,ry+65, RED, 125, 88))

    # Mask body
    ml=blank(); md=ImageDraw.Draw(ml)
    md.ellipse([mx-rx,my-ry,mx+rx,my+ry],fill=(248,240,224,255))

    # Angular eye cutouts (symmetric, bug-free mirror)
    # Left eye points (relative to mask centre)
    lrel = [(-270,-22),(-182,-90),(-58,-66),(-72,16),(-186,26)]
    le = [(mx+dx, my+dy) for dx,dy in lrel]
    re = [(mx-dx, my+dy) for dx,dy in lrel]   # clean mirror
    md.polygon(le, fill=(11,11,13,255))
    md.polygon(re, fill=(11,11,13,255))

    # Eye glow (red glint)
    # Left eye glow bounding box derived from lrel
    lx0,lx1 = mx+min(dx for dx,_ in lrel), mx+max(dx for dx,_ in lrel)
    ly0,ly1 = my+min(dy for _,dy in lrel), my+max(dy for _,dy in lrel)
    # Inset a bit for just the iris glow
    pad=42
    md.ellipse([lx0+pad,ly0+pad,lx1-pad,ly1-pad], fill=(230,0,18,210))
    # Right eye (mirror x)
    rx0,rx1 = mx-max(dx for dx,_ in lrel), mx-min(dx for dx,_ in lrel)
    md.ellipse([rx0+pad,ly0+pad,rx1-pad,ly1-pad], fill=(230,0,18,210))

    # Outline
    md.ellipse([mx-rx-6,my-ry-6,mx+rx+6,my+ry+6],
               outline=(11,11,13,255),width=8)
    # Subtle red ring
    md.ellipse([mx-rx-15,my-ry-11,mx+rx+15,my+ry+11],
               outline=(230,0,18,110),width=3)
    base=comp(base,ml)

    # ── HALFTONE DOT FIELD (right half, subtle) ──
    dots=blank(); dd=ImageDraw.Draw(dots)
    sp=28
    for dy2 in range(0,H,sp):
        for dx2 in range(int(W*0.48),W,sp):
            dist=math.sqrt((dx2-W*0.9)**2+(dy2-H*0.5)**2)
            t=max(0,1-dist/(W*0.55))
            r=max(1,int(t*4))
            a=int(t*32)
            if a>4:
                dd.ellipse([dx2-r,dy2-r,dx2+r,dy2+r],fill=(230,0,18,a))
    base=comp(base,dots)

    # ── DIAMOND ACCENTS ──
    al=blank(); ad=ImageDraw.Draw(al)
    dspecs=[
        (mx-430,my-290,24,RED,  240,False),
        (mx+410,my-180,18,WHITE,195,True),
        (mx+490,my+250,30,RED,  238,False),
        (mx-200,my+310,13,WHITE,195,False),
        (int(W*.76),int(H*.20),22,RED,  218,True),
        (int(W*.86),int(H*.60),16,WHITE,178,False),
        (int(W*.69),int(H*.82),11,RED,  198,False),
        (int(W*.94),int(H*.38),20,RED,  172,True),
        (int(W*.60),int(H*.12),10,WHITE,158,False),
        (int(W*.52),int(H*.90), 8,RED,  148,True),
    ]
    for cx2,cy2,sz,col,al2,out in dspecs:
        diamond(ad,cx2,cy2,sz,col,al2,out)
    base=comp(base,al)

    base=fade_right(base,0.54,165)
    base=vignette(grain(base,sigma=6))
    base.save(f"{OUT}/about.jpg",quality=95)
    print("✓ about.jpg")


# ═══════════════════════════════════════════════════════════════════════════════
# SKILLS — "THE PALACE"  (v2 — bright dramatic grid, cinematic red glow)
# ═══════════════════════════════════════════════════════════════════════════════

def gen_skills():
    base=Image.fromarray(np.full((H,W,3),BLACK.astype(np.uint8)))

    vpx,vpy=int(W*0.64),int(H*0.36)

    # ── LARGE AMBIENT GLOW ──
    base=comp(base,glow_ellipse(vpx,vpy,700,520,RED,100,200))
    base=comp(base,glow_ellipse(vpx,vpy,320,240,RED,180,80))
    base=comp(base,glow_ellipse(vpx,vpy, 80, 60,np.array([255,60,60]),220,30))

    # ── FLOOR FOG (red haze along bottom) ──
    fog=blank(); fd=ImageDraw.Draw(fog)
    for y in range(H-1,int(H*0.55),-1):
        t=(H-1-y)/(H*0.44)
        t=min(1,t)
        a=int(t*t*60)
        fd.line([(0,y),(W,y)],fill=(180,0,14,a))
    fog=fog.filter(ImageFilter.GaussianBlur(30))
    base=comp(base,fog)

    # ── RADIATING SPEED LINES (from VP, very visible) ──
    rng2=random.Random(7)
    sl=blank(); sld=ImageDraw.Draw(sl)
    for i in range(36):
        angle=-180+i*(340/35)
        rad=math.radians(angle)
        length=max(W,H)*1.8
        ex=vpx+math.cos(rad)*length
        ey=vpy+math.sin(rad)*length
        # Brighter lines that point downward (toward viewer/floor)
        vert_factor=max(0,math.sin(math.radians(angle)))*0.7
        horiz_factor=abs(math.cos(math.radians(angle)))*0.3
        brightness=vert_factor+horiz_factor
        alpha=int(20+brightness*110)
        lw=rng2.choice([1,1,2,2,3])
        sld.line([(vpx,vpy),(int(ex),int(ey))],fill=(220,0,14,alpha),width=lw)
    sl=sl.filter(ImageFilter.GaussianBlur(0.8))
    base=comp(base,sl)

    # ── PERSPECTIVE FLOOR GRID (much brighter) ──
    # --- Radiating floor lines ---
    gl=blank(); gld=ImageDraw.Draw(gl)
    for i in range(26):
        angle=185+i*(170/25)
        rad=math.radians(angle)
        ex=vpx+math.cos(rad)*max(W,H)*1.6
        ey=vpy+math.sin(rad)*max(W,H)*1.6
        if ey>vpy:
            dist_from_center=abs(i-12.5)/12.5
            alpha=int(160-dist_from_center*80)
            lw=2 if dist_from_center<0.3 else 1
            gld.line([(vpx,vpy),(int(ex),int(ey))],
                     fill=(200,0,16,alpha),width=lw)

    # --- Horizontal cross-bars ---
    for k in range(1,20):
        t=k/20.0
        y=vpy+int((H-vpy)*t**0.65)
        if vpy<y<H:
            spread=int((y-vpy)/(H-vpy)*W*0.9)
            x0=max(0,vpx-spread); x1=min(W,vpx+spread)
            alpha=int(100+60*(1-t))
            lw=2 if k<5 else 1
            gld.line([(x0,y),(x1,y)],fill=(200,0,16,alpha),width=lw)

    # Glow layer behind grid
    gl_blur=gl.filter(ImageFilter.GaussianBlur(4))
    base=comp(base,gl_blur)
    base=comp(base,gl)  # sharp grid on top

    # ── FLOATING CARD FRAMES (larger, more visible) ──
    cards=blank(); cd=ImageDraw.Draw(cards)
    card_specs=[
        (int(W*.22),int(H*.55),300,190,-10),
        (int(W*.41),int(H*.72),240,150,  5),
        (int(W*.10),int(H*.76),180,115, -4),
        (int(W*.52),int(H*.62),190,120,  8),
    ]
    for (cx,cy,cw,ch,rot) in card_specs:
        rad=math.radians(rot)
        cr,sr=math.cos(rad),math.sin(rad)
        def rp(lx,ly): return(cx+lx*cr-ly*sr,cy+lx*sr+ly*cr)
        outer=rp(-cw//2,-ch//2),rp(cw//2,-ch//2),rp(cw//2,ch//2),rp(-cw//2,ch//2)
        cd.polygon(outer,outline=(230,0,18,200),width=3)
        inner=[(-cw//2+12,-ch//2+10),(cw//2-12,-ch//2+10),
               (cw//2-12,ch//2-10),(-cw//2+12,ch//2-10)]
        cd.polygon([rp(x,y) for x,y in inner],outline=(230,0,18,110),width=1)
        # Small diamond at card center
        cpt=rp(0,0)
        diamond(cd,int(cpt[0]),int(cpt[1]),8,RED,180)
    base=comp(base,cards)

    # ── VP BRIGHT NODES ──
    nodes=blank(); nd=ImageDraw.Draw(nodes)
    diamond(nd,vpx,vpy,18,WHITE,240)
    for nx2,ny2,sz,col,al in [
        (vpx-150,vpy+110,10,RED,  190),
        (vpx+180,vpy+130, 7,WHITE,160),
        (int(W*.28),int(H*.64),12,RED,  170),
        (int(W*.15),int(H*.58), 8,WHITE,140),
        (int(W*.35),int(H*.80), 6,RED,  150),
    ]:
        diamond(nd,nx2,ny2,sz,col,al)
        base=comp(base,glow_ellipse(nx2,ny2,sz*3,sz*3,col,80,sz*2))
    base=comp(base,nodes)

    # ── BOLD ACCENT STRIPE (top-left) ──
    acc=blank(); ad=ImageDraw.Draw(acc)
    stripe(ad,(-80,int(H*.16)),(int(W*.32),-80),60,RED,220)
    stripe(ad,(-80,int(H*.16)+70),(int(W*.32)+55,-80),10,WHITE,140)
    base=comp(base,acc)

    # ── WHITE HORIZONTAL STREAKS (speed feel) ──
    wl=blank(); wd=ImageDraw.Draw(wl)
    for i in range(8):
        y=vpy-30+i*8
        x_end=vpx+random.Random(i).randint(80,200)
        alpha=max(0,110-i*14)
        wd.line([(vpx,y),(x_end,y)],fill=(255,255,255,alpha),width=1)
    base=comp(base,wl)

    base=fade_left(base,0.46,165)
    base=vignette(grain(base,sigma=5))
    base.save(f"{OUT}/skills.jpg",quality=95)
    print("✓ skills.jpg")


# ═══════════════════════════════════════════════════════════════════════════════
# CONTACT — "THE CALLING CARD"  (v2 — bigger card, richer background)
# ═══════════════════════════════════════════════════════════════════════════════

def gen_contact():
    base=lin_grad(np.array([22,4,5],dtype=np.float32),BLACK,angle=210)

    # ── DEEP LAYERED GLOW ──
    base=comp(base,glow_ellipse(int(W*.30),int(H*.50),820,620,RED, 55,200))
    base=comp(base,glow_ellipse(int(W*.30),int(H*.50),480,360,RED,120,100))
    base=comp(base,glow_ellipse(int(W*.30),int(H*.50),200,150,np.array([255,30,30]),140,50))

    # ── DIAGONAL LIGHT RAYS ──
    rl=blank(); rd=ImageDraw.Draw(rl)
    src=(int(W*.02),int(H*-0.06))
    for k in range(9):
        ang=32+k*13; rad=math.radians(ang)
        ex=src[0]+math.cos(rad)*max(W,H)*1.6
        ey=src[1]+math.sin(rad)*max(W,H)*1.6
        a=max(0,22-k*2)
        rd.line([src,(int(ex),int(ey))],fill=(255,255,230,a),width=3)
    rl=rl.filter(ImageFilter.GaussianBlur(6))
    base=comp(base,rl)

    # ── CALLING CARD ──
    cx,cy=int(W*.30),int(H*.50)
    cw,ch=420,600; rot=-5
    rad=math.radians(rot); cr,sr=math.cos(rad),math.sin(rad)
    def rp(lx,ly): return(cx+lx*cr-ly*sr,cy+lx*sr+ly*cr)

    # Drop shadow
    sh=blank(); shd=ImageDraw.Draw(sh)
    shadow_pts=[rp(x+30,y+40) for x,y in
                [(-cw//2,-ch//2),(cw//2,-ch//2),(cw//2,ch//2),(-cw//2,ch//2)]]
    shd.polygon(shadow_pts,fill=(0,0,0,200))
    sh=sh.filter(ImageFilter.GaussianBlur(40))
    base=comp(base,sh)

    card=blank(); cd=ImageDraw.Draw(card)
    outer=[rp(-cw//2,-ch//2),rp(cw//2,-ch//2),rp(cw//2,ch//2),rp(-cw//2,ch//2)]
    cd.polygon(outer,fill=(250,242,226,255))

    # Red border band (inside card)
    bdr=22
    border=[rp(-cw//2+bdr,-ch//2+bdr),rp(cw//2-bdr,-ch//2+bdr),
            rp(cw//2-bdr,ch//2-bdr),rp(-cw//2+bdr,ch//2-bdr)]
    cd.polygon(border,outline=(230,0,18,255),width=5)

    # Thin inner line
    ibdr=bdr+10
    cd.polygon([rp(-cw//2+ibdr,-ch//2+ibdr),rp(cw//2-ibdr,-ch//2+ibdr),
                rp(cw//2-ibdr,ch//2-ibdr),rp(-cw//2+ibdr,ch//2-ibdr)],
               outline=(230,0,18,120),width=1)

    # Corner diamond ornaments
    for ox,oy in [(-cw//2+bdr+6,-ch//2+bdr+6),(cw//2-bdr-6,-ch//2+bdr+6),
                  (cw//2-bdr-6,ch//2-bdr-6),(-cw//2+bdr+6,ch//2-bdr-6)]:
        pt=rp(ox,oy)
        diamond(cd,int(pt[0]),int(pt[1]),14,RED,255)

    # ── WAX SEAL ──
    seal=rp(0,0)
    sx,sy=int(seal[0]),int(seal[1])
    sr2=78
    # outer glow
    cd.ellipse([sx-sr2-18,sy-sr2-18,sx+sr2+18,sy+sr2+18],
               fill=(160,0,12,80))
    cd.ellipse([sx-sr2,sy-sr2,sx+sr2,sy+sr2],fill=(230,0,18,255))
    cd.ellipse([sx-sr2,sy-sr2,sx+sr2,sy+sr2],outline=(11,11,13,255),width=4)
    cd.ellipse([sx-62,sy-62,sx+62,sy+62],outline=(250,242,226,200),width=2)
    cd.ellipse([sx-42,sy-42,sx+42,sy+42],outline=(250,242,226,120),width=1)
    # Cross
    cd.line([sx,sy-54,sx,sy+54],fill=(250,242,226,230),width=4)
    cd.line([sx-54,sy,sx+54,sy],fill=(250,242,226,230),width=4)
    # Center diamond
    diamond(cd,sx,sy,18,WHITE,250)

    # Card outline
    cd.polygon(outer,outline=(11,11,13,180),width=2)
    base=comp(base,card)

    # ── ORNAMENTAL HORIZONTAL LINES (inside card, top & bottom) ──
    ol=blank(); od=ImageDraw.Draw(ol)
    for sign in (-1,1):
        for k in range(3):
            y_off=sign*(ch//2-bdr-40-k*16)
            ln_pts=[rp(-cw//2+bdr+20,y_off),rp(cw//2-bdr-20,y_off)]
            alpha=max(0,100-k*30)
            od.line([tuple(map(int,p)) for p in ln_pts],
                    fill=(230,0,18,alpha),width=1)
    base=comp(base,ol)

    # ── SCATTERED DIAMONDS ──
    dl=blank(); dld=ImageDraw.Draw(dl)
    dspecs=[
        (int(W*.64),int(H*.20),22,RED,  210,False),
        (int(W*.74),int(H*.56),14,WHITE,190,True),
        (int(W*.82),int(H*.30),12,RED,  165,False),
        (int(W*.90),int(H*.68),26,RED,  185,True),
        (int(W*.56),int(H*.84),16,WHITE,155,False),
        (int(W*.14),int(H*.20),12,RED,  160,False),
        (int(W*.07),int(H*.74),18,RED,  145,True),
        (int(W*.46),int(H*.14), 8,WHITE,140,False),
        (int(W*.48),int(H*.88),10,RED,  130,True),
    ]
    for cx2,cy2,sz,col,al,out in dspecs:
        diamond(dld,cx2,cy2,sz,col,al,out)
    base=comp(base,dl)

    base=fade_right(base,0.55,160)
    base=vignette(grain(base,sigma=6))
    base.save(f"{OUT}/contact.jpg",quality=95)
    print("✓ contact.jpg")


# ─── run ──────────────────────────────────────────────────────────────────────
gen_about()
gen_skills()
gen_contact()
print("All done.")
