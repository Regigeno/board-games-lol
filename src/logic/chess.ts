export type Color = "w" | "b";
export type PType = "k" | "q" | "r" | "b" | "n" | "p";
export type Piece = { c: Color; t: PType };
export type Board = (Piece | null)[];

export type CastleRights = { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };

export type ChessMove = {
  from: number;
  to: number;
  promo?: PType;
  castle?: "K" | "Q";
  ep?: boolean;
};

export type ChessState = {
  board: Board;
  turn: Color;
  castle: CastleRights;
  ep: number | null;
  half: number;
  full: number;
};

const FILES = "abcdefgh";

export function sqName(i: number) {
  return FILES[i % 8] + String(Math.floor(i / 8) + 1);
}

export function other(c: Color): Color {
  return c === "w" ? "b" : "w";
}

export function startChess(): ChessState {
  const b: Board = Array(64).fill(null);
  const back: PType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  back.forEach((t, f) => {
    b[f] = { c: "w", t };
    b[56 + f] = { c: "b", t };
    b[8 + f] = { c: "w", t: "p" };
    b[48 + f] = { c: "b", t: "p" };
  });
  return {
    board: b,
    turn: "w",
    castle: { wK: true, wQ: true, bK: true, bQ: true },
    ep: null,
    half: 0,
    full: 1,
  };
}

function onBoard(r: number, f: number) {
  return r >= 0 && r < 8 && f >= 0 && f < 8;
}

function rc(i: number) {
  return [Math.floor(i / 8), i % 8] as const;
}

export function findKing(board: Board, c: Color) {
  return board.findIndex((p) => p && p.c === c && p.t === "k");
}

export function attacked(board: Board, target: number, by: Color) {
  const [tr, tf] = rc(target);
  const dir = by === "w" ? 1 : -1;
  for (const df of [-1, 1]) {
    const r = tr - dir;
    const f = tf + df;
    if (onBoard(r, f)) {
      const p = board[r * 8 + f];
      if (p && p.c === by && p.t === "p") return true;
    }
  }
  for (const [dr, df] of [
    [1, 2],
    [2, 1],
    [-1, 2],
    [-2, 1],
    [1, -2],
    [2, -1],
    [-1, -2],
    [-2, -1],
  ]) {
    const r = tr + dr;
    const f = tf + df;
    if (!onBoard(r, f)) continue;
    const p = board[r * 8 + f];
    if (p && p.c === by && p.t === "n") return true;
  }
  for (const [dr, df] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]) {
    let r = tr + dr;
    let f = tf + df;
    let dist = 1;
    while (onBoard(r, f)) {
      const p = board[r * 8 + f];
      if (p) {
        if (p.c === by) {
          const diag = dr !== 0 && df !== 0;
          if (p.t === "q") return true;
          if (p.t === "k" && dist === 1) return true;
          if (!diag && (p.t === "r" || (p.t === "k" && dist === 1))) return true;
          if (diag && p.t === "b") return true;
          if (!diag && p.t === "r") return true;
        }
        break;
      }
      r += dr;
      f += df;
      dist++;
    }
  }
  return false;
}

export function inCheck(board: Board, c: Color) {
  const k = findKing(board, c);
  return k >= 0 && attacked(board, k, other(c));
}

function slide(board: Board, from: number, dr: number, df: number, moves: ChessMove[]) {
  const piece = board[from]!;
  let [r, f] = rc(from);
  for (;;) {
    r += dr;
    f += df;
    if (!onBoard(r, f)) break;
    const to = r * 8 + f;
    const occ = board[to];
    if (!occ) moves.push({ from, to });
    else {
      if (occ.c !== piece.c) moves.push({ from, to });
      break;
    }
  }
}

