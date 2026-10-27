export type Side = "r" | "b";
export type Man = { side: Side; king: boolean };
export type CBoard = (Man | null)[];
export type CMove = { from: number; to: number; cap?: number };

export function otherSide(s: Side): Side {
  return s === "r" ? "b" : "r";
}

export function startCheckers(): CBoard {
  const b: CBoard = Array(64).fill(null);
  for (let i = 0; i < 64; i++) {
    const r = Math.floor(i / 8);
    const f = i % 8;
    if ((r + f) % 2 === 0) continue;
    if (r <= 2) b[i] = { side: "r", king: false };
    else if (r >= 5) b[i] = { side: "b", king: false };
  }
  return b;
}

function dark(i: number) {
  const r = Math.floor(i / 8);
  const f = i % 8;
  return (r + f) % 2 === 1;
}

function dirs(man: Man): [number, number][] {
  const fw: [number, number][] = man.side === "r" ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
  if (!man.king) return fw;
  return [[1, -1], [1, 1], [-1, -1], [-1, 1]];
}

function jumpsFrom(board: CBoard, i: number): CMove[] {
  const man = board[i];
  if (!man) return [];
  const r = Math.floor(i / 8);
  const f = i % 8;
  const out: CMove[] = [];
  for (const [dr, df] of dirs(man)) {
    const mr = r + dr;
    const mf = f + df;
    const lr = r + dr * 2;
    const lf = f + df * 2;
    if (lr < 0 || lr > 7 || lf < 0 || lf > 7) continue;
    const mid = mr * 8 + mf;
    const land = lr * 8 + lf;
    const jumpee = board[mid];
    if (jumpee && jumpee.side !== man.side && !board[land]) out.push({ from: i, to: land, cap: mid });
  }
  return out;
}

function stepsFrom(board: CBoard, i: number): CMove[] {
  const man = board[i];
  if (!man) return [];
  const r = Math.floor(i / 8);
  const f = i % 8;
  const out: CMove[] = [];
  for (const [dr, df] of dirs(man)) {
    const nr = r + dr;
    const nf = f + df;
    if (nr < 0 || nr > 7 || nf < 0 || nf > 7) continue;
    const to = nr * 8 + nf;
    if (!board[to]) out.push({ from: i, to });
  }
  return out;
}

export function anyJump(board: CBoard, side: Side) {
  for (let i = 0; i < 64; i++) {
    if (board[i]?.side === side && jumpsFrom(board, i).length) return true;
  }
  return false;
}

export function legalCheckerMoves(board: CBoard, side: Side, lock: number | null): CMove[] {
  if (lock !== null) return jumpsFrom(board, lock);
  const jumps: CMove[] = [];
  for (let i = 0; i < 64; i++) if (board[i]?.side === side) jumps.push(...jumpsFrom(board, i));
  if (jumps.length) return jumps;
  const steps: CMove[] = [];
  for (let i = 0; i < 64; i++) if (board[i]?.side === side) steps.push(...stepsFrom(board, i));
  return steps;
}

export function applyChecker(board: CBoard, move: CMove): { board: CBoard; promote: boolean } {
  const next = board.slice();
  const man = { ...next[move.from]! };
  next[move.from] = null;
  if (move.cap !== undefined) next[move.cap] = null;
  const rank = Math.floor(move.to / 8);
  const promote = !man.king && ((man.side === "r" && rank === 7) || (man.side === "b" && rank === 0));
  if (promote) man.king = true;
  next[move.to] = man;
  return { board: next, promote };
}

export function checkerWinner(board: CBoard, side: Side): Side | "draw" | null {
  const mine = board.some((m) => m?.side === side);
  const theirs = board.some((m) => m?.side === otherSide(side));
  if (!mine) return otherSide(side);
  if (!theirs) return side;
  if (legalCheckerMoves(board, side, null).length === 0) return otherSide(side);
  return null;
}

export function isDark(i: number) {
  return dark(i);
}
