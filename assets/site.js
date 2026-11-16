/* Zachowanie strony: motyw, nawigacja, rys. 1 (zespół), powiększenia,
   schemat i płytka, pokój pomiarowy z filtrem Kalmana, stacja pogodowa, szachy. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  var viewer = null;

  /* ---------- motyw: kalka albo światłokopia ---------- */
  (function () {
    var btn = $('#theme');
    if (!btn) return;
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    function current() {
      return root.getAttribute('data-theme') || (mq && mq.matches ? 'swiatlokopia' : 'kalka');
    }
    function paint() {
      var light = current() === 'kalka';
      btn.querySelector('span').textContent = light ? 'Światłokopia' : 'Kalka';
      btn.setAttribute('aria-label', light ? 'Przełącz na ciemny motyw: światłokopia' : 'Przełącz na jasny motyw: kalka');
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', light ? '#eff2f1' : '#11305f');
      if (viewer) viewer.recolor();
    }
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var next = current() === 'kalka' ? 'swiatlokopia' : 'kalka';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('motyw', next); } catch (e) { }
      paint();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', paint);
    paint();
    doc.addEventListener('zespol-gotowy', paint);
  })();

  /* ---------- nawigacja: zaznacz rozdział, który jest na ekranie ---------- */
  (function () {
    var links = $$('.nav a[data-spy]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        byId[e.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(byId).forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
    var hero = $('#start');
    if (hero) new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) links.forEach(function (a) { a.removeAttribute('aria-current'); });
    }, { rootMargin: '-35% 0px -60% 0px' }).observe(hero);
  })();

  /* ---------- powiększenia: arkusze, zdjęcia, schemat ---------- */
  var lb = $('#lb'), lbBody = $('#lb-body'), lbTitle = $('#lb-title');
  function openLb(title, node) {
    if (!lb) return;
    lbTitle.textContent = title || '';
    lbBody.innerHTML = '';
    lbBody.appendChild(node);
    if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    lbBody.scrollTop = 0; lbBody.scrollLeft = 0;
  }
  if (lb) lb.addEventListener('click', function (ev) { if (ev.target === lb && lb.close) lb.close(); });
  doc.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-zoom],[data-zoom-svg]') : null;
    if (!t) return;
    var title = t.getAttribute('data-title') || '';
    if (t.hasAttribute('data-zoom')) {
      var img = new Image();
      img.alt = title;
      if (t.hasAttribute('data-ink') || t.querySelector('.ink-img')) img.className = 'ink-img';
      img.src = t.getAttribute('data-zoom');
      openLb(title, img);
    } else {
      var src = $(t.getAttribute('data-zoom-svg'));
      if (!src) return;
      var copy = src.cloneNode(true);
      $$('[id]', copy).forEach(function (n) { n.removeAttribute('id'); });
      copy.removeAttribute('aria-labelledby');
      $$('.is-on', copy).forEach(function (n) { n.classList.remove('is-on'); });
      var box = doc.createElement('div');
      box.className = 'kicad';
      box.appendChild(copy);
      openLb(title, box);
    }
  });

  /* ---------- rys. 1: zespół i lista części ---------- */
  (function () {
    var fig = $('#zespol');
    if (!fig || !window.Zespol) return;
    var rows = {};
    $$('.bom tbody tr', fig).forEach(function (tr) { rows[tr.getAttribute('data-id')] = tr; });
    function markRow(id) { Object.keys(rows).forEach(function (k) { rows[k].classList.toggle('is-on', +k === id); }); }
    viewer = window.Zespol.init(fig, {
      src: 'assets/Zespol1.glb',
      onhover: markRow,
      onpick: function (id) { var b = rows[id] && rows[id].querySelector('[data-zoom]'); if (b) b.click(); },
      onready: function () { doc.dispatchEvent(new Event('zespol-gotowy')); }
    });
    Object.keys(rows).forEach(function (k) {
      var tr = rows[k], id = +k;
      function on() { markRow(id); if (viewer) viewer.highlight(id); }
      function off() { markRow(0); if (viewer) viewer.highlight(0); }
      tr.addEventListener('pointerenter', on);
      tr.addEventListener('pointerleave', off);
      tr.addEventListener('focusin', on);
      tr.addEventListener('focusout', off);
    });
    var seg = $$('.seg button', fig);
    seg.forEach(function (b) {
      b.addEventListener('click', function () {
        seg.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        if (viewer) viewer.setMode(b.getAttribute('data-view'));
      });
    });
  })();

  /* ---------- czujnik ENV: element wskazany na liście, schemacie albo płytce podświetla się wszędzie ---------- */
  (function () {
    var figs = $$('.kicad'), probe = $('#probe'), rows = $$('#env-parts tbody tr');
    if (!figs.length || !probe) return;
    var labels = {};
    try { labels = JSON.parse($('#cmp-data').textContent); } catch (e) { }
    var cur = '', lastType = 'mouse';
    function place(g) {
      var fig = g.closest('.kicad');
      if (probe.parentNode !== fig) fig.appendChild(probe);
      var r = g.querySelector('.hit').getBoundingClientRect(), f = fig.getBoundingClientRect();
      var half = probe.offsetWidth / 2 + 2;
      var x = Math.max(half, Math.min(f.width - half, r.left + r.width / 2 - f.left));
      var above = r.top - f.top > 34;
      probe.style.left = x + 'px';
      probe.style.top = (above ? r.top - f.top : r.bottom - f.top + probe.offsetHeight + 12) + 'px';
    }
    function show(refs, g) {
      var key = refs ? refs.join(' ') : '';
      if (key !== cur) {
        cur = key;
        figs.forEach(function (f) {
          $$('.cmp', f).forEach(function (n) { n.classList.toggle('is-on', !!refs && refs.indexOf(n.getAttribute('data-ref')) >= 0); });
        });
        rows.forEach(function (tr) {
          var own = tr.getAttribute('data-refs').split(' ');
          tr.classList.toggle('is-on', !!refs && refs.some(function (r) { return own.indexOf(r) >= 0; }));
        });
      }
      if (refs && g) { probe.textContent = labels[refs[0]] || refs[0]; probe.hidden = false; place(g); }
      else probe.hidden = true;
    }
    figs.forEach(function (fig) {
      fig.addEventListener('pointerdown', function (ev) { lastType = ev.pointerType || 'mouse'; });
      fig.addEventListener('pointerover', function (ev) {
        if (ev.pointerType === 'touch') return;
        var g = ev.target.closest('.cmp');
        if (g) show([g.getAttribute('data-ref')], g);
      });
      fig.addEventListener('pointerout', function (ev) {
        if (ev.pointerType === 'touch') return;
        var g = ev.target.closest('.cmp');
        if (g && !(ev.relatedTarget && g.contains(ev.relatedTarget))) show(null);
      });
      fig.addEventListener('click', function (ev) {
        if (lastType === 'mouse') return;
        var g = ev.target.closest('.cmp');
        if (g && cur !== g.getAttribute('data-ref')) show([g.getAttribute('data-ref')], g); else show(null);
      });
    });
    rows.forEach(function (tr) {
      var refs = tr.getAttribute('data-refs').split(' ');
      function on() { show(refs); }
      function off() { show(null); }
      tr.addEventListener('pointerenter', function (ev) { if (ev.pointerType !== 'touch') on(); });
      tr.addEventListener('pointerleave', function (ev) { if (ev.pointerType !== 'touch') off(); });
      tr.addEventListener('focus', on);
      tr.addEventListener('blur', off);
      tr.addEventListener('click', function () { if (cur === refs.join(' ') && lastRow === tr) { off(); lastRow = null; } else { on(); lastRow = tr; } });
    });
    var lastRow = null;
    $$('.layers input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var pcb = $('#fig-pcb svg');
        if (pcb) pcb.classList.toggle('hide-' + inp.getAttribute('data-layer'), !inp.checked);
      });
    });
  })();

  /* ---------- rys. 10: pokój pomiarowy i filtr Kalmana ---------- */
  (function () {
    var fig = $('#fig-tri');
    if (!fig) return;
    var svg = $('svg', fig), room = $('.tri-room', fig);
    var rawG = $('#tri-raw'), pathEl = $('#tri-path'), est = $('#tri-est'), tru = $('#tri-true'), out = $('#tri-out');
    var NS = 'http://www.w3.org/2000/svg';
    function el(name, attrs, parent) { var e = doc.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }

    // siatka 22 punktów kalibracji (2 × 11) oraz węzły radiowe: rozmieszczenie poglądowe
    var pts = [], d = '';
    for (var i = 0; i < 11; i++) for (var j = 0; j < 2; j++) {
      var gx = 300 + i * 400, gy = 400 + j * 800;
      pts.push([gy / 1000, gx / 1000]);
      d += 'M' + (gx - 40) + ' ' + gy + 'h80M' + gx + ' ' + (gy - 40) + 'v80';
    }
    el('path', { d: d }, $('#tri-grid'));
    [['TX1', 110, 110, 'start', 80, 150], ['TX2', 4490, 110, 'end', -80, 150], ['TX3', 2300, 1490, 'start', 80, -30], ['RX', 2300, 110, 'start', 80, 150]].forEach(function (n) {
      var g = $('#tri-nodes');
      el('rect', { x: n[1] - 34, y: n[2] - 34, width: 68, height: 68, 'class': n[0] === 'RX' ? 't f' : 'it' }, g);
      var t = el('text', { x: n[1] + n[4], y: n[2] + n[5] - 70, 'font-size': 105, 'text-anchor': n[3], 'class': 'lt' }, g);
      t.textContent = n[0];
    });

    // Filtr Kalmana 2D ze stałą prędkością, parametry jak w repozytorium:
    // dt = 0,033 s, szum procesu 0,03, szum pomiaru 1,1, stan [x, y, vx, vy]
    var DT = 0.033, Q = 0.03, R = 1.1;
    function Kalman() {
      this.x = [0.8, 2.3, 0, 0];
      this.P = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
    }
    Kalman.prototype.step = function (zx, zy) {
      var x = this.x, P = this.P, i, j;
      // predykcja: x = A x, P = A P A' + Q
      x = [x[0] + DT * x[2], x[1] + DT * x[3], x[2], x[3]];
      var AP = [[], [], [], []];
      for (j = 0; j < 4; j++) { AP[0][j] = P[0][j] + DT * P[2][j]; AP[1][j] = P[1][j] + DT * P[3][j]; AP[2][j] = P[2][j]; AP[3][j] = P[3][j]; }
      var Pp = [[], [], [], []];
      for (i = 0; i < 4; i++) { Pp[i][0] = AP[i][0] + DT * AP[i][2]; Pp[i][1] = AP[i][1] + DT * AP[i][3]; Pp[i][2] = AP[i][2]; Pp[i][3] = AP[i][3]; Pp[i][i] += Q; }
      // korekta pomiarem z = [zx, zy]
      var s00 = Pp[0][0] + R, s01 = Pp[0][1], s10 = Pp[1][0], s11 = Pp[1][1] + R;
      var det = s00 * s11 - s01 * s10;
      var i00 = s11 / det, i01 = -s01 / det, i10 = -s10 / det, i11 = s00 / det;
      var K = [];
      for (i = 0; i < 4; i++) K[i] = [Pp[i][0] * i00 + Pp[i][1] * i10, Pp[i][0] * i01 + Pp[i][1] * i11];
      var y0 = zx - x[0], y1 = zy - x[1];
      for (i = 0; i < 4; i++) x[i] += K[i][0] * y0 + K[i][1] * y1;
      var Pn = [[], [], [], []];
      for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) Pn[i][j] = Pp[i][j] - (K[i][0] * Pp[0][j] + K[i][1] * Pp[1][j]);
      this.x = x; this.P = Pn;
      // ściany pokoju, jak w programie
      return [Math.max(0, Math.min(1.6, x[0])), Math.max(0, Math.min(4.6, x[1]))];
    };

    var seed = 20260429;
    function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    function gauss() { var u = 0; for (var k = 0; k < 6; k++) u += rnd(); return (u - 3) * 1.414; }

    var kf = new Kalman(), target = [0.8, 2.3], raws = [], trail = [], dots = [];
    for (var n = 0; n < 40; n++) dots.push(el('circle', { r: 26, cx: -999, cy: -999 }, rawG));
    function tick() {
      // symulowane wskazanie KNN: prawdziwe położenie z szumem, czasem przeskok na przypadkowy punkt siatki
      var z = [target[0] + gauss() * 0.15, target[1] + gauss() * 0.22];
      if (rnd() < 0.03) z = pts[Math.floor(rnd() * pts.length)];
      var p = kf.step(z[0], z[1]);
      raws.push(z); if (raws.length > dots.length) raws.shift();
      trail.push(p); if (trail.length > 170) trail.shift();
      return p;
    }
    function draw(p) {
      for (var k = 0; k < dots.length; k++) {
        var z = raws[raws.length - 1 - k];
        if (!z) { dots[k].setAttribute('cx', -999); continue; }
        dots[k].setAttribute('cx', (Math.max(0, Math.min(4.6, z[1])) * 1000).toFixed(0));
        dots[k].setAttribute('cy', (Math.max(0, Math.min(1.6, z[0])) * 1000).toFixed(0));
        dots[k].setAttribute('opacity', (0.75 * (1 - k / dots.length)).toFixed(2));
      }
      pathEl.setAttribute('points', trail.map(function (q) { return (q[1] * 1000).toFixed(0) + ',' + (q[0] * 1000).toFixed(0); }).join(' '));
      est.setAttribute('cx', (p[1] * 1000).toFixed(0)); est.setAttribute('cy', (p[0] * 1000).toFixed(0));
      var tx = target[1] * 1000, ty = target[0] * 1000;
      tru.setAttribute('d', 'M' + (tx - 70) + ' ' + ty + 'h140M' + tx + ' ' + (ty - 70) + 'v140');
      if (out) out.textContent = 'Po filtrze: X = ' + p[0].toFixed(2).replace('.', ',') + ' m, Y = ' + p[1].toFixed(2).replace('.', ',') + ' m';
    }

    // obraz wyjściowy: krótki spacer wzdłuż pokoju, policzony zawczasu
    var p0 = null;
    for (var s = 0; s < 150; s++) {
      var u = s / 149;
      target = [0.8 + 0.42 * Math.sin(u * 5.2), 0.5 + 3.5 * u];
      p0 = tick();
    }
    draw(p0);

    var timer = 0, idle = 0;
    function run() {
      if (timer) return;
      timer = setInterval(function () {
        draw(tick());
        if (idle && Date.now() > idle) { clearInterval(timer); timer = 0; }
      }, 33);
    }
    function aim(ev) {
      var m = svg.getScreenCTM();
      if (!m) return;
      var x = (ev.clientX - m.e) / m.a, y = (ev.clientY - m.f) / m.d;
      target = [Math.max(0, Math.min(1.6, y / 1000)), Math.max(0, Math.min(4.6, x / 1000))];
      idle = 0; run();
    }
    room.addEventListener('pointermove', aim);
    room.addEventListener('pointerdown', aim);
    function rest() { idle = Date.now() + 1500; }
    room.addEventListener('pointerleave', rest);
    room.addEventListener('pointerup', function (ev) { if (ev.pointerType !== 'mouse') rest(); });
    room.addEventListener('pointercancel', rest);
  })();

  /* ---------- stacja pogodowa: Open-Meteo ---------- */
  (function () {
    var tempEl = $('#wx-temp'), descEl = $('#wx-desc'), pressEl = $('#wx-press'), humidEl = $('#wx-humid'), windEl = $('#wx-wind');
    var linesEl = $('#wx-lines'), chartEl = $('#wx-chart'), btn = $('#wx-refresh');
    if (!tempEl || !linesEl) return;

    var WMO = {
      0: 'Bezchmurnie', 1: 'Prawie bezchmurnie', 2: 'Częściowe zachmurzenie', 3: 'Pochmurno',
      45: 'Mgła', 48: 'Mgła osadzająca szadź',
      51: 'Słaba mżawka', 53: 'Mżawka', 55: 'Gęsta mżawka', 56: 'Marznąca mżawka', 57: 'Gęsta marznąca mżawka',
      61: 'Słaby deszcz', 63: 'Deszcz', 65: 'Ulewny deszcz', 66: 'Marznący deszcz', 67: 'Silny marznący deszcz',
      71: 'Słaby śnieg', 73: 'Śnieg', 75: 'Intensywny śnieg', 77: 'Ziarna śnieżne',
      80: 'Przelotny deszcz', 81: 'Przelotny deszcz', 82: 'Gwałtowne opady deszczu',
      85: 'Przelotny śnieg', 86: 'Intensywny przelotny śnieg',
      95: 'Burza', 96: 'Burza z gradem', 99: 'Burza z silnym gradem'
    };
    // Pełne zapytanie: bieżący odczyt w m/s i czasie warszawskim oraz temperatury godzinowe na dwie doby.
    // Gdyby serwer je odrzucił, wracamy do najprostszego zapytania o sam bieżący odczyt.
    var BASIC = 'https://api.open-meteo.com/v1/forecast?latitude=52.2297&longitude=21.0122' +
      '&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code';
    var FULL = BASIC + '&hourly=temperature_2m&forecast_days=2&wind_speed_unit=ms&timezone=Europe%2FWarsaw';

    function pl(v, digits) { return v.toFixed(digits).replace('.', ',').replace('-', '–'); }   // półpauza zamiast minusa: osifont nie ma U+2212
    function clock() { return new Date().toLocaleTimeString('pl-PL'); }
    function log(msg, err) {
      var li = doc.createElement('li');
      li.textContent = clock() + ' ' + msg;
      if (err) li.className = 'is-err';
      linesEl.appendChild(li);
      linesEl.scrollTop = linesEl.scrollHeight;
    }

    function chart(times, temps) {
      chartEl.innerHTML = '';
      if (!times || !temps || temps.length < 3) return;
      var W = 380, H = 150, L = 34, Rr = 10, T = 14, B = 26;
      var lo = Math.floor(Math.min.apply(null, temps)) - 1, hi = Math.ceil(Math.max.apply(null, temps)) + 1;
      var span = hi - lo, stepY = span > 22 ? 10 : span > 10 ? 5 : span > 4 ? 2 : 1;
      var n = temps.length;
      function X(i) { return L + (W - L - Rr) * i / (n - 1); }
      function Y(v) { return T + (H - T - B) * (1 - (v - lo) / span); }
      var NS = 'http://www.w3.org/2000/svg';
      var svg = doc.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Wykres prognozy temperatury na najbliższe 24 godziny, od ' + pl(Math.min.apply(null, temps), 0) + ' do ' + pl(Math.max.apply(null, temps), 0) + ' stopni Celsjusza');
      function add(name, attrs, text) { var e = doc.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; svg.appendChild(e); return e; }
      for (var v = Math.ceil(lo / stepY) * stepY; v <= hi; v += stepY) {
        add('line', { 'class': 'tk', x1: L, x2: W - Rr, y1: Y(v), y2: Y(v) });
        add('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end' }, pl(v, 0) + '°');
      }
      for (var i = 0; i < n; i++) {
        var hh = +times[i].slice(11, 13);
        if (i > 0 && hh % 6 === 0) {
          add('line', { 'class': 'ax', x1: X(i), x2: X(i), y1: H - B, y2: H - B + 5 });
          add('text', { x: X(i), y: H - B + 18, 'text-anchor': 'middle' }, times[i].slice(11, 16));
        }
      }
      add('line', { 'class': 'ax', x1: L, x2: W - Rr, y1: H - B, y2: H - B });
      add('line', { 'class': 'ax', x1: L, x2: L, y1: T - 4, y2: H - B });
      add('polyline', { 'class': 'ln', points: temps.map(function (t, k) { return X(k).toFixed(1) + ',' + Y(t).toFixed(1); }).join(' ') });
      add('circle', { 'class': 'now', cx: X(0), cy: Y(temps[0]), r: 4 });
      add('text', { 'class': 'nowt', x: X(0) + 8, y: Y(temps[0]) - 8 }, 'teraz');
      chartEl.appendChild(svg);
    }

    function fail(err) {
      log('Błąd: ' + err.message, true);
      tempEl.textContent = '— °C';
      descEl.textContent = 'Brak połączenia z API. Spróbuj odświeżyć odczyt.';
      descEl.className = 'wx-desc is-err';
      pressEl.textContent = humidEl.textContent = windEl.textContent = '—';
    }
    function get(url) {
      return fetch(url).then(function (r) {
        log('Odpowiedź: ' + r.status);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    }
    function show(data) {
      var c = data.current, u = data.current_units || {};
      if (!c) throw new Error('brak bieżącego odczytu w odpowiedzi');
      var wind = c.wind_speed_10m / (u.wind_speed_10m === 'km/h' ? 3.6 : 1);     // zawsze pokazujemy m/s
      tempEl.textContent = pl(Math.round(c.temperature_2m), 0) + ' °C';
      descEl.textContent = WMO[c.weather_code] || ('Kod pogody ' + c.weather_code);
      pressEl.textContent = Math.round(c.surface_pressure) + ' hPa';
      humidEl.textContent = Math.round(c.relative_humidity_2m) + ' %';
      windEl.textContent = pl(wind, 1) + ' m/s';
      log('Odczyt z godziny ' + String(c.time || '').slice(11, 16));
      var h = data.hourly;
      if (h && h.time && h.temperature_2m) {
        var from = 0, hour = String(c.time || '').slice(0, 13);
        for (var i = 0; i < h.time.length; i++) if (h.time[i].slice(0, 13) === hour) { from = i; break; }
        var times = h.time.slice(from, from + 25), temps = h.temperature_2m.slice(from, from + 25);
        chart(times, temps);
        log('Prognoza: ' + temps.length + ' godzin');
      } else chartEl.innerHTML = '';
    }
    function load() {
      linesEl.innerHTML = '';
      descEl.className = 'wx-desc';
      descEl.textContent = 'Łączenie...';
      log('Zapytanie do api.open-meteo.com');
      get(FULL).catch(function (err) {
        if (!/^HTTP 4/.test(err.message)) throw err;
        log('Ponawiam prostsze zapytanie');
        return get(BASIC);
      }).then(show).catch(fail);
    }
    if (btn) btn.addEventListener('click', load);
    load();
  })();

  /* ---------- szachy ---------- */
  try {
    if (window.MAChess) window.MAChess.initWidget($('#chess-mount'));
  } catch (e) { if (window.console) console.warn('Szachy:', e); }
})();