function pseudo(state: ChessState): ChessMove[] {
  const { board, turn } = state;
  const moves: ChessMove[] = [];
  const dir = turn === "w" ? 1 : -1;
  const startRank = turn === "w" ? 1 : 6;
  const promoRank = turn === "w" ? 7 : 0;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || p.c !== turn) continue;
    const [r, f] = rc(i);
    if (p.t === "p") {
      const one = (r + dir) * 8 + f;
      if (onBoard(r + dir, f) && !board[one]) {
        pushPawn(moves, i, one, r + dir === promoRank);
        const twoR = r + dir * 2;
        if (r === startRank && onBoard(twoR, f) && !board[twoR * 8 + f]) {
          moves.push({ from: i, to: twoR * 8 + f });
        }
      }
      for (const df of [-1, 1]) {
        if (!onBoard(r + dir, f + df)) continue;
        const to = (r + dir) * 8 + f + df;
        const occ = board[to];
        if (occ && occ.c !== turn) pushPawn(moves, i, to, r + dir === promoRank);
        if (state.ep === to) moves.push({ from: i, to, ep: true });
      }
    } else if (p.t === "n") {
      for (const [dr, df] of [
        [1, 2],
        [2, 1],
        [-1, 2],
        [-2, 1],
        [1, -2],
        [2, -1],
        [-1, -2],
        [-2, -1],
      ]) {
        if (!onBoard(r + dr, f + df)) continue;
        const to = (r + dr) * 8 + f + df;
        if (!board[to] || board[to]!.c !== turn) moves.push({ from: i, to });
      }
    } else if (p.t === "k") {
      for (const [dr, df] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        if (!onBoard(r + dr, f + df)) continue;
        const to = (r + dr) * 8 + f + df;
        if (!board[to] || board[to]!.c !== turn) moves.push({ from: i, to });
      }
      const rights = state.castle;
      const home = turn === "w" ? 0 : 56;
      if (i === home + 4 && (turn === "w" ? rights.wK : rights.bK) && !board[home + 5] && !board[home + 6]) {
        if (!attacked(board, home + 4, other(turn)) && !attacked(board, home + 5, other(turn)) && !attacked(board, home + 6, other(turn))) {
          moves.push({ from: home + 4, to: home + 6, castle: "K" });
        }
      }
      if (i === home + 4 && (turn === "w" ? rights.wQ : rights.bQ) && !board[home + 1] && !board[home + 2] && !board[home + 3]) {
        if (!attacked(board, home + 4, other(turn)) && !attacked(board, home + 3, other(turn)) && !attacked(board, home + 2, other(turn))) {
          moves.push({ from: home + 4, to: home + 2, castle: "Q" });
        }
      }
    } else {
      const dirs =
        p.t === "b"
          ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
          : p.t === "r"
            ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
            : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const [dr, df] of dirs) slide(board, i, dr, df, moves);
    }
  }
  return moves;
}

function pushPawn(moves: ChessMove[], from: number, to: number, promo: boolean) {
  if (promo) {
    for (const t of ["q", "r", "b", "n"] as PType[]) moves.push({ from, to, promo: t });
  } else moves.push({ from, to });
}

export function applyMove(state: ChessState, move: ChessMove): ChessState {
  const board = state.board.slice();
  const piece = board[move.from]!;
  board[move.from] = null;
  const castle = { ...state.castle };
  let ep: number | null = null;
  let half = state.half + 1;
  if (piece.t === "p" || board[move.to]) half = 0;
  if (move.ep) {
    const cap = move.to + (piece.c === "w" ? -8 : 8);
    board[cap] = null;
    half = 0;
  }
  if (move.castle === "K") {
    board[move.to - 1] = board[move.to + 1];
    board[move.to + 1] = null;
  } else if (move.castle === "Q") {
    board[move.to + 1] = board[move.to - 2];
    board[move.to - 2] = null;
  }
  board[move.to] = move.promo ? { c: piece.c, t: move.promo } : piece;
  if (piece.t === "k") {
    if (piece.c === "w") {
      castle.wK = false;
      castle.wQ = false;
    } else {
      castle.bK = false;
      castle.bQ = false;
    }
  }
  if (move.from === 0 || move.to === 0) castle.wQ = false;
  if (move.from === 7 || move.to === 7) castle.wK = false;
  if (move.from === 56 || move.to === 56) castle.bQ = false;
  if (move.from === 63 || move.to === 63) castle.bK = false;
  if (piece.t === "p" && Math.abs(move.to - move.from) === 16) {
    ep = (move.from + move.to) / 2;
  }
  return {
    board,
    turn: other(state.turn),
    castle,
    ep,
    half,
    full: state.full + (state.turn === "b" ? 1 : 0),
  };
}

export function legalMoves(state: ChessState): ChessMove[] {
  return pseudo(state).filter((m) => !inCheck(applyMove(state, m).board, state.turn));
}

export function posKey(state: ChessState) {
  const cells = state.board
    .map((p) => (p ? p.c + p.t : "."))
    .join("");
  return `${cells} ${state.turn} ${state.castle.wK}${state.castle.wQ}${state.castle.bK}${state.castle.bQ} ${state.ep ?? "-"}`;
}

export function insufficient(board: Board) {
  const pieces = board.filter(Boolean) as Piece[];
  if (pieces.length === 2) return true;
  if (pieces.length === 3 && pieces.some((p) => p.t === "n" || p.t === "b")) return true;
  if (pieces.length === 4) {
    const bishops = pieces.filter((p) => p.t === "b");
    if (bishops.length === 2 && bishops[0].c !== bishops[1].c) {
      const squares = board
        .map((p, i) => (p && p.t === "b" ? i : -1))
        .filter((i) => i >= 0);
      const color = (i: number) => (Math.floor(i / 8) + (i % 8)) % 2;
      if (color(squares[0]) === color(squares[1])) return true;
    }
  }
  return false;
}

export function outcome(state: ChessState, reps: Map<string, number>): string | null {
  const moves = legalMoves(state);
  if (moves.length === 0) {
    return inCheck(state.board, state.turn)
      ? `${state.turn === "w" ? "Black" : "White"} wins by checkmate`
      : "Draw by stalemate";
  }
  if (state.half >= 100) return "Draw by the fifty-move rule";
  if ((reps.get(posKey(state)) ?? 0) >= 3) return "Draw by threefold repetition";
  if (insufficient(state.board)) return "Draw by insufficient material";
  return null;
}

export const PIECE_GLYPH: Record<string, string> = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
};
