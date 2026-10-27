import { useState } from "react";
import { PlayingCard } from "../components/cards";
import { Frame } from "../components/ui";
import {
  canFoundation,
  canPlaceTableau,
  cloneSol,
  flipStock,
  freshDeal,
  won,
  type Card,
  type Solitaire,
} from "../logic/solitaire";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "solitaire")!;

type Sel = { zone: "waste" } | { zone: "tab"; col: number; index: number } | { zone: "found"; pile: number };

export function SolitaireGame({ onExit }: GameProps) {
  const [draw, setDraw] = useState<1 | 3>(1);
  const [state, setState] = useState<Solitaire>(() => freshDeal(1));
  const [past, setPast] = useState<Solitaire[]>([]);
  const [sel, setSel] = useState<Sel | null>(null);

  function push(next: Solitaire) {
    setPast((p) => [...p, cloneSol(state)]);
    setState(next);
    setSel(null);
  }

  function take(target: Sel | null = sel): { cards: Card[]; rest: Solitaire } | null {
    if (!target) return null;
    const next = cloneSol(state);
    if (target.zone === "waste") {
      const card = next.waste.pop();
      if (!card) return null;
      return { cards: [card], rest: next };
    }
    if (target.zone === "found") {
      const card = next.foundations[target.pile].pop();
      if (!card) return null;
      return { cards: [card], rest: next };
    }
    const pile = next.tableau[target.col];
    const cards = pile.slice(target.index);
    if (!cards.length || cards.some((c) => !c.up)) return null;
    next.tableau[target.col] = pile.slice(0, target.index);
    const left = next.tableau[target.col];
    if (left.length && !left[left.length - 1].up) left[left.length - 1] = { ...left[left.length - 1], up: true };
    return { cards, rest: next };
  }

  function onTableau(col: number) {
    if (!sel) return;
    const moving = take();
    if (!moving) return;
    if (!canPlaceTableau(moving.rest.tableau[col], moving.cards[0])) return;
    moving.rest.tableau[col] = [...moving.rest.tableau[col], ...moving.cards];
    push(moving.rest);
  }

  function onFoundation(pile: number) {
    const moving = take();
    if (!moving || moving.cards.length !== 1) return;
    const idx = canFoundation(moving.rest.foundations, moving.cards[0]);
    if (idx !== pile) return;
    moving.rest.foundations[pile] = [...moving.rest.foundations[pile], moving.cards[0]];
    push(moving.rest);
  }

  function turnStock() {
    setPast((p) => [...p, cloneSol(state)]);
    setState(flipStock(state));
    setSel(null);
  }

  function autoFoundation(target: Sel) {
    const moving = take(target);
    if (!moving || moving.cards.length !== 1) return;
    const idx = canFoundation(moving.rest.foundations, moving.cards[0]);
    if (idx < 0) return;
    moving.rest.foundations[idx] = [...moving.rest.foundations[idx], moving.cards[0]];
    push(moving.rest);
  }

  const victory = won(state);

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={victory ? "The deck is out" : `Klondike · draw ${state.draw}`}
      side={
        <>
          <div className="actions">
            <button className="btn solid" onClick={turnStock}>
              Turn stock
            </button>
            <button className="btn ghost" disabled={!past.length} onClick={() => { const prev = past[past.length - 1]; setPast(past.slice(0, -1)); setState(prev); setSel(null); }}>
              Undo
            </button>
            <button
              className="btn solid"
              onClick={() => {
                setState(freshDeal(draw));
                setPast([]);
                setSel(null);
              }}
            >
              New deal
            </button>
          </div>
          <div className="actions">
            <button className={`btn ${draw === 1 ? "solid" : "ghost"}`} onClick={() => setDraw(1)}>
              Next deal draws 1
            </button>
            <button className={`btn ${draw === 3 ? "solid" : "ghost"}`} onClick={() => setDraw(3)}>
              Next deal draws 3
            </button>
          </div>
          <p className="muted">Click a card, then its destination. Double-click sends it to a foundation. Draw size applies to the next deal.</p>
        </>
      }
    >
      <div className="stack">
        <div className="card-row">
          <button className="card" aria-label="Stock" style={{ background: "#6e2222", color: "white" }} onClick={turnStock}>
            <span className="big">Draw</span>
          </button>
          {state.waste.at(-1) ? (
            <span onDoubleClick={() => autoFoundation({ zone: "waste" })}>
              <PlayingCard
                {...state.waste.at(-1)!}
                selected={sel?.zone === "waste"}
                onClick={() => setSel({ zone: "waste" })}
              />
            </span>
          ) : (
            <div className="card" style={{ opacity: 0.3 }} />
          )}
          <div style={{ width: 24 }} />
          {state.foundations.map((pile, i) =>
            pile.length ? (
              <span key={i}>
                <PlayingCard {...pile[pile.length - 1]} selected={sel?.zone === "found" && sel.pile === i} onClick={() => (sel ? onFoundation(i) : setSel({ zone: "found", pile: i }))} />
              </span>
            ) : (
              <button key={i} className="card" style={{ opacity: 0.45 }} onClick={() => sel && onFoundation(i)}>
                A
              </button>
            ),
          )}
        </div>
        <div className="card-row" style={{ alignItems: "flex-start" }}>
          {state.tableau.map((pile, col) => (
            <div key={col} className="stack" style={{ minHeight: 120 }}>
              {pile.length === 0 ? (
                <button className="card" style={{ opacity: 0.4 }} onClick={() => onTableau(col)}>
                  K
                </button>
              ) : (
                pile.map((card, index) => (
                  <div key={`${card.s}${card.r}${index}`} style={{ marginTop: index ? -58 : 0 }} onDoubleClick={() => autoFoundation({ zone: "tab", col, index })}>
                    {card.up ? (
                      <PlayingCard
                        {...card}
                        selected={sel?.zone === "tab" && sel.col === col && sel.index === index}
                        onClick={() => (sel ? onTableau(col) : setSel({ zone: "tab", col, index }))}
                      />
                    ) : (
                      <button className="card back" aria-label="Face down" />
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
        {victory ? <BannerWin /> : null}
      </div>
    </Frame>
  );
}

function BannerWin() {
  return <div className="banner">The foundations are complete.</div>;
}
