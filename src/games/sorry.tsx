import { useState } from "react";
import { Banner, Frame, Log } from "../components/ui";
import {
  backward,
  cardLabel,
  forward,
  slideSquares,
  sorryDeck,
  startOf,
  type PawnSpot,
  type SorryCard,
} from "../logic/sorry";
import { shuffle } from "../logic/util";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "sorry")!;
const COLORS = ["#d64545", "#2f6fed", "#e2a325", "#1f9d62"];

type Choice = { label: string; apply: (pawns: PawnSpot[][]) => PawnSpot[][] };

export function SorryGame({ players, onExit }: GameProps) {
  const [pawns, setPawns] = useState<PawnSpot[][]>(() => players.map(() => Array.from({ length: 4 }, () => ({ z: "base" as const }))));
  const [deck, setDeck] = useState<SorryCard[]>(() => shuffle(sorryDeck()));
  const [discard, setDiscard] = useState<SorryCard[]>([]);
  const [turn, setTurn] = useState(0);
  const [card, setCard] = useState<SorryCard | null>(null);
  const [extra, setExtra] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  function bump(next: PawnSpot[][], dest: PawnSpot, owner: number, pawn: number) {
    if (dest.z !== "track") return;
    next.forEach((set, pi) => {
      set.forEach((spot, i) => {
        if (pi === owner && i === pawn) return;
        if (spot.z === "track" && spot.i === dest.i) next[pi][i] = { z: "base" };
      });
    });
  }

  function moveTo(next: PawnSpot[][], owner: number, pawn: number, dest: PawnSpot, sliding: boolean) {
    if (dest.z === "track" && sliding) {
      const squares = slideSquares(owner, dest.i);
      if (squares.length) {
        const end = squares[squares.length - 1];
        for (const sq of squares) {
          next.forEach((set, pi) => {
            set.forEach((spot, i) => {
              if (pi === owner && i === pawn) return;
              if (spot.z === "track" && spot.i === sq) next[pi][i] = { z: "base" };
            });
          });
        }
        next[owner][pawn] = { z: "track", i: end };
        return;
      }
    }
    bump(next, dest, owner, pawn);
    next[owner][pawn] = dest;
  }

  function blocked(current: PawnSpot[][], owner: number, pawn: number, dest: PawnSpot) {
    const mine = current[owner];
    if (dest.z === "track") return mine.some((s, i) => i !== pawn && s.z === "track" && s.i === dest.i);
    if (dest.z === "safe") {
      const from = mine[pawn];
      const startN = from.z === "safe" ? from.n + 1 : 0;
      for (let n = startN; n <= dest.n; n++) {
        if (mine.some((s, i) => i !== pawn && s.z === "safe" && s.n === n)) return true;
      }
    }
    return false;
  }

  function choicesFor(current: SorryCard, owner: number, board: PawnSpot[][]): Choice[] {
    const out: Choice[] = [];
    const mine = board[owner];
    if (current.kind === "sorry") {
      board.forEach((set, pi) => {
        if (pi === owner) return;
        set.forEach((spot, i) => {
          if (spot.z !== "track") return;
          const home = mine.findIndex((s) => s.z === "base");
          if (home < 0) return;
          out.push({
            label: `Sorry ${players[pi].name}'s pawn`,
            apply: (pawnsNow) => {
              const next = pawnsNow.map((set2) => set2.map((s) => ({ ...s })));
              next[pi][i] = { z: "base" };
              next[owner][home] = { ...spot };
              return next;
            },
          });
        });
      });
      return out;
    }
    const n = current.n;
    mine.forEach((spot, pawn) => {
      if ((n === 1 || n === 2) && spot.z === "base") {
        const dest: PawnSpot = { z: "track", i: startOf(owner) };
        if (!blocked(board, owner, pawn, dest)) {
          out.push({
            label: `Leave start with pawn ${pawn + 1}`,
            apply: (pawnsNow) => {
              const next = pawnsNow.map((set) => set.map((s) => ({ ...s })));
              moveTo(next, owner, pawn, dest, true);
              return next;
            },
          });
        }
      }
      if (spot.z === "base") return;
      if (n === 4 || n === 10) {
        const back = backward(owner, spot, n === 4 ? 4 : 1);
        if (back && !blocked(board, owner, pawn, back)) {
          out.push({
            label: `Pawn ${pawn + 1} back ${n === 4 ? 4 : 1}`,
            apply: (pawnsNow) => {
              const next = pawnsNow.map((set) => set.map((s) => ({ ...s })));
              moveTo(next, owner, pawn, back, false);
              return next;
            },
          });
        }
      }
      if (n !== 4) {
        const dest = forward(owner, spot, n === 10 ? 10 : n);
        if (dest && !blocked(board, owner, pawn, dest)) {
          out.push({
            label: `Pawn ${pawn + 1} forward ${n === 10 ? 10 : n}`,
            apply: (pawnsNow) => {
              const next = pawnsNow.map((set) => set.map((s) => ({ ...s })));
              moveTo(next, owner, pawn, dest, dest.z === "track");
              return next;
            },
          });
        }
      }
      if (n === 7) {
        for (let a = 1; a <= 6; a++) {
          const first = forward(owner, spot, a);
          if (!first || blocked(board, owner, pawn, first)) continue;
          mine.forEach((other, pawn2) => {
            if (pawn2 === pawn || other.z === "base") return;
            const second = forward(owner, other, 7 - a);
            if (!second || blocked(board, owner, pawn2, second)) return;
            out.push({
              label: `Pawn ${pawn + 1} moves ${a}, pawn ${pawn2 + 1} moves ${7 - a}`,
              apply: (pawnsNow) => {
                const next = pawnsNow.map((set) => set.map((s) => ({ ...s })));
                moveTo(next, owner, pawn, first, first.z === "track");
                const again = forward(owner, next[owner][pawn2], 7 - a);
                if (again) moveTo(next, owner, pawn2, again, again.z === "track");
                return next;
              },
            });
          });
        }
      }
      if (n === 11 && spot.z === "track") {
        board.forEach((set, pi) => {
          if (pi === owner) return;
          set.forEach((op, i) => {
            if (op.z !== "track") return;
            out.push({
              label: `Swap pawn ${pawn + 1} with ${players[pi].name}`,
              apply: (pawnsNow) => {
                const next = pawnsNow.map((set2) => set2.map((s) => ({ ...s })));
                const mineSpot = next[owner][pawn];
                next[owner][pawn] = next[pi][i];
                next[pi][i] = mineSpot;
                return next;
              },
            });
          });
        });
      }
    });
    return out;
  }

  function draw() {
    let pile = deck.slice();
    let trash = discard.slice();
    if (!pile.length) {
      pile = shuffle(trash);
      trash = [];
    }
    const next = pile.shift()!;
    setDeck(pile);
    setDiscard([...trash, next]);
    setCard(next);
    const options = choicesFor(next, turn, pawns);
    if (!options.length) {
      setLog((l) => [...l, `${players[turn].name} draws ${cardLabel(next)} and cannot move`]);
      setCard(null);
      setTurn((turn + 1) % players.length);
    }
  }

  function choose(choice: Choice) {
    if (!card) return;
    const next = choice.apply(pawns.map((set) => set.map((s) => ({ ...s }))));
    setPawns(next);
    setLog((l) => [...l, `${players[turn].name} plays ${cardLabel(card)}: ${choice.label}`]);
    const home = next[turn].every((s) => s.z === "safe" && s.n === 5);
    if (home) {
      setWinner(players[turn].name);
      setCard(null);
      return;
    }
    const again = card.kind === "n" && card.n === 2 && !choice.label.startsWith("Leave");
    setCard(null);
    if (again) setExtra(true);
    else {
      setExtra(false);
      setTurn((t) => (t + 1) % players.length);
    }
  }

  const options = card ? choicesFor(card, turn, pawns) : [];

  function coord(i: number) {
    const side = Math.floor(i / 15);
    const pos = i % 15;
    if (side === 0) return { x: 15 - pos, y: 15 };
    if (side === 1) return { x: 0, y: 15 - pos };
    if (side === 2) return { x: pos, y: 0 };
    return { x: 15, y: pos };
  }

  const cells: { x: number; y: number; i: number }[] = [];
  for (let i = 0; i < 60; i++) cells.push({ i, ...coord(i) });

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={winner ? `${winner} gets home` : `It is ${players[turn].name}'s turn`}
      side={
        <>
          <Banner>{winner ?? (card ? `${players[turn].name} drew ${cardLabel(card)}` : extra ? `${players[turn].name} draws again` : `${players[turn].name} draws`)}</Banner>
          {!winner && !card ? (
            <button className="btn solid" onClick={draw}>
              Draw
            </button>
          ) : null}
          <div className="stack">
            {options.map((choice) => (
              <button key={choice.label} className="btn ghost" onClick={() => choose(choice)}>
                {choice.label}
              </button>
            ))}
          </div>
          <div className="stack">
            {players.map((p, i) => (
              <p key={p.id}>
                <i className="swatch" style={{ background: p.color }} /> {p.name}: {pawns[i].filter((s) => s.z === "safe" && s.n === 5).length}/4 home
              </p>
            ))}
          </div>
          <Log lines={log} />
        </>
      }
    >
      <div className="sorry-board" style={{ gridTemplateColumns: "repeat(16, 1fr)", gridTemplateRows: "repeat(16, 1fr)" }}>
        {cells.map((cell) => {
          const onSlide = [0, 1, 2, 3].some((c) => {
            const s = startOf(c);
            const along = (cell.i - s + 60) % 60;
            return (along >= 1 && along <= 4) || (along >= 9 && along <= 13);
          });
          return (
            <div key={cell.i} className={`s-space ${onSlide ? "slide" : ""}`} style={{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }}>
              {cell.i % 15 === 0 ? "★" : ""}
              <span className="dots">
                {pawns.flatMap((set, pi) => set.map((s, pawn) => (s.z === "track" && s.i === cell.i ? <i key={`${pi}${pawn}`} className="pawn" style={{ background: players[pi].color || COLORS[pi] }} /> : null)))}
              </span>
            </div>
          );
        })}
        <div style={{ gridColumn: "3 / 15", gridRow: "3 / 15", display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <h2>Sorry!</h2>
            <p>Stars are the starts. Shaded runs are slides.</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}
