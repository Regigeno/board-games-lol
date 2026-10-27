import { useMemo, useState } from "react";
import { Banner, Frame, Log } from "../components/ui";
import {
  PIECE_GLYPH,
  applyMove,
  legalMoves,
  outcome,
  posKey,
  sqName,
  startChess,
  type ChessMove,
  type ChessState,
  type PType,
} from "../logic/chess";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "chess")!;

export function ChessGame({ players, onExit }: GameProps) {
  const [state, setState] = useState<ChessState>(() => startChess());
  const [reps, setReps] = useState<Map<string, number>>(() => new Map([[posKey(startChess()), 1]]));
  const [sel, setSel] = useState<number | null>(null);
  const [promo, setPromo] = useState<ChessMove[] | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [over, setOver] = useState<string | null>(null);
  const moves = useMemo(() => (over ? [] : legalMoves(state)), [state, over]);
  const sideName = state.turn === "w" ? players[0].name : players[1].name;

  function commit(move: ChessMove) {
    const next = applyMove(state, move);
    const key = posKey(next);
    const map = new Map(reps);
    map.set(key, (map.get(key) ?? 0) + 1);
    const piece = state.board[move.from]!;
    const note = `${piece.c === "w" ? players[0].name : players[1].name} ${sqName(move.from)}–${sqName(move.to)}${move.promo ? `=${move.promo.toUpperCase()}` : ""}${move.castle ? " castle" : ""}`;
    setLog((l) => [...l, note]);
    setReps(map);
    setState(next);
    setSel(null);
    setPromo(null);
    setOver(outcome(next, map));
  }

  function click(i: number) {
    if (over) return;
    const options = moves.filter((m) => m.from === sel && m.to === i);
    if (sel !== null && options.length) {
      const promos = options.filter((m) => m.promo);
      if (promos.length) setPromo(promos);
      else commit(options[0]);
      return;
    }
    const piece = state.board[i];
    if (piece && piece.c === state.turn) setSel(i);
    else setSel(null);
  }

  const hints = new Set(moves.filter((m) => m.from === sel).map((m) => m.to));

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={over ?? `It is ${sideName}'s turn${state.turn === "w" ? " · White" : " · Black"}`}
      side={
        <>
          <Banner>{over ?? `${sideName} to move`}</Banner>
          {promo ? (
            <div className="stack">
              <p>Promote to</p>
              <div className="actions">
                {promo.map((m) => (
                  <button key={m.promo} className="btn solid" onClick={() => commit(m)}>
                    {PIECE_GLYPH[(state.turn + m.promo!) as `${string}${PType}`]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <Log lines={log} />
          {!over ? (
            <button
              className="btn ghost"
              onClick={() => setOver(`${state.turn === "w" ? players[1].name : players[0].name} wins by resignation`)}
            >
              Resign
            </button>
          ) : null}
        </>
      }
    >
      <div className="board-wrap">
        <div className="chess" role="grid" aria-label="Chessboard">
          {Array.from({ length: 64 }, (_, n) => {
            const rank = 7 - Math.floor(n / 8);
            const file = n % 8;
            const i = rank * 8 + file;
            const piece = state.board[i];
            const light = (rank + file) % 2 === 1;
            return (
              <button
                key={i}
                className={`sq ${light ? "light" : "dark"} ${sel === i ? "sel" : ""} ${hints.has(i) ? "hint" : ""}`}
                onClick={() => click(i)}
              >
                {file === 0 ? <span className="coord rank">{rank + 1}</span> : null}
                {rank === 0 ? <span className="coord file">{"abcdefgh"[file]}</span> : null}
                {piece ? PIECE_GLYPH[piece.c + piece.t] : ""}
              </button>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}
