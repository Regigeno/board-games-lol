import { useEffect, useState, type ReactNode } from "react";
import type { GameMeta, Player } from "../types";

export function PassScreen({
  name,
  color,
  detail,
  action,
  onContinue,
  extra,
}: {
  name: string;
  color?: string;
  detail?: string;
  action?: string;
  onContinue: () => void;
  extra?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  return (
    <div className="pass" role="dialog" aria-modal="true" aria-label={`It is now ${name}'s turn`}>
      <div className="pass-card">
        <p className="eyebrow">Hand over the screen</p>
        <div className="pass-swatch" style={{ background: color ?? "#e4a04a" }} />
        <h2>It is now {name}&apos;s turn.</h2>
        <p className="pass-detail">
          {detail ??
            "Other players, look away. Hidden cards stay covered until this player continues."}
        </p>
        {extra}
        <button className="btn solid big" onClick={onContinue}>
          {action ?? `I’m ${name}`}
        </button>
      </div>
    </div>
  );
}

export function Frame({
  meta,
  onExit,
  status,
  side,
  children,
  wide,
}: {
  meta: GameMeta;
  onExit: () => void;
  status?: ReactNode;
  side?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const [rulesOpen, setRulesOpen] = useState(false);
  return (
    <div className={`table ${wide ? "table-wide" : ""}`}>
      <header className="topbar">
        <button className="btn ghost" onClick={onExit}>
          All games
        </button>
        <div className="topbar-title">
          <h1>{meta.title}</h1>
          {status ? <p className="status">{status}</p> : null}
        </div>
        <button className="btn ghost" onClick={() => setRulesOpen(true)}>
          How to play
        </button>
      </header>
      <div className={side ? "table-body" : "table-body solo"}>
        <div className="table-main">{children}</div>
        {side ? <aside className="side">{side}</aside> : null}
      </div>
      {rulesOpen ? (
        <div className="modal-back" onClick={() => setRulesOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h2>{meta.title}</h2>
            <ul className="rules">
              {meta.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <button className="btn solid" onClick={() => setRulesOpen(false)}>
              Back to the table
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Log({ lines }: { lines: string[] }) {
  return (
    <div className="log" aria-live="polite">
      {lines.length === 0 ? <p className="muted">No moves yet.</p> : null}
      {lines
        .slice()
        .reverse()
        .map((line, i) => (
          <p key={`${i}-${line}`}>{line}</p>
        ))}
    </div>
  );
}

export function Die({ value, sides = 6 }: { value: number; sides?: number }) {
  return (
    <span className={`die ${sides > 6 ? "die-spin" : ""}`} aria-label={`${value}`}>
      {value}
    </span>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return <div className="banner">{children}</div>;
}

export function Setup({
  meta,
  onBack,
  onStart,
}: {
  meta: GameMeta;
  onBack: () => void;
  onStart: (players: Player[]) => void;
}) {
  const [count, setCount] = useState(meta.min);
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: meta.max }, (_, i) => `Player ${i + 1}`),
  );

  return (
    <div className="setup">
      <button className="btn ghost" onClick={onBack}>
        All games
      </button>
      <div className="setup-card">
        <p className="eyebrow">{meta.secret ? "Private hands" : "Open table"}</p>
        <h1>{meta.title}</h1>
        <p className="lede">{meta.blurb}</p>
        {meta.max > 1 ? (
          <>
            <label className="field">
              Players
              <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {Array.from({ length: meta.max - meta.min + 1 }, (_, i) => meta.min + i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="name-grid">
              {names.slice(0, count).map((name, i) => (
                <label key={i} className="field">
                  <span className="name-label">
                    <i className="swatch" style={{ background: palette(i) }} />
                    Seat {i + 1}
                  </span>
                  <input
                    value={name}
                    maxLength={18}
                    onChange={(e) => {
                      const next = [...names];
                      next[i] = e.target.value;
                      setNames(next);
                    }}
                  />
                </label>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">This one is played alone.</p>
        )}
        {meta.secret ? (
          <p className="note">
            When the turn changes, the table covers every hand and waits until the next player confirms they have the screen.
          </p>
        ) : null}
        <button
          className="btn solid big"
          onClick={() =>
            onStart(
              Array.from({ length: meta.max === 1 ? 1 : count }, (_, i) => ({
                id: i,
                name: meta.max === 1 ? "You" : names[i].trim() || `Player ${i + 1}`,
                color: palette(i),
              })),
            )
          }
        >
          {meta.max === 1 ? "Deal" : "Sit down"}
        </button>
      </div>
    </div>
  );
}

function palette(i: number) {
  const colors = ["#d64545", "#2f6fed", "#e2a325", "#1f9d62", "#8d4fd6", "#e07a32", "#1497a6", "#d35d8a"];
  return colors[i % colors.length];
}

export function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const push = (line: string) => setLines((prev) => [...prev, line].slice(-80));
  return { lines, push };
}
