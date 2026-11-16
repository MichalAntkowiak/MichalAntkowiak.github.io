/* Zespół 1 — rysunek aksonometryczny na żywo.
   Mały własny renderer WebGL, bez bibliotek:
   przebieg 1 zapisuje normalne, głębię i numer części, przebieg 2 wykrywa krawędzie
   i kreśli je tuszem; przekrój dostaje kreskowanie liczone w płaszczyźnie cięcia.
   Odnośniki (balony) i oś zespołu rysuje nakładka SVG. */
(function () {
  'use strict';

  var DEG = Math.PI / 180;

  /* ------------------------------------------------------------------ *
   *  Konfiguracja zespołu
   * ------------------------------------------------------------------ */
  // nazwa węzła w pliku .glb -> pozycja na liście części i przesunięcie w widoku rozstrzelonym [mm]
  function partFor(name) {
    var m = /^(\d+):\d+$/.exec(name || '');
    if (m) {
      var n = +m[1];
      var shift = { 1: 26, 2: 8, 3: -24, 4: -8 }[n];
      // wałek (4) zgodnie z zasadami rysunku pozostaje w widoku także na przekroju
      return { id: n, shift: shift === undefined ? 0 : shift, whole: n === 4 };
    }
    if (/ISO 1207/.test(name || '')) return { id: 5, shift: -40, whole: true };
    return { id: 6, shift: 0, whole: false };
  }

  /* ------------------------------------------------------------------ *
   *  Macierze 4x4 (kolumnami)
   * ------------------------------------------------------------------ */
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++)
      for (var r = 0; r < 4; r++)
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
  function fromTRS(t, q, s) {
    t = t || [0, 0, 0]; q = q || [0, 0, 0, 1]; s = s || [1, 1, 1];
    var x = q[0], y = q[1], z = q[2], w = q[3];
    return new Float32Array([
      (1 - 2 * (y * y + z * z)) * s[0], (2 * (x * y + z * w)) * s[0], (2 * (x * z - y * w)) * s[0], 0,
      (2 * (x * y - z * w)) * s[1], (1 - 2 * (x * x + z * z)) * s[1], (2 * (y * z + x * w)) * s[1], 0,
      (2 * (x * z + y * w)) * s[2], (2 * (y * z - x * w)) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0,
      t[0], t[1], t[2], 1
    ]);
  }
  function ortho(hw, hh, n, f) {
    return new Float32Array([1 / hw, 0, 0, 0, 0, 1 / hh, 0, 0, 0, 0, -2 / (f - n), 0, 0, 0, -(f + n) / (f - n), 1]);
  }

  /* ------------------------------------------------------------------ *
   *  Czytnik .glb (siatki z pozycjami i normalnymi, hierarchia węzłów)
   * ------------------------------------------------------------------ */
  function parseGLB(buf) {
    var dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('To nie jest plik .glb');
    var total = dv.getUint32(8, true), off = 12, json = null, bin = null;
    while (off < total) {
      var len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
      if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(buf, off + 8, len)));
      else if (type === 0x004E4942) bin = { off: off + 8, len: len };
      off += 8 + len;
    }
    if (!json || !bin) throw new Error('Niepełny plik .glb');
    var SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
    var COMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

    function read(i) {
      var a = json.accessors[i], bv = json.bufferViews[a.bufferView];
      var cs = SIZE[a.componentType], n = COMP[a.type];
      var stride = bv.byteStride || cs * n;
      var base = bin.off + (bv.byteOffset || 0) + (a.byteOffset || 0);
      var out = a.componentType === 5126 ? new Float32Array(a.count * n)
        : a.componentType === 5125 ? new Uint32Array(a.count * n)
          : new Uint16Array(a.count * n);
      for (var k = 0; k < a.count; k++)
        for (var j = 0; j < n; j++) {
          var p = base + k * stride + j * cs;
          out[k * n + j] = a.componentType === 5126 ? dv.getFloat32(p, true)
            : a.componentType === 5125 ? dv.getUint32(p, true)
              : a.componentType === 5123 ? dv.getUint16(p, true)
                : dv.getUint8(p);
        }
      return out;
    }

    var parts = [];
    function walk(ni, parent, top) {
      var node = json.nodes[ni];
      var local = node.matrix ? new Float32Array(node.matrix) : fromTRS(node.translation, node.rotation, node.scale);
      var world = mul(parent, local);
      if (node.mesh !== undefined) {
        json.meshes[node.mesh].primitives.forEach(function (pr) {
          if (pr.mode !== undefined && pr.mode !== 4) return;
          if (pr.attributes.POSITION === undefined || pr.attributes.NORMAL === undefined) return;
          var pos = read(pr.attributes.POSITION), nor = read(pr.attributes.NORMAL);
          var idx = pr.indices !== undefined ? read(pr.indices) : null;
          // zapiekamy transformację węzła: pozycje w milimetrach, normalne obrócone
          for (var k = 0; k < pos.length; k += 3) {
            var x = pos[k], y = pos[k + 1], z = pos[k + 2];
            pos[k] = (world[0] * x + world[4] * y + world[8] * z + world[12]) * 1000;
            pos[k + 1] = (world[1] * x + world[5] * y + world[9] * z + world[13]) * 1000;
            pos[k + 2] = (world[2] * x + world[6] * y + world[10] * z + world[14]) * 1000;
            var nx = nor[k], ny = nor[k + 1], nz = nor[k + 2];
            var ax = world[0] * nx + world[4] * ny + world[8] * nz;
            var ay = world[1] * nx + world[5] * ny + world[9] * nz;
            var az = world[2] * nx + world[6] * ny + world[10] * nz;
            var l = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
            nor[k] = ax / l; nor[k + 1] = ay / l; nor[k + 2] = az / l;
          }
          if (!idx) { idx = new Uint32Array(pos.length / 3); for (var q = 0; q < idx.length; q++) idx[q] = q; }
          parts.push({ name: top, pos: pos, nor: nor, idx: idx });
        });
      }
      (node.children || []).forEach(function (c) { walk(c, world, top); });
    }
    var scene = json.scenes[json.scene || 0];
    scene.nodes.forEach(function (ni) { walk(ni, ident(), json.nodes[ni].name || ''); });
    return parts;
  }

  /* ------------------------------------------------------------------ *
   *  Shadery
   * ------------------------------------------------------------------ */
  var PREC = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';

  var VS_GEO = [
    'attribute vec3 aPos; attribute vec3 aNor;',
    'uniform mat4 uPV; uniform mat4 uView; uniform mat3 uRot; uniform vec3 uOff;',
    'varying vec3 vN; varying vec3 vP;',
    'void main(){',
    '  vec4 w = vec4(aPos + uOff, 1.0);',
    '  vP = (uView * w).xyz;',
    '  vN = uRot * aNor;',
    '  gl_Position = uPV * w;',
    '}'
  ].join('\n');

  // uFlat = 0: normalna + kod części (kod + 16 = powierzchnia przekroju)
  // uFlat = 1: numer części + głębia w 16 bitach (mały podgląd do odnośników i wskazywania)
  var FS_GEO = PREC + [
    'uniform float uId; uniform float uClip; uniform vec4 uPlane; uniform float uFlat; uniform vec2 uNF;',
    'varying vec3 vN; varying vec3 vP;',
    'void main(){',
    '  if (uClip > 0.5 && dot(uPlane.xyz, vP) + uPlane.w > 0.0) discard;',
    '  bool cap = (!gl_FrontFacing) && uClip > 0.5;',
    '  if (uFlat > 0.5) {',
    '    float zv = vP.z;',
    '    if (cap) zv = -(uPlane.x * vP.x + uPlane.y * vP.y + uPlane.w) / uPlane.z;',
    '    float z = clamp((-zv - uNF.x) / (uNF.y - uNF.x), 0.0, 1.0) * 65535.0;',
    '    float hi = floor(z / 256.0);',
    '    gl_FragColor = vec4(uId / 255.0, hi / 255.0, (z - hi * 256.0) / 255.0, 1.0);',
    '    return;',
    '  }',
    '  vec3 n = normalize(vN);',
    '  float code = uId;',
    '  if (cap) { n = uPlane.xyz; code += 16.0; }',
    '  else if (!gl_FrontFacing) n = -n;',
    '  gl_FragColor = vec4(n * 0.5 + 0.5, code / 255.0);',
    '}'
  ].join('\n');

  var VS_INK = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }';

  var FS_INK = PREC + [
    'uniform sampler2D tData; uniform sampler2D tDepth;',
    'uniform vec2 uTexel; uniform float uRo; uniform float uRi; uniform float uDepthMM;',
    'uniform vec3 uInk; uniform vec3 uInkHot; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uMark; uniform vec3 uCutFill;',
    'uniform float uHover; uniform vec3 uLight; uniform vec2 uHalf;',
    'uniform vec4 uPlane; uniform vec3 uU; uniform vec3 uV; uniform vec3 uO;',
    'uniform float uPxPerMM; uniform float uHatchW; uniform float uInner;',
    'varying vec2 vUv;',
    'float code(vec4 c){ return floor(c.a * 255.0 + 0.5); }',
    'void main(){',
    '  vec4 c = texture2D(tData, vUv);',
    '  float k = code(c);',
    '  float id = mod(k, 16.0);',
    '  float cut = step(15.5, k);',
    '  vec3 n = normalize(c.rgb * 2.0 - 1.0);',
    '  float d = texture2D(tDepth, vUv).r;',
    '  float eo = 0.0; float ei = 0.0; float lap = 0.0;',
    '  for (int i = 0; i < 8; i++) {',
    '    float a = float(i) * 0.7853981634;',
    '    vec2 dir = vec2(cos(a), sin(a));',
    '    vec4 so = texture2D(tData, vUv + dir * uTexel * uRo);',
    '    eo = max(eo, step(0.5, abs(code(so) - k)));',
    '    vec2 oi = dir * uTexel * uRi;',
    '    vec4 si = texture2D(tData, vUv + oi);',
    '    ei = max(ei, 1.0 - dot(n, normalize(si.rgb * 2.0 - 1.0)));',
    '    lap += texture2D(tDepth, vUv + oi).r - d;',
    '  }',
    '  float eN = smoothstep(0.05, 0.2, ei);',
    '  float eD = smoothstep(0.1, 0.24, abs(lap) * uDepthMM * 0.25);',
    '  if (cut > 0.5) { eN = 0.0; eD = 0.0; }',
    '  float edge = max(eo, max(eN, eD) * uInner);',
    '  float inside = step(0.5, id);',
    '  float lam = smoothstep(0.1, 0.95, clamp(dot(n, uLight), 0.0, 1.0));',
    '  float hot = 1.0 - step(0.5, abs(id - uHover));',
    '  vec3 fill = mix(mix(uShade, uLit, lam), uMark * mix(0.88, 1.0, lam), hot);',
    '  vec3 ink = mix(uInk, uInkHot, hot);',
    '  if (cut > 0.5) {',
    '    vec2 xy = (vUv * 2.0 - 1.0) * uHalf;',
    '    float z = -(uPlane.x * xy.x + uPlane.y * xy.y + uPlane.w) / uPlane.z;',
    '    vec3 p = vec3(xy, z) - uO;',
    '    float s = abs(id - 3.0) < 0.5 ? -1.0 : 1.0;',
    '    float sp = abs(id - 2.0) < 0.5 ? 0.9 : 1.3;',
    '    float t = (dot(p, uU) + s * dot(p, uV)) * 0.70710678 / sp;',
    '    float ft = fract(t);',
    '    float dpx = min(ft, 1.0 - ft) * sp * uPxPerMM;',
    '    float h = 1.0 - smoothstep(uHatchW * 0.5 - 0.6, uHatchW * 0.5 + 0.6, dpx);',
    '    fill = mix(mix(uCutFill, uMark, hot), ink, h);',
    '  }',
    '  vec3 col = mix(fill, ink, edge);',
    '  float alpha = max(inside, edge);',
    '  gl_FragColor = vec4(col * alpha, alpha);',
    '}'
  ].join('\n');

  /* ------------------------------------------------------------------ *
   *  Widok
   * ------------------------------------------------------------------ */
  function init(root, opts) {
    opts = opts || {};
    var stage = root.querySelector('[data-zesp="stage"]');
    var canvas = stage.querySelector('canvas');
    var svg = stage.querySelector('svg');
    var msg = stage.querySelector('[data-zesp="msg"]');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function fail(text) {
      root.classList.add('is-static');
      if (msg) msg.textContent = text || '';
      if (opts.onfail) opts.onfail();
    }

    var gl = null, isGL2 = false;
    var ctxOpts = { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true };
    try {
      gl = canvas.getContext('webgl2', ctxOpts);
      isGL2 = !!gl;
      if (!gl) {
        gl = canvas.getContext('webgl', ctxOpts) || canvas.getContext('experimental-webgl', ctxOpts);
        if (gl) {
          if (!gl.getExtension('WEBGL_depth_texture')) gl = null;
          else gl.getExtension('OES_element_index_uint');
        }
      }
    } catch (e) { gl = null; }
    if (!gl) { fail('Ta przeglądarka nie obsługuje WebGL, dlatego model jest pokazany jako nieruchomy rysunek.'); return null; }

    /* ---- stan ---- */
    var S = {
      az: -38 * DEG, el: 24 * DEG,
      explode: reduce ? 1 : 0, explodeTo: 1,
      cut: 0, cutTo: 0,
      hover: 0, pinned: 0, mode: 'rozstrzelony',
      w: 0, h: 0, ss: 2,
      ready: false, lost: false, hold: 0
    };
    var parts = [], shiftOf = {};
    var boxA = null, boxE = null;               // obrys złożenia i widoku rozstrzelonego
    var res = {};                               // zasoby GL
    var idBuf = null, idW = 0, idH = 0;         // podgląd numerów części
    var idStale = true, idTime = 0, extentL = 60, shownL = 0;
    var anchors = {}, balloons = {}, axisLine = null, U = 1;   // U: skala odnośników (1 = 16 px pisma podstawowego)
    var needGeo = true, needInk = true, raf = 0, lastT = 0;
    var colors = {};

    function readColors() {
      var cs = getComputedStyle(root);
      function col(name, fb) {
        var v = (cs.getPropertyValue(name) || '').trim();
        var m = /^#([0-9a-f]{6})$/i.exec(v) || /^#([0-9a-f]{6})$/i.exec(fb);
        var n = parseInt(m[1], 16);
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
      }
      colors.ink = col('--zesp-ink', '#14171a');
      colors.hot = col('--zesp-hot', '#14171a');
      colors.lit = col('--zesp-lit', '#fbfcfb');
      colors.shade = col('--zesp-shade', '#d3d9d8');
      colors.mark = col('--zesp-mark', '#ffe84d');
      colors.cut = col('--zesp-cut', '#fbfcfb');
    }

    /* ---- GL: programy, bufory ---- */
    function shader(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    }
    function program(vs, fs, attribs) {
      var p = gl.createProgram();
      gl.attachShader(p, shader(gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
      attribs.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); });
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
      var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
      return { p: p, u: u };
    }
    function buildGL() {
      res = {};
      res.geo = program(VS_GEO, FS_GEO, ['aPos', 'aNor']);
      res.ink = program(VS_INK, FS_INK, ['aPos']);
      res.tri = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, res.tri);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      parts.forEach(function (pt) {
        pt.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pt.vbo); gl.bufferData(gl.ARRAY_BUFFER, pt.pos, gl.STATIC_DRAW);
        pt.nbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pt.nbo); gl.bufferData(gl.ARRAY_BUFFER, pt.nor, gl.STATIC_DRAW);
        pt.ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pt.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, pt.idx, gl.STATIC_DRAW);
        pt.itype = pt.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      });
    }
    function tex(w, h, internal, format, type) {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    function buildTargets() {
      if (res.fbo) { gl.deleteFramebuffer(res.fbo); gl.deleteTexture(res.data); gl.deleteTexture(res.depth); }
      if (res.idFbo) { gl.deleteFramebuffer(res.idFbo); gl.deleteTexture(res.idTex); gl.deleteRenderbuffer(res.idDepth); }
      var W = canvas.width, H = canvas.height;
      res.data = tex(W, H, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
      res.depth = isGL2 ? tex(W, H, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT)
        : tex(W, H, gl.DEPTH_COMPONENT, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
      res.fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, res.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, res.data, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, res.depth, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo');

      idW = Math.max(64, Math.round(Math.min(240, S.w / 2.6)));
      idH = Math.max(48, Math.round(idW * S.h / S.w));
      idBuf = new Uint8Array(idW * idH * 4);
      res.idTex = tex(idW, idH, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
      res.idDepth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, res.idDepth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, idW, idH);
      res.idFbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, res.idFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, res.idTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, res.idDepth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      idStale = true;
    }

    /* ---- rozmiar ---- */
    function resize() {
      var r = stage.getBoundingClientRect();
      var w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h) return;
      var dpr = window.devicePixelRatio || 1;
      var ss = Math.min(Math.max(2, dpr * 1.5), 4);         // nadpróbkowanie wygładza kreskę
      ss = Math.min(ss, 2600 / Math.max(w, h));
      if (w === S.w && h === S.h && ss === S.ss && res.fbo) return;
      S.w = w; S.h = h; S.ss = ss;
      U = (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16;
      Object.keys(balloons).forEach(function (k) { balloons[k].ring.setAttribute('r', 13 * U); balloons[k].dot.setAttribute('r', 2.5 * U); });
      canvas.width = Math.round(w * ss); canvas.height = Math.round(h * ss);
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      if (S.ready && !S.lost) { buildTargets(); needGeo = true; request(); }
    }

    /* ---- kamera (rzut równoległy) ---- */
    var cam = { V: ident(), PV: ident(), hw: 1, hh: 1, near: 0, far: 1, xc: [1, 0, 0], yc: [0, 1, 0], zc: [0, 0, 1], T: [0, 0, 0] };
    function lerp(a, b, t) { return a + (b - a) * t; }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function updateCamera() {
      var e = ease(S.explode);
      var sa = Math.sin(S.az), ca = Math.cos(S.az), se = Math.sin(S.el), ce = Math.cos(S.el);
      var xc = [ca, 0, -sa], yc = [-se * sa, ce, -se * ca], zc = [ce * sa, se, ce * ca];
      var T = [lerp(boxA.c[0], boxE.c[0], e), lerp(boxA.c[1], boxE.c[1], e), lerp(boxA.c[2], boxE.c[2], e)];
      function half(b) {                                   // pół-wymiary rzutu obrysu na ekran
        return [Math.abs(xc[0]) * b.h[0] + Math.abs(xc[1]) * b.h[1] + Math.abs(xc[2]) * b.h[2],
          Math.abs(yc[0]) * b.h[0] + Math.abs(yc[1]) * b.h[1] + Math.abs(yc[2]) * b.h[2]];
      }
      var hA = half(boxA), hE = half(boxE);
      var needW = lerp(hA[0], hE[0], e), needH = lerp(hA[1], hE[1], e);
      var aspect = S.w / S.h;
      var hh = Math.max(needH * 1.3, needW * 1.12 / aspect);    // zapas na odnośniki
      hh = Math.max(hh, lerp(boxA.r, boxE.r, e) * 0.6);
      var hw = hh * aspect;
      var R = boxE.r * 1.5, D = R * 2;
      var eye = [T[0] + zc[0] * D, T[1] + zc[1] * D, T[2] + zc[2] * D];
      cam.V = new Float32Array([
        xc[0], yc[0], zc[0], 0, xc[1], yc[1], zc[1], 0, xc[2], yc[2], zc[2], 0,
        -(xc[0] * eye[0] + xc[1] * eye[1] + xc[2] * eye[2]),
        -(yc[0] * eye[0] + yc[1] * eye[1] + yc[2] * eye[2]) - hh * 0.09,   // model nieco poniżej środka
        -(zc[0] * eye[0] + zc[1] * eye[1] + zc[2] * eye[2]), 1
      ]);
      cam.near = D - R; cam.far = D + R;
      cam.PV = mul(ortho(hw, hh, cam.near, cam.far), cam.V);
      cam.hw = hw; cam.hh = hh; cam.xc = xc; cam.yc = yc; cam.zc = zc; cam.T = T;
    }
    function project(p) {                                   // świat [mm] -> piksele CSS
      var m = cam.PV;
      var x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
      var y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
      return [(x * 0.5 + 0.5) * S.w, (1 - (y * 0.5 + 0.5)) * S.h];
    }
    function unproject(bx, by, z01) {                       // piksel podglądu + głębia -> świat [mm]
      var V = cam.V;
      var xv = ((bx + 0.5) / idW * 2 - 1) * cam.hw - V[12];
      var yv = ((by + 0.5) / idH * 2 - 1) * cam.hh - V[13];
      var zv = -(cam.near + z01 * (cam.far - cam.near)) - V[14];
      return [cam.xc[0] * xv + cam.yc[0] * yv + cam.zc[0] * zv,
        cam.xc[1] * xv + cam.yc[1] * yv + cam.zc[1] * zv,
        cam.xc[2] * xv + cam.yc[2] * yv + cam.zc[2] * zv];
    }

    /* ---- płaszczyzna przekroju przez oś zespołu, zawsze od strony patrzącego ---- */
    var plane = { v: [0, 0, 1, 0], U: [1, 0, 0], Vv: [0, 1, 0], O: [0, 0, 0], on: false };
    function updatePlane() {
      plane.on = S.cut > 0.001;
      var side = cam.zc[2] >= 0 ? 1 : -1;
      var c = lerp(13, 0, ease(S.cut));                     // 13 mm: poza obrysem zespołu
      var V = cam.V, z0 = boxA.axis[2];
      var nv = [V[8] * side, V[9] * side, V[10] * side];
      plane.v = [nv[0], nv[1], nv[2], -(nv[0] * V[12] + nv[1] * V[13] + nv[2] * V[14]) - c - z0 * side];
      plane.U = [V[0], V[1], V[2]];
      plane.Vv = [V[4], V[5], V[6]];
      var zc = z0 + c * side;
      plane.O = [V[8] * zc + V[12], V[9] * zc + V[13], V[10] * zc + V[14]];
    }

    /* ---- rysowanie ---- */
    function drawParts(flat) {
      var g = res.geo, V = cam.V;
      gl.useProgram(g.p);
      gl.uniformMatrix4fv(g.u.uPV, false, cam.PV);
      gl.uniformMatrix4fv(g.u.uView, false, V);
      gl.uniformMatrix3fv(g.u.uRot, false, new Float32Array([V[0], V[1], V[2], V[4], V[5], V[6], V[8], V[9], V[10]]));
      gl.uniform4fv(g.u.uPlane, plane.v);
      gl.uniform2f(g.u.uNF, cam.near, cam.far);
      gl.uniform1f(g.u.uFlat, flat ? 1 : 0);
      gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1);
      var e = ease(S.explode);
      parts.forEach(function (pt) {
        var clip = plane.on && !pt.whole;
        if (clip) gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE);
        gl.uniform1f(g.u.uClip, clip ? 1 : 0);
        gl.uniform1f(g.u.uId, pt.id);
        gl.uniform3f(g.u.uOff, pt.shift * e, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, pt.vbo); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, pt.nbo); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pt.ibo);
        gl.drawElements(gl.TRIANGLES, pt.idx.length, pt.itype, 0);
      });
      gl.disableVertexAttribArray(1);
    }
    function geoState() {
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
      gl.frontFace(gl.CCW); gl.cullFace(gl.BACK); gl.clearDepth(1);
    }
    function passData() {
      updateCamera(); updatePlane();
      geoState();
      gl.bindFramebuffer(gl.FRAMEBUFFER, res.fbo);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.5, 0.5, 1, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      drawParts(false);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      idStale = true;
    }
    function passId() {
      geoState();
      gl.bindFramebuffer(gl.FRAMEBUFFER, res.idFbo);
      gl.viewport(0, 0, idW, idH);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      drawParts(true);
      gl.readPixels(0, 0, idW, idH, gl.RGBA, gl.UNSIGNED_BYTE, idBuf);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      idStale = false;
      analyse();
    }
    function passInk() {
      var k = res.ink;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(k.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, res.data); gl.uniform1i(k.u.tData, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, res.depth); gl.uniform1i(k.u.tDepth, 1);
      gl.uniform2f(k.u.uTexel, 1 / canvas.width, 1 / canvas.height);
      gl.uniform1f(k.u.uRo, 0.8 * S.ss);
      gl.uniform1f(k.u.uRi, 0.5 * S.ss);
      gl.uniform1f(k.u.uInner, 0.92);
      gl.uniform1f(k.u.uDepthMM, cam.far - cam.near);
      gl.uniform3fv(k.u.uInk, colors.ink); gl.uniform3fv(k.u.uInkHot, colors.hot); gl.uniform3fv(k.u.uLit, colors.lit); gl.uniform3fv(k.u.uShade, colors.shade);
      gl.uniform3fv(k.u.uMark, colors.mark); gl.uniform3fv(k.u.uCutFill, colors.cut);
      gl.uniform1f(k.u.uHover, S.hover || S.pinned || -1);
      gl.uniform3f(k.u.uLight, -0.42, 0.55, 0.72);
      gl.uniform2f(k.u.uHalf, cam.hw, cam.hh);
      gl.uniform4fv(k.u.uPlane, plane.v);
      gl.uniform3fv(k.u.uU, plane.U); gl.uniform3fv(k.u.uV, plane.Vv); gl.uniform3fv(k.u.uO, plane.O);
      gl.uniform1f(k.u.uPxPerMM, canvas.height / (2 * cam.hh));
      gl.uniform1f(k.u.uHatchW, 0.7 * S.ss);
      gl.bindBuffer(gl.ARRAY_BUFFER, res.tri);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /* ---- odnośniki (balony) ---- */
    var NS = 'http://www.w3.org/2000/svg';
    function el(name, attrs, parent) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function buildBalloons() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      axisLine = el('line', { 'class': 'zesp-axis' }, svg);
      balloons = {}; anchors = {};
      var seen = {};
      parts.forEach(function (pt) {
        if (seen[pt.id]) return; seen[pt.id] = true;
        var id = pt.id;
        var g = el('g', { 'class': 'zesp-balloon', 'data-id': id }, svg);
        var b = { g: g, id: id, x: 0, y: 0, shown: false };
        b.line = el('line', {}, g);
        b.dot = el('circle', { r: 2.5 * U, 'class': 'zesp-dot' }, g);
        b.ring = el('circle', { r: 13 * U, 'class': 'zesp-ring' }, g);
        b.text = el('text', { 'text-anchor': 'middle', dy: '0.35em' }, g);
        b.text.textContent = String(id);
        balloons[id] = b;
        g.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') setHover(id); });
        g.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse') setHover(0); });
        g.addEventListener('click', function () { if (opts.onpick) opts.onpick(id); });
      });
    }

    // Podgląd numerów części mówi, co naprawdę widać. Punkt zaczepienia odnośnika
    // zostaje przyklejony do części, dopóki jest widoczny; gdy zniknie, wybieramy nowy
    // w pobliżu środka widocznego fragmentu.
    function analyse() {
      var e = ease(S.explode);
      var n = {}, sx = {}, sy = {}, id, x, y, o;
      for (y = 0; y < idH; y++) for (x = 0; x < idW; x++) {
        id = idBuf[(y * idW + x) * 4];
        if (!id) continue;
        if (!n[id]) { n[id] = 0; sx[id] = 0; sy[id] = 0; }
        n[id]++; sx[id] += x; sy[id] += y;
      }
      function at(px, py) { return px < 0 || py < 0 || px >= idW || py >= idH ? 0 : idBuf[(py * idW + px) * 4]; }
      Object.keys(balloons).forEach(function (k) {
        id = +k;
        var a = anchors[id];
        if (!n[id] || n[id] < 4) { if (a) a.visible = false; return; }
        if (a && a.p) {                                      // czy dotychczasowy punkt nadal widać?
          var s = project([a.p[0] + shiftOf[id] * e, a.p[1], a.p[2]]);
          var bx = Math.floor(s[0] / S.w * idW), by = Math.floor((1 - s[1] / S.h) * idH);
          if (at(bx, by) === id && at(bx - 1, by) === id && at(bx + 1, by) === id && at(bx, by - 1) === id && at(bx, by + 1) === id) { a.visible = true; return; }
        }
        var cx = sx[id] / n[id], cy = sy[id] / n[id], best = null, bd = 1e9, loose = null, ld = 1e9;
        for (y = 0; y < idH; y++) for (x = 0; x < idW; x++) {
          if (idBuf[(y * idW + x) * 4] !== id) continue;
          var d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          if (d < ld) { ld = d; loose = [x, y]; }
          if (d < bd && at(x - 2, y) === id && at(x + 2, y) === id && at(x, y - 2) === id && at(x, y + 2) === id) { bd = d; best = [x, y]; }
        }
        best = best || loose;
        o = (best[1] * idW + best[0]) * 4;
        var w = unproject(best[0], best[1], (idBuf[o + 1] * 256 + idBuf[o + 2]) / 65535);
        if (!a) a = anchors[id] = { x: 0, y: 0, fresh: true };
        a.p = [w[0] - shiftOf[id] * e, w[1], w[2]];
        a.visible = true; a.glued = false;
      });
      // jak daleko od osi sięga obrys (do ustawienia rzędu odnośników)
      var d2 = rowDir(), C = project(cam.T), m = 0, kx = S.w / idW, ky = S.h / idH;
      for (y = 0; y < idH; y += 2) for (x = 0; x < idW; x += 2) {
        if (!idBuf[(y * idW + x) * 4]) continue;
        var dd = ((x + 0.5) * kx - C[0]) * d2.px + (S.h - (y + 0.5) * ky - C[1]) * d2.py;
        if (dd > m) m = dd;
      }
      extentL = m + 32 * U;
    }
    function rowDir() {
      // kierunek osi zespołu na ekranie i prostopadła "w górę"; gdy oś jest mocno skrócona, rząd układa się poziomo
      var ax = cam.xc[0], ay = -cam.yc[0];
      var al = Math.sqrt(ax * ax + ay * ay);
      var ux = al > 1e-4 ? ax / al : 1, uy = al > 1e-4 ? ay / al : 0;
      if (ux < 0) { ux = -ux; uy = -uy; }
      var w = Math.min(1, Math.max(0, (al - 0.25) / 0.3));
      var px = uy * w, py = -ux * w - (1 - w);
      var pl = Math.sqrt(px * px + py * py) || 1; px /= pl; py /= pl;
      return { ux: -py, uy: px, px: px, py: py };
    }

    function layout(snap) {
      var e = ease(S.explode), moving = false;
      var C = project(cam.T), d = rowDir();
      if (snap || !shownL) shownL = extentL;
      else { if (Math.abs(shownL - extentL) > 0.5) moving = true; shownL = lerp(shownL, extentL, 0.22); }

      var list = [];
      Object.keys(balloons).forEach(function (k) {
        var b = balloons[k], a = anchors[k];
        b.want = !!(a && a.visible);
        if (!b.want) return;
        var s = project([a.p[0] + shiftOf[k] * e, a.p[1], a.p[2]]);
        if (a.glued || a.fresh || snap) { a.x = s[0]; a.y = s[1]; a.glued = true; a.fresh = false; }
        else {                                               // punkt właśnie się zmienił: dojeżdżamy płynnie
          a.x = lerp(a.x, s[0], 0.3); a.y = lerp(a.y, s[1], 0.3);
          if (Math.abs(a.x - s[0]) + Math.abs(a.y - s[1]) < 0.8) a.glued = true; else moving = true;
        }
        b.t = (a.x - C[0]) * d.ux + (a.y - C[1]) * d.uy;
        list.push(b);
      });
      list.sort(function (p, q) { return p.t - q.t; });
      var gap = 36 * U, mean = 0, m2 = 0, i;
      var pos = list.map(function (b) { mean += b.t; return b.t; });
      for (i = 1; i < pos.length; i++) if (pos[i] < pos[i - 1] + gap) pos[i] = pos[i - 1] + gap;
      pos.forEach(function (p) { m2 += p; });
      mean /= list.length || 1; m2 /= list.length || 1;
      list.forEach(function (b, j) {
        var t = pos[j] - m2 + mean;
        var bx = Math.min(S.w - 15 * U, Math.max(15 * U, C[0] + d.ux * t + d.px * shownL));
        var by = Math.min(S.h - 15 * U, Math.max(15 * U, C[1] + d.uy * t + d.py * shownL));
        if (!b.shown || snap) { b.x = bx; b.y = by; }
        else {
          if (Math.abs(b.x - bx) + Math.abs(b.y - by) > 0.6) moving = true;
          b.x = lerp(b.x, bx, 0.3); b.y = lerp(b.y, by, 0.3);
        }
      });
      Object.keys(balloons).forEach(function (k) {
        var b = balloons[k];
        if (!b.want) { if (b.shown) { b.g.style.opacity = 0; b.shown = false; } return; }
        var a = anchors[k];
        var dx = a.x - b.x, dy = a.y - b.y, dl = Math.sqrt(dx * dx + dy * dy) || 1;
        b.line.setAttribute('x1', (b.x + dx / dl * 13 * U).toFixed(1)); b.line.setAttribute('y1', (b.y + dy / dl * 13 * U).toFixed(1));
        b.line.setAttribute('x2', a.x.toFixed(1)); b.line.setAttribute('y2', a.y.toFixed(1));
        b.dot.setAttribute('cx', a.x.toFixed(1)); b.dot.setAttribute('cy', a.y.toFixed(1));
        b.ring.setAttribute('cx', b.x.toFixed(1)); b.ring.setAttribute('cy', b.y.toFixed(1));
        b.text.setAttribute('x', b.x.toFixed(1)); b.text.setAttribute('y', b.y.toFixed(1));
        if (!b.shown) { b.g.style.opacity = 1; b.shown = true; }
      });
      // oś zespołu (linia punktowa) w widoku rozstrzelonym
      if (e > 0.02) {
        var ax = boxA.axis, a1 = project([boxE.c[0] - boxE.h[0] - 5, ax[1], ax[2]]), a2 = project([boxE.c[0] + boxE.h[0] + 5, ax[1], ax[2]]);
        axisLine.setAttribute('x1', a1[0].toFixed(1)); axisLine.setAttribute('y1', a1[1].toFixed(1));
        axisLine.setAttribute('x2', a2[0].toFixed(1)); axisLine.setAttribute('y2', a2[1].toFixed(1));
        axisLine.style.opacity = Math.min(1, e * 1.5);
      } else axisLine.style.opacity = 0;
      return moving;
    }

    /* ---- pętla: rysujemy tylko wtedy, gdy coś się zmienia ---- */
    function request() { if (!raf && S.ready && !S.lost) raf = requestAnimationFrame(frame); }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016); lastT = now;
      var busy = false;
      function step(key, to, dur) {
        if (S[key] === to) return;
        var dd = dt / dur;
        S[key] = S[key] < to ? Math.min(to, S[key] + dd) : Math.max(to, S[key] - dd);
        busy = true; needGeo = true;
      }
      if (now < S.hold) busy = true;
      else { step('explode', S.explodeTo, 1.25); step('cut', S.cutTo, 0.9); }
      if (needGeo) { passData(); needInk = true; needGeo = false; }
      if (idStale) { if (now - idTime > 90) { passId(); idTime = now; } else busy = true; }
      if (layout(false)) busy = true;
      if (needInk) { passInk(); needInk = false; }
      if (busy) request(); else lastT = 0;
    }

    function mark() {
      var on = S.hover || S.pinned;
      Object.keys(balloons).forEach(function (k) { balloons[k].g.classList.toggle('is-on', +k === on); });
    }
    function setHover(id) {
      if (S.hover === id) return;
      S.hover = id; needInk = true; request(); mark();
      if (opts.onhover) opts.onhover(id || S.pinned);
    }
    function idAt(clientX, clientY) {
      if (!idBuf) return 0;
      var r = canvas.getBoundingClientRect();
      var x = Math.floor((clientX - r.left) / r.width * idW), y = Math.floor((1 - (clientY - r.top) / r.height) * idH);
      if (x < 0 || y < 0 || x >= idW || y >= idH) return 0;
      return idBuf[(y * idW + x) * 4];
    }

    /* ---- wskaźnik i klawiatura ---- */
    var drag = null;
    canvas.addEventListener('pointerdown', function (ev) {
      if (ev.button) return;
      drag = { x: ev.clientX, y: ev.clientY, moved: 0, id: ev.pointerId };
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) { }
      root.classList.add('is-drag');
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (drag && ev.pointerId === drag.id) {
        var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
        drag.x = ev.clientX; drag.y = ev.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
        S.az -= dx * 0.0085;
        S.el = Math.max(-80 * DEG, Math.min(80 * DEG, S.el + dy * 0.0085));
        needGeo = true; request();
        if (drag.moved > 6) root.classList.add('is-touched');
      } else if (ev.pointerType === 'mouse') setHover(idAt(ev.clientX, ev.clientY));
    });
    function endDrag(ev) {
      if (!drag || ev.pointerId !== drag.id) return;
      var tap = drag.moved < 6;
      drag = null; root.classList.remove('is-drag');
      if (!tap || ev.type !== 'pointerup') return;
      var id = idAt(ev.clientX, ev.clientY);
      if (ev.pointerType === 'mouse') { if (id && opts.onpick) opts.onpick(id); return; }
      S.pinned = S.pinned === id ? 0 : id; needInk = true; request(); mark();
      if (opts.onhover) opts.onhover(S.pinned);
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', function (ev) { if (!drag && ev.pointerType === 'mouse') setHover(0); });
    canvas.addEventListener('keydown', function (ev) {
      var k = ev.key, st = 12 * DEG;
      if (k === 'ArrowLeft') S.az += st; else if (k === 'ArrowRight') S.az -= st;
      else if (k === 'ArrowUp') S.el = Math.min(80 * DEG, S.el + st); else if (k === 'ArrowDown') S.el = Math.max(-80 * DEG, S.el - st);
      else return;
      ev.preventDefault(); needGeo = true; request(); root.classList.add('is-touched');
    });

    canvas.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); S.lost = true; if (raf) cancelAnimationFrame(raf); raf = 0; });
    canvas.addEventListener('webglcontextrestored', function () {
      try { buildGL(); S.lost = false; buildTargets(); needGeo = true; request(); }
      catch (e) { fail('Nie udało się odtworzyć widoku 3D.'); }
    });

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);

    /* ---- wczytanie modelu ---- */
    function boxOf(list, e) {
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      list.forEach(function (pt) {
        for (var k = 0; k < pt.pos.length; k += 3) {
          var x = pt.pos[k] + pt.shift * e, y = pt.pos[k + 1], z = pt.pos[k + 2];
          if (x < mn[0]) mn[0] = x; if (x > mx[0]) mx[0] = x;
          if (y < mn[1]) mn[1] = y; if (y > mx[1]) mx[1] = y;
          if (z < mn[2]) mn[2] = z; if (z > mx[2]) mx[2] = z;
        }
      });
      var c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
      var h = [(mx[0] - mn[0]) / 2, (mx[1] - mn[1]) / 2, (mx[2] - mn[2]) / 2];
      return { c: c, h: h, r: Math.sqrt(h[0] * h[0] + h[1] * h[1] + h[2] * h[2]) };
    }
    function start() {
      readColors();
      buildGL();
      S.ready = true;
      S.w = 0; resize();
      buildBalloons();
      passData(); passId(); layout(true); passInk();
      needGeo = false; needInk = false;
      root.classList.add('is-ready');
      if (msg) msg.textContent = '';
      S.hold = reduce ? 0 : performance.now() + 700;
      request();
      if (opts.onready) opts.onready();
    }

    fetch(opts.src).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.arrayBuffer();
    }).then(function (buf) {
      parts = parseGLB(buf).map(function (m) {
        var info = partFor(m.name);
        m.id = info.id; m.shift = info.shift; m.whole = info.whole;
        shiftOf[m.id] = info.shift;
        return m;
      });
      if (!parts.length) throw new Error('Pusty model');
      boxA = boxOf(parts, 0); boxE = boxOf(parts, 1);
      var shaft = parts.filter(function (p) { return p.id === 4; });      // oś wałka = oś zespołu
      boxA.axis = (shaft.length ? boxOf(shaft, 0) : boxA).c;
      start();
    }).catch(function (err) {
      if (window.console) console.warn('Zespół 1:', err);
      fail('Nie udało się wczytać modelu 3D, dlatego jest pokazany jako nieruchomy rysunek.');
    });

    /* ---- API ---- */
    return window.Zespol.instance = {
      setMode: function (mode) {
        S.mode = mode; S.hold = 0;
        S.explodeTo = mode === 'rozstrzelony' ? 1 : 0;
        S.cutTo = mode === 'przekroj' ? 1 : 0;
        if (reduce) { S.explode = S.explodeTo; S.cut = S.cutTo; needGeo = true; }
        request();
      },
      highlight: function (id) {
        S.hover = id || 0; needInk = true; request(); mark();
      },
      snap: function () {
        S.hold = 0; S.explode = S.explodeTo; S.cut = S.cutTo;
        if (S.ready && !S.lost) { passData(); passId(); layout(true); passInk(); needGeo = false; needInk = false; }
      },
      recolor: function () { readColors(); needInk = true; request(); },
      state: S
    };
  }

  window.Zespol = { init: init };
})();
