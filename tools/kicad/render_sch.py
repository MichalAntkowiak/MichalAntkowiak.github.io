# Rysuje schemat KiCada (.kicad_sch) jako SVG z klasami CSS (symbole, piny, przewody, etykiety).
import sys, json, math
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sexp import *
from xml.sax.saxutils import escape

src, out_svg, out_json = sys.argv[1], sys.argv[2], sys.argv[3]
t = load(src)
CAP = 0.74            # wysokość wersalika osifont w em

def f(v): 
    s = '%.3f' % v
    s = s.rstrip('0').rstrip('.')
    return '0' if s in ('-0','') else s
def hidden(x):
    h = kid(x,'hide')
    return bool(h) and (len(h)==1 or sval(h[1])=='yes')
def fsize(x):
    e = kid(x,'effects'); 
    if e:
        fo = kid(e,'font')
        if fo and kid(fo,'size'): return kid(fo,'size')[1]
    return 1.27
def justify(x):
    e = kid(x,'effects'); j = kid(e,'justify') if e else None
    return [sval(v) for v in j[1:]] if j else []

class BBox:
    def __init__(s): s.x0=s.y0=1e9; s.x1=s.y1=-1e9
    def add(s,x,y,r=0): s.x0=min(s.x0,x-r); s.y0=min(s.y0,y-r); s.x1=max(s.x1,x+r); s.y1=max(s.y1,y+r)
    def ok(s): return s.x1>=s.x0
page = BBox()

def text(x, y, s, size, cls, anchor='start', vcenter=True, rot=0, bottom=False):
    if s in ('', '~'): return ''
    s = s.replace('~{','').replace('}','') if '~{' in s else s
    fs = size / CAP
    yy = y + (size/2 if vcenter else 0) - (0.35 if bottom else 0)
    w = len(s)*size*0.62
    if anchor=='start': page.add(x,y,0); page.add(x+ (w if rot==0 else 0), y - (w if rot else 0), size)
    elif anchor=='end': page.add(x,y,0); page.add(x-(w if rot==0 else 0), y + (w if rot else 0), size)
    else: page.add(x-w/2,y,size); page.add(x+w/2,y,size)
    tr = ' transform="rotate(%s %s %s)"' % (f(rot), f(x), f(y)) if rot else ''
    return '<text class="%s" x="%s" y="%s" font-size="%s" text-anchor="%s"%s>%s</text>' % (cls, f(x), f(yy), f(fs), anchor, tr, escape(s))

# ---------- biblioteka symboli ----------
lib = {}
for s in kids(kid(t,'lib_symbols'),'symbol'):
    name = sval(s[1])
    pn = kid(s,'pin_names'); pnum = kid(s,'pin_numbers')
    d = dict(name=name, hide_names=bool(pn) and hidden(pn), hide_nums=bool(pnum) and hidden(pnum),
             name_off=(kid(pn,'offset')[1] if pn and kid(pn,'offset') else 0.508), units=[], power=kid(s,'power') is not None)
    for sub in kids(s,'symbol'):
        sn = sval(sub[1]); unit, style = sn.rsplit('_',2)[1:]
        d['units'].append((int(unit), int(style), sub))
    lib[name] = d

out = []
comps = {}

