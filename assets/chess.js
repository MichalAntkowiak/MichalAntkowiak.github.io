/* MA//CHESS — silnik szachowy (JS reimplementacja koncepcji z ChessEngine_1, C++).
   Minimax D2 (negamax + alpha-beta), pełna legalność ruchów (kontrola szacha),
   detekcja mata/pata, system anty-repetycji. Bez roszady i bicia w przelocie,
   promocja zawsze na hetmana — świadome uproszczenie wersji demo.
   Zero zależności od DOM w warstwie logiki -> testowalne w Node. */
(function (root) {
  'use strict';

  const WHITE = 'w', BLACK = 'b';
  const opp = c => (c === WHITE ? BLACK : WHITE);

  /* ---------- plansza ---------- */
  function createInitialBoard() {
    const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let c = 0; c < 8; c++) {
      b[0][c] = BLACK + back[c];
      b[1][c] = BLACK + 'P';
      b[6][c] = WHITE + 'P';
      b[7][c] = WHITE + back[c];
    }
    return b;
  }
  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const colorOf = p => (p ? p[0] : null);
  const typeOf = p => (p ? p[1] : null);
  const cloneBoard = b => b.map(row => row.slice());

  /* ---------- generowanie ruchów (pseudo-legalne, bez uwzględnienia szacha) ---------- */
  const KNIGHT_D = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KING_D = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const BISHOP_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const ROOK_D = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function raySquares(board, r, c, dirs, stopAtFirst) {
    const out = [];
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (inBounds(rr, cc)) {
        out.push([rr, cc]);
        if (board[rr][cc]) break; // ray zablokowany, ale kwadrat blokera jest "widziany"
        rr += dr; cc += dc;
      }
    }
    return out;
  }

  /* Kwadraty ATAKOWANE przez figurę na (r,c) — niezależnie od tego czy są zajęte
     (potrzebne do wykrycia szacha; dla pionka atak != ruch). */
  function attackSquares(board, r, c) {
    const p = board[r][c];
    if (!p) return [];
    const col = colorOf(p), t = typeOf(p);
    if (t === 'P') {
      const dir = col === WHITE ? -1 : 1;
      return [[r + dir, c - 1], [r + dir, c + 1]].filter(([rr, cc]) => inBounds(rr, cc));
    }
    if (t === 'N') return KNIGHT_D.map(([dr, dc]) => [r + dr, c + dc]).filter(([rr, cc]) => inBounds(rr, cc));
    if (t === 'K') return KING_D.map(([dr, dc]) => [r + dr, c + dc]).filter(([rr, cc]) => inBounds(rr, cc));
    if (t === 'B') return raySquares(board, r, c, BISHOP_D);
    if (t === 'R') return raySquares(board, r, c, ROOK_D);
    if (t === 'Q') return raySquares(board, r, c, BISHOP_D.concat(ROOK_D));
    return [];
  }

  function isSquareAttacked(board, r, c, byColor) {
    for (let rr = 0; rr < 8; rr++)
      for (let cc = 0; cc < 8; cc++) {
        const p = board[rr][cc];
        if (p && colorOf(p) === byColor) {
          const atk = attackSquares(board, rr, cc);
          for (const [ar, ac] of atk) if (ar === r && ac === c) return true;
        }
      }
    return false;
  }

  function findKing(board, color) {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c] === color + 'K') return [r, c];
    return null;
  }

  /* Pseudo-legalne RUCHY (dla pionka: krok/dwa do przodu tylko na puste,
     bicie po skosie tylko gdy jest tam przeciwnik). Brak roszady/en passant. */
  function pseudoMoves(board, r, c) {
    const p = board[r][c];
    if (!p) return [];
    const col = colorOf(p), t = typeOf(p);
    const moves = [];
    const pushIfOk = (rr, cc) => {
      if (!inBounds(rr, cc)) return;
      const target = board[rr][cc];
      if (!target || colorOf(target) !== col) moves.push([rr, cc]);
    };
    if (t === 'P') {
      const dir = col === WHITE ? -1 : 1;
      const startRow = col === WHITE ? 6 : 1;
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        if (r === startRow && !board[r + 2 * dir][c]) moves.push([r + 2 * dir, c]);
      }
      for (const dc of [-1, 1]) {
        const rr = r + dir, cc = c + dc;
        if (inBounds(rr, cc) && board[rr][cc] && colorOf(board[rr][cc]) !== col) moves.push([rr, cc]);
      }
    } else if (t === 'N' || t === 'K') {
      const D = t === 'N' ? KNIGHT_D : KING_D;
      for (const [dr, dc] of D) pushIfOk(r + dr, c + dc);
    } else {
      const dirs = t === 'B' ? BISHOP_D : t === 'R' ? ROOK_D : BISHOP_D.concat(ROOK_D);
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (inBounds(rr, cc)) {
          const target = board[rr][cc];
          if (!target) { moves.push([rr, cc]); }
          else { if (colorOf(target) !== col) moves.push([rr, cc]); break; }
          rr += dr; cc += dc;
        }
      }
    }
    return moves.map(([tr, tc]) => ({ fr: r, fc: c, tr, tc }));
  }

  function applyMove(board, m) {
    const b = cloneBoard(board);
    const p = b[m.fr][m.fc];
    b[m.fr][m.fc] = null;
    // promocja: pionek na ostatniej linii zawsze zostaje hetmanem (uproszczenie demo)
    if (typeOf(p) === 'P' && (m.tr === 0 || m.tr === 7)) b[m.tr][m.tc] = colorOf(p) + 'Q';
    else b[m.tr][m.tc] = p;
    return b;
  }

  function isKingInCheck(board, color) {
    const k = findKing(board, color);
    if (!k) return false;
    return isSquareAttacked(board, k[0], k[1], opp(color));
  }

  /* Ruchy w pełni LEGALNE: pseudo-ruch odrzucany, jeśli po nim własny król stoi szachowany. */
  function legalMoves(board, color) {
    const out = [];
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || colorOf(p) !== color) continue;
        for (const m of pseudoMoves(board, r, c)) {
          const after = applyMove(board, m);
          if (!isKingInCheck(after, color)) out.push(m);
        }
      }
    return out;
  }

  function gameStatus(board, color) {
    const moves = legalMoves(board, color);
    const check = isKingInCheck(board, color);
    if (moves.length === 0) return check ? 'checkmate' : 'stalemate';
    return check ? 'check' : 'ongoing';
  }

  /* ---------- ewaluacja + silnik (negamax, alpha-beta, głębokość 2) ---------- */
  const VALUE = { P: 1, N: 3.1, B: 3.3, R: 5, Q: 9, K: 0 };
  function evaluate(board) {
    let s = 0;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        const v = VALUE[typeOf(p)] + (typeOf(p) !== 'K' && typeOf(p) !== 'P' && r > 1 && r < 6 && c > 1 && c < 6 ? 0.05 : 0);
        s += colorOf(p) === WHITE ? v : -v;
      }
    return s;
  }

  function negamax(board, depth, color, alpha, beta) {
    const moves = legalMoves(board, color);
    if (moves.length === 0) {
      if (isKingInCheck(board, color)) return -1000 - depth; // mat: im płycej, tym gorzej dla ruszającego
      return 0; // pat
    }
    if (depth === 0) return (color === WHITE ? 1 : -1) * evaluate(board);
    let best = -Infinity;
    for (const m of moves) {
      const child = applyMove(board, m);
      const val = -negamax(child, depth - 1, opp(color), -beta, -alpha);
      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  function positionHash(board) {
    let h = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) h += board[r][c] || '.';
    return h;
  }

  /* Wybiera ruch dla `color` patrząc D2 (własny ruch + najlepsza odpowiedź przeciwnika),
     z lekką karą anty-repetycyjną za pozycje już odwiedzone w tej partii. */
  function chooseEngineMove(board, color, history) {
    const moves = legalMoves(board, color);
    if (moves.length === 0) return null;
    let bestMoves = [], bestVal = -Infinity;
    for (const m of moves) {
      const child = applyMove(board, m);
      let val = -negamax(child, 1, opp(color), -Infinity, Infinity);
      const seenCount = (history || []).filter(h => h === positionHash(child)).length;
      if (seenCount > 0) val -= 0.5 * seenCount; // anty-repetycja
      if (val > bestVal + 1e-9) { bestVal = val; bestMoves = [m]; }
      else if (Math.abs(val - bestVal) <= 1e-9) bestMoves.push(m);
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  const MAChess = {
    WHITE, BLACK, createInitialBoard, cloneBoard, legalMoves, applyMove,
    isKingInCheck, gameStatus, chooseEngineMove, positionHash, colorOf, typeOf
  };

  /* ---------- widget (tylko gdy jest DOM) ---------- */
  // Figury rysuje czcionka "Figury": białe to kontur na jasnym wypełnieniu, czarne to pełny znak.
  const SOLID = { P: '♟︎', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' };
  const LINE = { P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
  const NAME = { P: 'pionek', N: 'skoczek', B: 'goniec', R: 'wieża', Q: 'hetman', K: 'król' };
  const LETTER = { P: '', N: 'S', B: 'G', R: 'W', Q: 'H', K: 'K' };      // notacja polska
  const FILES = 'abcdefgh';
  const sqName = (r, c) => FILES[c] + (8 - r);

  function initWidget(mount) {
    if (!mount) return;
    let board, turn, selected, legal, history, over, last, record;

    mount.innerHTML =
      '<div class="chs">' +
      '<div class="chs-frame">' +
      '<div class="chs-ranks" aria-hidden="true">' + [8, 7, 6, 5, 4, 3, 2, 1].map(n => '<span>' + n + '</span>').join('') + '</div>' +
      '<div class="chs-board" data-role="grid"></div>' +
      '<div class="chs-files" aria-hidden="true">' + FILES.split('').map(f => '<span>' + f + '</span>').join('') + '</div>' +
      '</div>' +
      '<p class="chs-status" data-role="status" role="status"></p>' +
      '<ol class="chs-moves" data-role="moves" aria-label="Zapis partii"></ol>' +
      '<div class="chs-foot"><button class="chs-reset" type="button" data-role="reset">Nowa partia</button></div>' +
      '</div>';

    const gridEl = mount.querySelector('[data-role="grid"]');
    const statusEl = mount.querySelector('[data-role="status"]');
    const movesEl = mount.querySelector('[data-role="moves"]');
    const cells = [], pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'chs-sq ' + ((r + c) % 2 === 0 ? 'chs-l' : 'chs-d');
        const pc = document.createElement('span');
        pc.className = 'pc';
        cell.appendChild(pc);
        cell.addEventListener('click', () => onCellClick(r, c));
        gridEl.appendChild(cell);
        cells.push(cell); pieces.push(pc);
      }
    }

    function render() {
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
          const i = r * 8 + c, cell = cells[i], pc = pieces[i], p = board[r][c];
          if (p) {
            pc.dataset.c = colorOf(p); pc.dataset.s = SOLID[typeOf(p)]; pc.dataset.o = LINE[typeOf(p)];
          } else { delete pc.dataset.c; delete pc.dataset.s; delete pc.dataset.o; }
          cell.setAttribute('aria-label', sqName(r, c) + ': ' + (p ? (colorOf(p) === WHITE ? 'biały ' : 'czarny ') + NAME[typeOf(p)] : 'puste pole'));
          const target = legal.some(m => m.tr === r && m.tc === c);
          cell.classList.toggle('chs-sel', !!selected && selected[0] === r && selected[1] === c);
          cell.classList.toggle('chs-tgt', target);
          cell.classList.toggle('chs-cap', target && !!p);
          cell.classList.toggle('chs-last', !!last && ((last.fr === r && last.fc === c) || (last.tr === r && last.tc === c)));
        }
    }

    function setStatus(text, cls) {
      statusEl.textContent = text;
      statusEl.className = 'chs-status' + (cls ? ' ' + cls : '');
    }

    // zapis ruchu w pełnej notacji: figura, pole wyjścia, pole docelowe
    function notate(before, m, after, mover) {
      const p = before[m.fr][m.fc];
      let s = LETTER[typeOf(p)] + sqName(m.fr, m.fc) + (before[m.tr][m.tc] ? ':' : '–') + sqName(m.tr, m.tc);
      if (typeOf(p) === 'P' && (m.tr === 0 || m.tr === 7)) s += 'H';
      const st = gameStatus(after, opp(mover));
      if (st === 'checkmate') s += '#'; else if (st === 'check') s += '+';
      return s;
    }
    function writeRecord() {
      movesEl.innerHTML = '';
      for (let i = 0; i < record.length; i += 2) {
        const li = document.createElement('li');
        const no = document.createElement('b');
        no.textContent = (i / 2 + 1) + '.';
        li.appendChild(no);
        li.appendChild(document.createTextNode(' ' + record[i] + (record[i + 1] ? ' ' + record[i + 1] : '')));
        movesEl.appendChild(li);
      }
      movesEl.scrollTop = movesEl.scrollHeight;
    }

    function play(m, mover) {
      const before = board;
      board = applyMove(board, m);
      history.push(positionHash(board));
      record.push(notate(before, m, board, mover));
      last = m;
      writeRecord();
    }

    function afterMoveStatusCheck(colorToMove) {
      const st = gameStatus(board, colorToMove);
      if (st === 'checkmate') {
        over = true;
        setStatus((colorToMove === WHITE ? 'Białe' : 'Czarne') + ' dostały mata. Koniec partii.', 'chs-over');
        return true;
      }
      if (st === 'stalemate') {
        over = true;
        setStatus('Pat, remis.', 'chs-over');
        return true;
      }
      return false;
    }

    function engineTurn() {
      setStatus('Silnik liczy odpowiedź...', 'chs-think');
      setTimeout(() => {
        const m = chooseEngineMove(board, BLACK, history);
        if (!m) return;
        play(m, BLACK);
        turn = WHITE;
        render();
        if (!afterMoveStatusCheck(WHITE)) {
          setStatus(gameStatus(board, WHITE) === 'check' ? 'Szach. Twój ruch, grasz białymi.' : 'Twój ruch, grasz białymi.');
        }
      }, 380);
    }

    function pick(r, c) {
      selected = [r, c];
      legal = legalMoves(board, WHITE).filter(m => m.fr === r && m.fc === c);
    }

    function onCellClick(r, c) {
      if (over || turn !== WHITE) return;
      const p = board[r][c];
      if (selected) {
        const mv = legal.find(m => m.tr === r && m.tc === c);
        if (mv) {
          play(mv, WHITE);
          selected = null; legal = [];
          turn = BLACK;
          render();
          if (!afterMoveStatusCheck(BLACK)) engineTurn();
          return;
        }
        if (p && colorOf(p) === WHITE && !(selected[0] === r && selected[1] === c)) { pick(r, c); render(); return; }
        selected = null; legal = []; render();
        return;
      }
      if (p && colorOf(p) === WHITE) { pick(r, c); render(); }
    }

    function reset() {
      board = createInitialBoard(); turn = WHITE; selected = null; legal = []; history = []; over = false; last = null; record = [];
      setStatus('Twój ruch, grasz białymi.');
      writeRecord();
      render();
    }
    mount.querySelector('[data-role="reset"]').addEventListener('click', reset);
    reset();
  }

  MAChess.initWidget = initWidget;
  (typeof window !== 'undefined' ? window : root).MAChess = MAChess;
})(typeof globalThis !== 'undefined' ? globalThis : this);
