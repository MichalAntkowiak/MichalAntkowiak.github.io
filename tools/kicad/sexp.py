# Minimalny parser S-wyrażeń KiCada
import re
TOK = re.compile(r'\s*(?:(\()|(\))|"((?:[^"\\]|\\.)*)"|([^\s()"]+))')
def parse(text):
    stack=[[]]; pos=0; n=len(text)
    while pos<n:
        m=TOK.match(text,pos)
        if not m: break
        pos=m.end()
        if m.group(1): stack.append([])
        elif m.group(2):
            l=stack.pop(); stack[-1].append(l)
        elif m.group(3) is not None: stack[-1].append(('s',m.group(3).replace('\\"','"').replace('\\\\','\\')))
        else:
            t=m.group(4)
            try: stack[-1].append(float(t) if re.fullmatch(r'-?\d+(\.\d+)?([eE]-?\d+)?',t) else t)
            except: stack[-1].append(t)
    return stack[0][0]
def load(path): return parse(open(path,encoding='utf8').read())
def head(x): return x[0] if isinstance(x,list) and x and isinstance(x[0],str) else None
def kids(x,name): return [c for c in x[1:] if isinstance(c,list) and head(c)==name]
def kid(x,name):
    k=kids(x,name); return k[0] if k else None
def sval(v): return v[1] if isinstance(v,tuple) else v
