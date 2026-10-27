import { useState } from "react";
import { Banner, Die, Frame, Log } from "../components/ui";
import { applyStep, legalSteps, other, rollDice, startBackgammon, winnerOf, type BGState, type BGStep, type Side } from "../logic/backgammon";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "backgammon")!;

export function BackgammonGame({ players, onExit }: GameProps) {
  const [state, setState] = useState<BGState>(() => startBackgammon());
  const [score, setScore] = useState({ W: 0, B: 0 });
  const [sel, setSel] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const name = (s: Side) => (s === "W" ? players[0].name : players[1].name);
  const steps = legalSteps(state);
  const done = winnerOf(state);

  function roll() {
    if (state.dice.length || state.offeredBy || done) return;
    const dice = rollDice();
    const next = { ...state, dice };
    setState(next);
    setLog((l) => [...l, `${name(state.turn)} rolls ${dice.join(", ")}`]);
    if (legalSteps(next).length === 0) {
      setLog((l) => [...l, `${name(state.turn)} cannot move`]);
    }
  }

  function endTurn(current = state) {
    const win = winnerOf(current);
    if (win) {
      const points = win.multiplier * current.cube;
      setScore((s) => ({ ...s, [win.side]: s[win.side] + points }));
      setLog((l) => [...l, `${name(win.side)} wins ${points}`]);
      return;
    }
    setState({ ...current, turn: other(current.turn), dice: [] });
    setSel(null);
  }

  function play(step: BGStep) {
    const next = applyStep(state, step);
    setState(next);
    setSel(null);
    if (next.dice.length === 0 || legalSteps(next).length === 0) endTurn(next);
  }

  function offer() {
    if (state.dice.length || state.offeredBy) return;
    if (state.cubeOwner !== "C" && state.cubeOwner !== state.turn) return;
    setState({ ...state, offeredBy: state.turn });
  }

  function answer(accept: boolean) {
    if (!state.offeredBy) return;
    if (!accept) {
      const points = state.cube;
      const winner = state.offeredBy;
      setScore((s) => ({ ...s, [winner]: s[winner] + points }));
      setLog((l) => [...l, `${name(other(winner))} declines. ${name(winner)} scores ${points}`]);
      const fresh = startBackgammon();
      fresh.turn = other(winner);
      setState(fresh);
      return;
    }
    setState({
      ...state,
      cube: state.cube * 2,
      cubeOwner: other(state.offeredBy),
      offeredBy: null,
    });
    setLog((l) => [...l, `Cube is at ${state.cube * 2}`]);
  }

  const top = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  const bottom = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={done ? `${name(done.side)} bears off` : `It is ${name(state.turn)}'s turn`}
      side={
        <>
          <Banner>
            {done ? `${name(done.side)} wins` : `${name(state.turn)} ${state.dice.length ? `plays ${state.dice.join(" ")}` : "to roll"}`}
          </Banner>
          <p>
            {players[0].name} {score.W} · {players[1].name} {score.B} · cube {state.cube}
          </p>
          <div className="actions">
            {state.dice.map((d, i) => (
              <Die key={i} value={d} />
            ))}
          </div>
          {!done && !state.offeredBy ? (
            <div className="actions">
              <button className="btn solid" disabled={state.dice.length > 0} onClick={roll}>
                Roll
              </button>
              <button className="btn ghost" disabled={state.dice.length > 0 || (state.cubeOwner !== "C" && state.cubeOwner !== state.turn)} onClick={offer}>
                Double
              </button>
              {state.dice.length > 0 && steps.length === 0 ? (
                <button className="btn ghost" onClick={() => endTurn()}>
                  End turn
                </button>
              ) : null}
            </div>
          ) : null}
          {state.offeredBy ? (
            <div className="stack">
              <p>{name(other(state.offeredBy))}, take the cube at {state.cube * 2}?</p>
              <div className="actions">
                <button className="btn solid" onClick={() => answer(true)}>
                  Take
                </button>
                <button className="btn danger" onClick={() => answer(false)}>
                  Pass
                </button>
              </div>
            </div>
          ) : null}
          {done ? (
            <button className="btn solid" onClick={() => setState(startBackgammon())}>
              Next game
            </button>
          ) : null}
          <Log lines={log} />
        </>
      }
    >
      <div className="bg-board">
        <Tray count={state.w[25]} label="W off" />
        <Quarter points={top.slice(0, 6)} bottom={false} state={state} sel={sel} steps={steps} onSelect={setSel} onPlay={play} />
        <button className={`bar ${steps.some((s) => s.from === 0) ? "legal" : ""}`} onClick={() => setSel(0)}>
          {Array.from({ length: state.w[0] }, (_, i) => (
            <i key={`w${i}`} className="pip w" />
          ))}
          {Array.from({ length: state.b[0] }, (_, i) => (
            <i key={`b${i}`} className="pip b" />
          ))}
        </button>
        <Quarter points={top.slice(6)} bottom={false} state={state} sel={sel} steps={steps} onSelect={setSel} onPlay={play} />
        <Tray count={state.b[25]} label="B off" />
        <Tray count={0} label="" />
        <Quarter points={bottom.slice(0, 6)} bottom state={state} sel={sel} steps={steps} onSelect={setSel} onPlay={play} />
        <div />
        <Quarter points={bottom.slice(6)} bottom state={state} sel={sel} steps={steps} onSelect={setSel} onPlay={play} />
        <div />
      </div>
    </Frame>
  );
}

function Quarter({
  points,
  bottom,
  state,
  sel,
  steps,
  onSelect,
  onPlay,
}: {
  points: number[];
  bottom: boolean;
  state: BGState;
  sel: number | null;
  steps: BGStep[];
  onSelect: (n: number) => void;
  onPlay: (s: BGStep) => void;
}) {
  return (
    <div className="bg-quadrant">
      {points.map((n) => {
        const w = state.w[n];
        const b = state.b[n];
        const side = w > 0 ? "w" : b > 0 ? "b" : "";
        const count = w + b;
        const legal = steps.some((s) => s.from === sel && s.to === n);
        return (
          <button
            key={n}
            className={`point ${bottom ? "bottom" : ""} ${n % 2 ? "dark" : "light"} ${legal ? "legal" : ""}`}
            onClick={() => {
              const step = steps.find((s) => s.from === sel && s.to === n);
              if (step) onPlay(step);
              else if ((state.turn === "W" && w > 0) || (state.turn === "B" && b > 0)) onSelect(n);
            }}
          >
            <span className="tri" />
            {Array.from({ length: Math.min(count, 5) }, (_, i) => (
              <i key={i} className={`pip ${side}`} />
            ))}
            {count > 5 ? <span style={{ zIndex: 1 }}>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function Tray({ count, label }: { count: number; label: string }) {
  return (
    <div className="off">
      {label}
      <strong>{count || ""}</strong>
    </div>
  );
}
