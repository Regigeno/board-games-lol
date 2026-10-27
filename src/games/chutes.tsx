import { useState } from "react";
import { Banner, Die, Frame, Log } from "../components/ui";
import { CHUTES, LADDERS, moveToken } from "../logic/chutes";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "chutes")!;

function squareAt(row: number, col: number) {
  const band = 9 - row;
  const base = band * 10;
  return band % 2 === 0 ? base + col + 1 : base + (10 - col);
}

export function ChutesGame({ players, onExit }: GameProps) {
  const [pos, setPos] = useState<number[]>(() => players.map(() => 0));
  const [turn, setTurn] = useState(0);
  const [spin, setSpin] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [over, setOver] = useState<string | null>(null);

  function go() {
    if (over) return;
    const n = 1 + Math.floor(Math.random() * 6);
    const hit = moveToken(pos[turn], n);
    const next = pos.slice();
    next[turn] = hit.to;
    const via = hit.via === "ladder" ? " and climbs" : hit.via === "chute" ? " and slides" : hit.via === "exact" ? " and needs an exact spin" : "";
    setLog((l) => [...l, `${players[turn].name} spins ${n}${via} → ${hit.to || "start"}`]);
    setSpin(n);
    setPos(next);
    if (hit.to === 100) setOver(`${players[turn].name} wins`);
    else setTurn((turn + 1) % players.length);
  }

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={over ?? `It is ${players[turn].name}'s turn`}
      side={
        <>
          <Banner>{over ?? `${players[turn].name} spins`}</Banner>
          <div className="actions">
            {spin ? <Die value={spin} /> : null}
            <button className="btn solid" disabled={!!over} onClick={go}>
              Spin
            </button>
          </div>
          <div className="stack">
            {players.map((p, i) => (
              <p key={p.id}>
                <i className="swatch" style={{ background: p.color }} /> {p.name}: {pos[i] || "start"}
              </p>
            ))}
          </div>
          <Log lines={log} />
        </>
      }
    >
      <div className="track100">
        {Array.from({ length: 100 }, (_, n) => {
          const row = Math.floor(n / 10);
          const col = n % 10;
          const sq = squareAt(row, col);
          const kind = LADDERS[sq] ? "ladder" : CHUTES[sq] ? "chute" : "";
          return (
            <div key={sq} className={`sq100 ${kind}`}>
              <span>{sq}</span>
              {LADDERS[sq] ? <small>↑{LADDERS[sq]}</small> : null}
              {CHUTES[sq] ? <small>↓{CHUTES[sq]}</small> : null}
              <span className="dots">
                {pos.map((p, i) => (p === sq ? <i key={i} className="pawn" style={{ background: players[i].color, width: 8, height: 8 }} /> : null))}
              </span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
