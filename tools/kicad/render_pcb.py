# Rysuje płytkę KiCada (.kicad_pcb) jako SVG: obrys, pola lutownicze, ścieżki obu warstw, przelotki,
# obrysy elementów z warstwy F.Fab. Każdy element to grupa z data-ref (do podświetlania).
import sys, os, json, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sexp import *
from xml.sax.saxutils import escape

src, out_svg, out_json = sys.argv[1], sys.argv[2], sys.argv[3]
t = load(src)
def f(v):
    s = ('%.3f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('-0','') else s
def layers_of(x):
    l = kid(x,'layers') or kid(x,'layer')
    return [sval(v) for v in l[1:]] if l else []

# obrys płytki
edge = []
bx0=by0=1e9; bx1=by1=-1e9
for g in kids(t,'gr_rect'):
    if 'Edge.Cuts' in layers_of(g):
        a,b = kid(g,'start'), kid(g,'end')
        bx0,by0,bx1,by1 = min(a[1],b[1]),min(a[2],b[2]),max(a[1],b[1]),max(a[2],b[2])
        edge.append('<rect class="edge" x="%s" y="%s" width="%s" height="%s"/>' % (f(bx0),f(by0),f(bx1-bx0),f(by1-by0)))
for g in kids(t,'gr_line'):
    if 'Edge.Cuts' in layers_of(g):
        a,b = kid(g,'start'), kid(g,'end')
        edge.append('<line class="edge" x1="%s" y1="%s" x2="%s" y2="%s"/>' % (f(a[1]),f(a[2]),f(b[1]),f(b[2])))
        bx0=min(bx0,a[1],b[1]); bx1=max(bx1,a[1],b[1]); by0=min(by0,a[2],b[2]); by1=max(by1,a[2],b[2])

# ścieżki: osobna ścieżka SVG na każdą warstwę i szerokość
tr = {}
for s in kids(t,'segment'):
    a,b = kid(s,'start'), kid(s,'end'); lay = sval(kid(s,'layer')[1]); w = kid(s,'width')[1]
    tr.setdefault((lay,w), []).append('M%s %sL%s %s' % (f(a[1]),f(a[2]),f(b[1]),f(b[2])))
def traces(lay, cls):
    return ''.join('<path class="%s" stroke-width="%s" d="%s"/>' % (cls, f(w), ''.join(d)) for (l,w),d in sorted(tr.items()) if l==lay)
vias = []
for v in kids(t,'via'):
    a = kid(v,'at'); sz = kid(v,'size')[1]; dr = kid(v,'drill')[1] if kid(v,'drill') else sz*0.5
    vias.append('<circle class="via" cx="%s" cy="%s" r="%s"/><circle class="hole" cx="%s" cy="%s" r="%s"/>' % (f(a[1]),f(a[2]),f(sz/2),f(a[1]),f(a[2]),f(dr/2)))

comps = {}; groups = []
for fp in kids(t,'footprint'):
    at = kid(fp,'at'); fx, fy = at[1], at[2]; frot = at[3] if len(at) > 3 else 0
    assert frot == 0, 'obrót footprintu nieobsługiwany'
    props = {sval(p[1]): sval(p[2]) for p in kids(fp,'property')}
    ref = props.get('Reference','?'); name = sval(fp[1]).split(':')[-1]
    comps[ref] = dict(value=props.get('Value',''), footprint=name)
    X = lambda x: fx + x
    Y = lambda y: fy + y
    fab = []; cx0=cy0=1e9; cx1=cy1=-1e9
    def ext(x,y):
        global cx0,cy0,cx1,cy1
        cx0=min(cx0,x); cy0=min(cy0,y); cx1=max(cx1,x); cy1=max(cy1,y)
    for c in fp[1:]:
        h = head(c)
        if h not in ('fp_line','fp_rect','fp_circle','fp_poly','fp_arc'): continue
        lay = layers_of(c)
        on_fab = 'F.Fab' in lay; on_crt = 'F.CrtYd' in lay
        if not (on_fab or on_crt): continue
        if h == 'fp_line':
            a,b = kid(c,'start'), kid(c,'end')
            if on_fab: fab.append('M%s %sL%s %s' % (f(X(a[1])),f(Y(a[2])),f(X(b[1])),f(Y(b[2]))))
            if on_crt: ext(X(a[1]),Y(a[2])); ext(X(b[1]),Y(b[2]))
        elif h == 'fp_rect':
            a,b = kid(c,'start'), kid(c,'end')
            x0,x1 = sorted([X(a[1]),X(b[1])]); y0,y1 = sorted([Y(a[2]),Y(b[2])])
            if on_fab: fab.append('M%s %sH%sV%sH%sZ' % (f(x0),f(y0),f(x1),f(y1),f(x0)))
            if on_crt: ext(x0,y0); ext(x1,y1)
        elif h == 'fp_poly':
            pts = [(X(p[1]),Y(p[2])) for p in kids(kid(c,'pts'),'xy')]
            if on_fab: fab.append('M' + 'L'.join('%s %s' % (f(x),f(y)) for x,y in pts) + 'Z')
            if on_crt:
                for p in pts: ext(*p)
        elif h == 'fp_circle':
            ce, en = kid(c,'center'), kid(c,'end'); r = math.hypot(en[1]-ce[1], en[2]-ce[2])
            if on_fab: fab.append('M%s %sa%s %s 0 1 0 %s 0a%s %s 0 1 0 %s 0' % (f(X(ce[1])-r),f(Y(ce[2])),f(r),f(r),f(2*r),f(r),f(r),f(-2*r)))
            if on_crt: ext(X(ce[1])-r,Y(ce[2])-r); ext(X(ce[1])+r,Y(ce[2])+r)
    pads = []
    for p in kids(fp,'pad'):
        lay = layers_of(p)
        if not any(l in ('F.Cu','*.Cu','B.Cu') for l in lay): continue
        kind, shape = sval(p[2]), sval(p[3])
        pa = kid(p,'at'); px, py = X(pa[1]), Y(pa[2]); prot = pa[3] if len(pa) > 3 else 0
        sz = kid(p,'size'); w, h_ = sz[1], sz[2]
        if prot in (90, 270, -90): w, h_ = h_, w
        elif prot not in (0, 180, -180): raise SystemExit('obrót pola %s nieobsługiwany' % prot)
        if shape == 'circle': rx = w/2
        elif shape == 'oval': rx = min(w,h_)/2
        elif shape == 'roundrect': rx = min(w,h_) * (kid(p,'roundrect_rratio')[1] if kid(p,'roundrect_rratio') else 0.25)
        else: rx = 0
        pads.append('<rect class="pad" x="%s" y="%s" width="%s" height="%s"%s/>' % (f(px-w/2),f(py-h_/2),f(w),f(h_),(' rx="%s"' % f(rx)) if rx else ''))
        if kind == 'thru_hole' and kid(p,'drill'):
            dr = kid(p,'drill'); 
            if isinstance(dr[1], str):     # (drill oval w h)
                dw, dh = dr[2], dr[3]
                if prot in (90,270,-90): dw, dh = dh, dw
                pads.append('<rect class="hole" x="%s" y="%s" width="%s" height="%s" rx="%s"/>' % (f(px-dw/2),f(py-dh/2),f(dw),f(dh),f(min(dw,dh)/2)))
            else:
                pads.append('<circle class="hole" cx="%s" cy="%s" r="%s"/>' % (f(px),f(py),f(dr[1]/2)))
        ext(px-w/2,py-h_/2); ext(px+w/2,py+h_/2)
    hit = '<rect class="hit" x="%s" y="%s" width="%s" height="%s" rx="0.3"/>' % (f(cx0),f(cy0),f(cx1-cx0),f(cy1-cy0))
    label = ''
    bw, bh = cx1-cx0, cy1-cy0
    if bw > 5 and bh > 4:                     # opis tylko tam, gdzie się mieści
        label = '<text class="ref" x="%s" y="%s" font-size="1.9" text-anchor="middle">%s</text>' % (f((cx0+cx1)/2), f((cy0+cy1)/2 + 0.7), escape(ref))
    comps[ref]['box'] = [round(cx0,2), round(cy0,2), round(bw,2), round(bh,2)]
    groups.append((ref, '<g class="cmp" data-ref="%s" tabindex="-1">%s<path class="fab" d="%s"/>%s%s</g>' % (escape(ref), hit, ''.join(fab), ''.join(pads), label)))

m = 2
svg = ('<svg class="pcb" viewBox="%s %s %s %s" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pcb-title"><title id="pcb-title">Płytka drukowana czujnika ENV, widok od strony elementów</title>' % (f(bx0-m),f(by0-m),f(bx1-bx0+2*m),f(by1-by0+2*m))
       + ''.join(edge)
       + '<g class="lay-b">' + traces('B.Cu','tr-b') + '</g>'
       + '<g class="parts">' + ''.join(g for _,g in sorted(groups)) + '</g>'
       + '<g class="lay-f">' + traces('F.Cu','tr-f') + '</g>'
       + '<g class="vias">' + ''.join(vias) + '</g>'
       + '</svg>')
open(out_svg,'w',encoding='utf8').write(svg)
json.dump(comps, open(out_json,'w',encoding='utf8'), ensure_ascii=False, indent=1, sort_keys=True)
print('board', bx0,by0,bx1,by1, 'bytes', len(svg), 'footprints', len(comps), 'vias', len(vias)//1)
