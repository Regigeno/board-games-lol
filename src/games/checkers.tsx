import { useMemo, useState } from "react";
import { Banner, Frame, Log } from "../components/ui";
import { applyChecker, checkerWinner, isDark, legalCheckerMoves, startCheckers, type CBoard, type Side } from "../logic/checkers";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "checkers")!;

export function CheckersGame({ players, onExit }: GameProps) {
  const [board, setBoard] = useState<CBoard>(() => startCheckers());
  const [turn, setTurn] = useState<Side>("r");
  const [lock, setLock] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [over, setOver] = useState<string | null>(null);
  const moves = useMemo(() => (over ? [] : legalCheckerMoves(board, turn, lock)), [board, turn, lock, over]);
  const name = turn === "r" ? players[0].name : players[1].name;

  function click(i: number) {
    if (over || !isDark(i)) return;
    const mv = moves.find((m) => m.from === sel && m.to === i);
    if (sel !== null && mv) {
      const applied = applyChecker(board, mv);
      const who = name;
      setLog((l) => [...l, `${who} ${mv.cap !== undefined ? "jumps" : "moves"}`]);
      if (mv.cap !== undefined && !applied.promote) {
        const more = legalCheckerMoves(applied.board, turn, mv.to);
        if (more.length && more.every((m) => m.cap !== undefined)) {
          setBoard(applied.board);
          setLock(mv.to);
          setSel(mv.to);
          return;
        }
      }
      const nextTurn = turn === "r" ? "b" : "r";
      setBoard(applied.board);
      setLock(null);
      setSel(null);
      const winner = checkerWinner(applied.board, nextTurn);
      if (winner === "r" || winner === "b") {
        setOver(`${winner === "r" ? players[0].name : players[1].name} wins`);
        setTurn(nextTurn);
      } else setTurn(nextTurn);
      return;
    }
    if (board[i]?.side === turn && moves.some((m) => m.from === i)) setSel(i);
  }

  const hints = new Set(moves.filter((m) => m.from === sel).map((m) => m.to));

  return (
    <Frame meta={meta} onExit={onExit} status={over ?? `It is ${name}'s turn`} side={<><Banner>{over ?? (lock !== null ? `${name} must keep jumping` : `${name} to move`)}</Banner><Log lines={log} /></>}>
      <div className="board-wrap">
        <div className="checkers">
          {Array.from({ length: 64 }, (_, n) => {
            const rank = 7 - Math.floor(n / 8);
            const file = n % 8;
            const i = rank * 8 + file;
            const man = board[i];
            return (
              <button key={i} className={`sq ${isDark(i) ? "dark" : "light"} ${sel === i ? "sel" : ""} ${hints.has(i) ? "hint" : ""}`} onClick={() => click(i)}>
                {man ? <span className={`checker ${man.side === "r" ? "red" : "black"} ${man.king ? "king" : ""}`} /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}
