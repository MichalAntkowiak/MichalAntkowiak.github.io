#!/usr/bin/env python3
"""Odświeża rysunki czujnika ENV w index.html na podstawie plików KiCada.

Schemat (assets/czujnik-env.kicad_sch) i płytka (assets/czujnik-env.kicad_pcb)
są rysowane jako SVG i wstawiane między znaczniki <!-- kicad:sch --> oraz
<!-- kicad:pcb --> w index.html. Odświeżane są też podpisy elementów
pokazywane po wskazaniu ich na rysunku.

Użycie (z głównego katalogu repozytorium):
    python3 tools/kicad/odswiez.py
"""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SCH = os.path.join(ROOT, 'assets', 'czujnik-env.kicad_sch')
PCB = os.path.join(ROOT, 'assets', 'czujnik-env.kicad_pcb')

# co robi dany układ (dopisek do podpisu)
FUNC = {
    'USBLC6-2SC6': 'ochrona ESD linii USB',
    'AP2112K-3.3': 'regulator LDO 3,3 V',
    'ESP32-C3-WROOM-02': 'moduł z układem ESP32-C3',
    'BME280': 'czujnik temperatury, wilgotności i ciśnienia',
}

def obudowa(fp):
    m = re.search(r'_(\d{4})_\d+Metric', fp)
    if m: return m.group(1)
    m = re.search(r'SOT-23-\d', fp)
    if m: return m.group(0)
    if 'LGA-8' in fp: return 'LGA-8'
    if '6x6' in fp: return '6 × 6 mm'
    if 'USB4085' in fp: return 'GCT USB4085'
    return ''

def opor(v):
    m = re.match(r'\s*([\d.,]+)\s*([kKM]?)', v)
    return '%s %sΩ' % (m.group(1).replace('.', ','), 'M' if m.group(2) == 'M' else m.group(2).lower()) if m else v

def pojemnosc(v):
    m = re.match(r'\s*([\d.,]+)\s*([unpµ])F', v)
    return '%s %sF' % (m.group(1).replace('.', ','), 'µ' if m.group(2) in 'uµ' else m.group(2)) if m else v

def podpisy(sch, pcb):
    out = {}
    for ref, d in sch.items():
        v, lib = d['value'], d['lib']
        if lib == 'R': nazwa = 'rezystor ' + opor(v)
        elif lib == 'C': nazwa = 'kondensator ' + pojemnosc(v)
        elif lib == 'SW_Push': nazwa = 'przycisk'
        elif lib.startswith('USB_C'): nazwa = 'gniazdo USB-C'
        else: nazwa = v + (', ' + FUNC[v] if v in FUNC else '')
        ob = obudowa(pcb.get(ref, {}).get('footprint', d.get('footprint', '')))
        out[ref] = '%s: %s%s' % (ref, nazwa, ' (%s)' % ob if ob else '')
    return out

def rysuj():
    """Zwraca (svg schematu, svg płytki, podpisy elementów, dane schematu, dane płytki)."""
    with tempfile.TemporaryDirectory() as tmp:
        p = lambda n: os.path.join(tmp, n)
        subprocess.run([sys.executable, os.path.join(HERE, 'render_sch.py'), SCH, p('sch.svg'), p('sch.json')], check=True, stdout=subprocess.DEVNULL)
        subprocess.run([sys.executable, os.path.join(HERE, 'render_pcb.py'), PCB, p('pcb.svg'), p('pcb.json')], check=True, stdout=subprocess.DEVNULL)
        rd = lambda n: open(p(n), encoding='utf8').read()
        sch, pcb = json.loads(rd('sch.json')), json.loads(rd('pcb.json'))
        return rd('sch.svg'), rd('pcb.svg'), podpisy(sch, pcb), sch, pcb

def wstaw(html, sch_svg, pcb_svg, labels):
    def blok(html, name, svg):
        pat = re.compile(r'(<!-- kicad:%s -->).*?(<!-- /kicad:%s -->)' % (name, name), re.S)
        if not pat.search(html): raise SystemExit('Brak znaczników kicad:%s w index.html' % name)
        return pat.sub(lambda m: m.group(1) + svg + m.group(2), html)
    html = blok(html, 'sch', sch_svg)
    html = blok(html, 'pcb', pcb_svg)
    pat = re.compile(r'(<script id="cmp-data" type="application/json">).*?(</script>)', re.S)
    if not pat.search(html): raise SystemExit('Brak <script id="cmp-data"> w index.html')
    return pat.sub(lambda m: m.group(1) + json.dumps(labels, ensure_ascii=False, sort_keys=True) + m.group(2), html)

if __name__ == '__main__':
    path = os.path.join(ROOT, 'index.html')
    html = open(path, encoding='utf8').read()
    sch_svg, pcb_svg, labels, sch, pcb = rysuj()
    new = wstaw(html, sch_svg, pcb_svg, labels)
    if new == html:
        print('index.html jest aktualny (%d elementów).' % len(labels))
    else:
        open(path, 'w', encoding='utf8').write(new)
        print('Zaktualizowano rysunki w index.html (%d elementów).' % len(labels))
    w_tabeli = set(re.findall(r'data-refs="([^"]+)"', new) and ' '.join(re.findall(r'data-refs="([^"]+)"', new)).split())
    brak = sorted(set(labels) - w_tabeli); nadmiar = sorted(w_tabeli - set(labels))
    if brak or nadmiar:
        print('Uwaga: tabela elementów w index.html wymaga ręcznej poprawki.',
              ('Brakuje: ' + ', '.join(brak) + '.') if brak else '', ('Nie ma już na schemacie: ' + ', '.join(nadmiar) + '.') if nadmiar else '')