def draw_symbol(inst):
    lib_id = sval(kid(inst,'lib_id')[1]); L = lib[lib_id]
    at = kid(inst,'at'); ix, iy, rot = at[1], at[2], (at[3] if len(at)>3 else 0)
    assert rot == 0 and kid(inst,'mirror') is None, 'obrót/odbicie symbolu nieobsługiwane'
    unit = int(kid(inst,'unit')[1]) if kid(inst,'unit') else 1
    props = {sval(p[1]): p for p in kids(inst,'property')}
    ref = sval(props['Reference'][2]); val = sval(props['Value'][2])
    is_pwr = ref.startswith('#')
    if lib_id == 'power:PWR_FLAG': return        # znacznik ERC, nie element układu
    X = lambda x: ix + x
    Y = lambda y: iy - y
    body = BBox(); g = []; pins = []
    for (u, style, sub) in L['units']:
        if u not in (0, unit) or style not in (0, 1): continue
        for c in sub[2:]:
            h = head(c)
            sw = kid(kid(c,'stroke'),'width')[1] if kid(c,'stroke') else 0
            fill = sval(kid(kid(c,'fill'),'type')[1]) if kid(c,'fill') else 'none'
            cls = 'body' if fill == 'background' else ('solid' if fill == 'outline' else 'gfx')
            if h == 'rectangle':
                a, b = kid(c,'start'), kid(c,'end')
                x0, x1 = sorted([X(a[1]), X(b[1])]); y0, y1 = sorted([Y(a[2]), Y(b[2])])
                g.append('<rect class="%s" x="%s" y="%s" width="%s" height="%s"/>' % (cls, f(x0), f(y0), f(x1-x0), f(y1-y0)))
                body.add(x0,y0); body.add(x1,y1)
            elif h == 'polyline':
                pts = [(X(p[1]), Y(p[2])) for p in kids(kid(c,'pts'),'xy')]
                for p in pts: body.add(*p)
                g.append('<polyline class="%s" points="%s"/>' % (cls, ' '.join('%s,%s' % (f(x), f(y)) for x, y in pts)))
            elif h == 'circle':
                ce = kid(c,'center'); r = kid(c,'radius')[1]
                if r <= 0: continue
                body.add(X(ce[1]), Y(ce[2]), r)
                g.append('<circle class="%s" cx="%s" cy="%s" r="%s"/>' % (cls, f(X(ce[1])), f(Y(ce[2])), f(r)))
            elif h == 'arc':
                a, m, b = kid(c,'start'), kid(c,'mid'), kid(c,'end')
                x1,y1,x2,y2,x3,y3 = X(a[1]),Y(a[2]),X(m[1]),Y(m[2]),X(b[1]),Y(b[2])
                # promień okręgu przez 3 punkty
                dd = 2*(x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2))
                if abs(dd) < 1e-9: 
                    g.append('<polyline class="gfx" points="%s,%s %s,%s"/>' % (f(x1),f(y1),f(x3),f(y3))); continue
                ux = ((x1*x1+y1*y1)*(y2-y3)+(x2*x2+y2*y2)*(y3-y1)+(x3*x3+y3*y3)*(y1-y2))/dd
                uy = ((x1*x1+y1*y1)*(x3-x2)+(x2*x2+y2*y2)*(x1-x3)+(x3*x3+y3*y3)*(x2-x1))/dd
                r = math.hypot(x1-ux, y1-uy)
                cross = (x2-x1)*(y3-y1)-(y2-y1)*(x3-x1)
                sweep = 1 if cross > 0 else 0
                a1 = math.atan2(y1-uy,x1-ux); a3 = math.atan2(y3-uy,x3-ux)
                da = (a3-a1) % (2*math.pi) if sweep else (a1-a3) % (2*math.pi)
                large = 1 if da > math.pi else 0
                for p in ((x1,y1),(x2,y2),(x3,y3)): body.add(*p)
                g.append('<path class="gfx" d="M%s %sA%s %s 0 %d %d %s %s"/>' % (f(x1),f(y1),f(r),f(r),large,sweep,f(x3),f(y3)))
            elif h == 'pin':
                if hidden(c): continue
                pa = kid(c,'at'); px, py, ang = pa[1], pa[2], int(pa[3]) % 360
                ln = kid(c,'length')[1]
                dx, dy = {0:(1,0), 90:(0,1), 180:(-1,0), 270:(0,-1)}[ang]
                ex, ey = px + dx*ln, py + dy*ln
                if ln > 0: pins.append('<line class="pin" x1="%s" y1="%s" x2="%s" y2="%s"/>' % (f(X(px)), f(Y(py)), f(X(ex)), f(Y(ey))))
                page.add(X(px), Y(py))
                nm = sval(kid(c,'name')[1]); num = sval(kid(c,'number')[1])
                if not L['hide_names'] and nm not in ('', '~') and not is_pwr:
                    off = L['name_off']; sz = min(fsize(kid(c,'name')), 1.27)
                    if dy == 0:
                        pins.append(text(X(ex + dx*off), Y(ey), nm, sz, 'pname', 'start' if dx > 0 else 'end'))
                    else:
                        pins.append(text(X(ex), Y(ey + dy*off), nm, sz, 'pname', 'start' if dy > 0 else 'end', True, -90))
                if not L['hide_nums'] and not is_pwr and ln > 0:
                    sz = 1.0
                    if dy == 0: pins.append(text(X(px + dx*ln/2), Y(py) - 0.45 - sz/2, num, sz, 'pnum', 'middle'))
                    else: pins.append(text(X(px) - 0.45 - sz/2, Y(py + dy*ln/2), num, sz, 'pnum', 'middle', True, -90))
    txt = []
    for key, cls in (('Reference','ref'), ('Value','val')):
        p = props[key]
        if hidden(p): continue
        s = sval(p[2])
        if key == 'Reference' and is_pwr: continue
        pa = kid(p,'at'); j = justify(p)
        anchor = 'start' if 'left' in j else ('end' if 'right' in j else 'middle')
        tx, ty, sz = pa[1], pa[2], fsize(p)
        if sz < 1.0 and key == 'Reference' and body.ok():      # opis zmniejszony i wsunięty w symbol: stawiamy obok
            tx, anchor, sz = body.x0 - 0.7, 'end', 1.27
        txt.append(text(tx, ty, s, max(sz, 1.0), 'pwrval' if is_pwr else cls, anchor, 'bottom' not in j and 'top' not in j, 0, 'bottom' in j))
    if body.ok(): page.add(body.x0, body.y0); page.add(body.x1, body.y1)
    if is_pwr:
        out.append('<g class="pwr">%s%s%s</g>' % (''.join(g), ''.join(pins), ''.join(txt)))
    else:
        pad = 0.9
        hit = '<rect class="hit" x="%s" y="%s" width="%s" height="%s" rx="0.6"/>' % (f(body.x0-pad), f(body.y0-pad), f(body.x1-body.x0+2*pad), f(body.y1-body.y0+2*pad))
        fp = sval(props['Footprint'][2]) if 'Footprint' in props else ''
        comps[ref] = dict(value=val, footprint=fp.split(':')[-1], lib=lib_id.split(':')[-1], desc=sval(props['Description'][2]) if 'Description' in props else '')
        out.append('<g class="cmp" data-ref="%s" tabindex="-1">%s%s%s%s</g>' % (escape(ref), hit, ''.join(g), ''.join(pins), ''.join(txt)))

