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

  /* ---------- widget UI (tylko gdy jest DOM) ---------- */
  const GLYPH = {
    wP: '♙', wN: '♘', wB: '♗', wR: '♖', wQ: '♕', wK: '♔',
    bP: '♟', bN: '♞', bB: '♝', bR: '♜', bQ: '♛', bK: '♚'
  };

  function initWidget(mount) {
    if (!mount) return;
    let board = createInitialBoard();
    let turn = WHITE;
    let selected = null;
    let legal = [];
    let history = [];
    let over = false;

    mount.innerHTML =
      '<div class="chs-wrap">' +
      '<div class="chs-status" data-role="status">Twój ruch — białe</div>' +
      '<div class="chs-grid" data-role="grid"></div>' +
      '<div class="chs-foot">' +
      '<span class="chs-note">Wersja demo: bez roszady i bicia w przelocie, promocja zawsze na hetmana.</span>' +
      '<button class="chs-reset" type="button" data-role="reset">Nowa gra ⟲</button>' +
      '</div></div>';

    const gridEl = mount.querySelector('[data-role="grid"]');
    const statusEl = mount.querySelector('[data-role="status"]');
    const cells = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'chs-sq ' + ((r + c) % 2 === 0 ? 'chs-l' : 'chs-d');
        cell.setAttribute('aria-label', 'pole ' + r + c);
        cell.addEventListener('click', () => onCellClick(r, c));
        gridEl.appendChild(cell);
        cells.push(cell);
      }
    }

    function render() {
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++) {
          const cell = cells[r * 8 + c];
          const p = board[r][c];
          cell.textContent = p ? GLYPH[p] : '';
          cell.classList.toggle('chs-piece-w', !!p && colorOf(p) === WHITE);
          cell.classList.toggle('chs-piece-b', !!p && colorOf(p) === BLACK);
          cell.classList.toggle('chs-sel', !!selected && selected[0] === r && selected[1] === c);
          cell.classList.toggle('chs-tgt', legal.some(m => m.tr === r && m.tc === c));
        }
    }

    function setStatus(text, cls) {
      statusEl.textContent = text;
      statusEl.className = 'chs-status' + (cls ? ' ' + cls : '');
    }

    function afterMoveStatusCheck(colorToMove) {
      const st = gameStatus(board, colorToMove);
      if (st === 'checkmate') {
        over = true;
        setStatus((colorToMove === WHITE ? 'Białe' : 'Czarne') + ' zamatowane — koniec gry.', 'chs-over');
        return true;
      }
      if (st === 'stalemate') {
        over = true;
        setStatus('Pat — remis.', 'chs-over');
        return true;
      }
      return false;
    }

    function engineTurn() {
      setStatus('Silnik myśli…', 'chs-think');
      setTimeout(() => {
        const m = chooseEngineMove(board, BLACK, history);
        if (!m) return; // gameStatus już to obsłużył
        board = applyMove(board, m);
        history.push(positionHash(board));
        turn = WHITE;
        render();
        if (!afterMoveStatusCheck(WHITE)) {
          setStatus(gameStatus(board, WHITE) === 'check' ? 'Szach! Twój ruch — białe' : 'Twój ruch — białe');
        }
      }, 380);
    }

    function onCellClick(r, c) {
      if (over || turn !== WHITE) return;
      const p = board[r][c];
      if (selected) {
        const mv = legal.find(m => m.tr === r && m.tc === c);
        if (mv) {
          board = applyMove(board, mv);
          history.push(positionHash(board));
          selected = null; legal = [];
          turn = BLACK;
          render();
          if (!afterMoveStatusCheck(BLACK)) engineTurn();
          return;
        }
        if (p && colorOf(p) === WHITE) {
          selected = [r, c];
          legal = legalMoves(board, WHITE).filter(m => m.fr === r && m.fc === c);
          render();
          return;
        }
        selected = null; legal = []; render();
        return;
      }
      if (p && colorOf(p) === WHITE) {
        selected = [r, c];
        legal = legalMoves(board, WHITE).filter(m => m.fr === r && m.fc === c);
        render();
      }
    }

    mount.querySelector('[data-role="reset"]').addEventListener('click', () => {
      board = createInitialBoard(); turn = WHITE; selected = null; legal = []; history = []; over = false;
      setStatus('Twój ruch — białe');
      render();
    });

    render();
  }

  MAChess.initWidget = initWidget;
  (typeof window !== 'undefined' ? window : root).MAChess = MAChess;
})(typeof globalThis !== 'undefined' ? globalThis : this);