# przewody jako jedna ścieżka
d = []
for w in kids(t,'wire'):
    pts = [(p[1], p[2]) for p in kids(kid(w,'pts'),'xy')]
    for p in pts: page.add(*p)
    d.append('M' + 'L'.join('%s %s' % (f(x), f(y)) for x, y in pts))
wires = '<path class="wire" d="%s"/>' % ''.join(d)
juncs = ''.join('<circle class="junc" cx="%s" cy="%s" r="0.46"/>' % (f(kid(j,'at')[1]), f(kid(j,'at')[2])) for j in kids(t,'junction'))
ncs = []
for n in kids(t,'no_connect'):
    x, y = kid(n,'at')[1], kid(n,'at')[2]; s = 0.6
    ncs.append('M%s %sL%s %sM%s %sL%s %s' % (f(x-s),f(y-s),f(x+s),f(y+s),f(x-s),f(y+s),f(x+s),f(y-s)))
nc = '<path class="nc" d="%s"/>' % ''.join(ncs)
for s in kids(t,'symbol'): draw_symbol(s)
labels = []
for l in kids(t,'label'):
    a = kid(l,'at'); j = justify(l); assert (a[3] if len(a)>3 else 0) == 0
    anchor = 'start' if 'left' in j else ('end' if 'right' in j else 'middle')
    labels.append(text(a[1] + (0.3 if anchor=='start' else 0), a[2], sval(l[1]), max(fsize(l), 1.0), 'net', anchor, False, 0, True))

m = 2.5
vb = (page.x0 - m, page.y0 - m, page.x1 - page.x0 + 2*m, page.y1 - page.y0 + 2*m)
svg = ('<svg class="sch" viewBox="%s %s %s %s" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="sch-title"><title id="sch-title">Schemat ideowy czujnika ENV</title>' % tuple(f(v) for v in vb)
       + wires + nc + ''.join(out) + juncs + ''.join(labels) + '</svg>')
open(out_svg,'w',encoding='utf8').write(svg)
json.dump(comps, open(out_json,'w',encoding='utf8'), ensure_ascii=False, indent=1, sort_keys=True)
print('viewBox', [round(v,2) for v in vb], 'bytes', len(svg), 'components', len(comps))
