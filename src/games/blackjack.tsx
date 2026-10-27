import { useReducer, useState } from "react";
import { PlayingCard, handValue } from "../components/cards";
import { Banner, Frame, Log } from "../components/ui";
import { shuffle } from "../logic/util";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "blackjack")!;
type Suit = "s" | "h" | "d" | "c";
type BCard = { r: number; s: Suit };
type Hand = { cards: BCard[]; bet: number; done: boolean; fromSplit: boolean };

type Table = {
  deck: BCard[];
  cash: number[];
  hands: Hand[][];
  dealer: BCard[];
  phase: "bet" | "play" | "done";
  seat: number;
  focus: number;
  hideHole: boolean;
  log: string[];
  msg: string;
};

function makeShoe(): BCard[] {
  const cards: BCard[] = [];
  for (let d = 0; d < 4; d++) for (const s of ["s", "h", "d", "c"] as Suit[]) for (let r = 1; r <= 13; r++) cards.push({ r, s });
  return shuffle(cards);
}

function take(deck: BCard[], n: number) {
  const rest = deck.length < n + 12 ? [...deck, ...makeShoe()] : deck.slice();
  return { cards: rest.splice(0, n), deck: rest };
}

function natural(h: Hand) {
  return !h.fromSplit && h.cards.length === 2 && handValue(h.cards) === 21;
}

function cloneHands(hands: Hand[][]) {
  return hands.map((seat) => seat.map((h) => ({ ...h, cards: h.cards.slice() })));
}

export function BlackjackGame({ players, onExit }: GameProps) {
  const [bet, setBet] = useState(25);
  const [table, dispatch] = useReducer(reduce, players.length, init);
  const active = table.phase === "play" ? table.hands[table.seat]?.[table.focus] : undefined;

  function reduce(state: Table, action: { type: string; bet?: number }): Table {
    if (action.type === "reset") {
      return { ...state, phase: "bet", dealer: [], hands: players.map(() => []), hideHole: true, msg: "Place bets. The dealer stands on every 17." };
    }
    if (action.type === "deal") return deal(state, action.bet ?? 25);
    if (action.type === "hit") return hit(state);
    if (action.type === "stand") return finishHand(state);
    if (action.type === "double") return double(state);
    if (action.type === "split") return split(state);
    return state;
  }

  function init(count: number): Table {
    return {
      deck: makeShoe(),
      cash: Array(count).fill(500),
      hands: Array.from({ length: count }, () => []),
      dealer: [],
      phase: "bet",
      seat: 0,
      focus: 0,
      hideHole: true,
      log: [],
      msg: "Place bets. The dealer stands on every 17.",
    };
  }

  function deal(state: Table, stake: number): Table {
    let deck = state.deck;
    const hands: Hand[][] = players.map((_, i) => {
      const wager = Math.min(stake, state.cash[i]);
      return wager >= 5 ? [{ cards: [], bet: wager, done: false, fromSplit: false }] : [];
    });
    const pull = () => {
      const got = take(deck, 1);
      deck = got.deck;
      return got.cards[0];
    };
    for (const seat of hands) if (seat[0]) seat[0].cards.push(pull());
    const up = pull();
    for (const seat of hands) if (seat[0]) seat[0].cards.push(pull());
    const hole = pull();
    const cash = state.cash.map((c, i) => c - (hands[i][0]?.bet ?? 0));
    let next: Table = {
      ...state,
      deck,
      cash,
      hands,
      dealer: [up, hole],
      phase: "play",
      hideHole: true,
      log: [...state.log, `Bets are in. Dealer shows ${face(up)}.`],
      seat: 0,
      focus: 0,
      msg: "",
    };
    const dealerBJ = handValue([up, hole]) === 21 && (up.r === 1 || up.r >= 10);
    if (dealerBJ) {
      next.hands = next.hands.map((seat) => seat.map((h) => ({ ...h, done: true })));
      return settle(next);
    }
    next.hands = next.hands.map((seat) => seat.map((h) => ({ ...h, done: natural(h) })));
    return advance(next, 0, 0);
  }

  function advance(state: Table, seat: number, focus: number): Table {
    const hands = cloneHands(state.hands);
    let s = seat;
    let f = focus;
    while (s < hands.length) {
      const h = hands[s]?.[f];
      if (h && !h.done && handValue(h.cards) < 21) {
        return { ...state, hands, seat: s, focus: f, msg: `${players[s].name}${hands[s].length > 1 ? ` · hand ${f + 1}` : ""}` };
      }
      if (h) hands[s][f] = { ...h, done: true };
      if (h && f + 1 < hands[s].length) f += 1;
      else {
        s += 1;
        f = 0;
      }
    }
    const next = { ...state, hands };
    if (hands.every((seatHands) => seatHands.length === 0 || seatHands.every((h) => handValue(h.cards) > 21))) return settle(next);
    return dealerPlay(next);
  }

  function dealerPlay(state: Table): Table {
    let deck = state.deck;
    const dealer = state.dealer.slice();
    while (handValue(dealer) < 17) {
      const got = take(deck, 1);
      deck = got.deck;
      dealer.push(got.cards[0]);
    }
    return settle({ ...state, deck, dealer, hideHole: false });
  }

  function settle(state: Table): Table {
    const d = handValue(state.dealer);
    const dealerBJ = state.dealer.length === 2 && d === 21;
    const cash = state.cash.slice();
    const log = [...state.log];
    state.hands.forEach((seat, i) => {
      for (const h of seat) {
        const v = handValue(h.cards);
        let back = 0;
        let word = "loses";
        if (v > 21) word = "busts";
        else if (natural(h) && !dealerBJ) {
          back = h.bet + Math.floor(h.bet * 1.5);
          word = "has blackjack";
        } else if (natural(h) && dealerBJ) {
          back = h.bet;
          word = "pushes a blackjack";
        } else if (dealerBJ) word = "loses to blackjack";
        else if (d > 21 || v > d) {
          back = h.bet * 2;
          word = "wins";
        } else if (v === d) {
          back = h.bet;
          word = "pushes";
        }
        cash[i] += back;
        log.push(`${players[i].name} ${word}`);
      }
    });
    return { ...state, cash, log, hideHole: false, phase: "done", msg: `Dealer has ${d > 21 ? "busted" : d}` };
  }

  function hit(state: Table): Table {
    const got = take(state.deck, 1);
    const hands = cloneHands(state.hands);
    const h = hands[state.seat][state.focus];
    h.cards.push(got.cards[0]);
    if (handValue(h.cards) >= 21) h.done = true;
    const next = { ...state, deck: got.deck, hands };
    return h.done ? advance(next, state.seat, state.focus) : next;
  }

  function finishHand(state: Table): Table {
    const hands = cloneHands(state.hands);
    hands[state.seat][state.focus].done = true;
    return advance({ ...state, hands }, state.seat, state.focus);
  }

  function double(state: Table): Table {
    const hands = cloneHands(state.hands);
    const h = hands[state.seat][state.focus];
    if (h.cards.length !== 2 || state.cash[state.seat] < h.bet) return state;
    const cash = state.cash.slice();
    cash[state.seat] -= h.bet;
    h.bet *= 2;
    const got = take(state.deck, 1);
    h.cards.push(got.cards[0]);
    h.done = true;
    return advance({ ...state, cash, deck: got.deck, hands }, state.seat, state.focus);
  }

  function split(state: Table): Table {
    const h = state.hands[state.seat][state.focus];
    if (h.cards.length !== 2 || rank(h.cards[0]) !== rank(h.cards[1]) || state.cash[state.seat] < h.bet || state.hands[state.seat].length > 1) return state;
    const got = take(state.deck, 2);
    const aces = h.cards[0].r === 1;
    const a: Hand = { cards: [h.cards[0], got.cards[0]], bet: h.bet, done: aces, fromSplit: true };
    const b: Hand = { cards: [h.cards[1], got.cards[1]], bet: h.bet, done: aces, fromSplit: true };
    const hands = cloneHands(state.hands);
    hands[state.seat] = [a, b];
    const cash = state.cash.slice();
    cash[state.seat] -= h.bet;
    return advance({ ...state, cash, deck: got.deck, hands }, state.seat, 0);
  }

  const canSplit = !!active && active.cards.length === 2 && rank(active.cards[0]) === rank(active.cards[1]) && table.hands[table.seat].length === 1 && table.cash[table.seat] >= active.bet;
  const canDouble = !!active && active.cards.length === 2 && !active.fromSplit && table.cash[table.seat] >= active.bet;

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={table.msg}
      side={
        <>
          <Banner>{table.msg}</Banner>
          {table.phase === "bet" ? (
            <div className="stack">
              <label className="field">
                Table bet
                <input className="inline-input" type="number" min={5} max={100} value={bet} onChange={(e) => setBet(Math.max(5, Math.min(100, Number(e.target.value) || 5)))} />
              </label>
              <button className="btn solid" onClick={() => dispatch({ type: "deal", bet })}>
                Deal
              </button>
            </div>
          ) : null}
          {table.phase === "play" && active ? (
            <div className="actions">
              <button className="btn solid" onClick={() => dispatch({ type: "hit" })}>Hit</button>
              <button className="btn ghost" onClick={() => dispatch({ type: "stand" })}>Stand</button>
              <button className="btn ghost" disabled={!canDouble} onClick={() => dispatch({ type: "double" })}>Double</button>
              <button className="btn ghost" disabled={!canSplit} onClick={() => dispatch({ type: "split" })}>Split</button>
            </div>
          ) : null}
          {table.phase === "done" ? (
            <button className="btn solid" onClick={() => dispatch({ type: "reset" })}>
              Next round
            </button>
          ) : null}
          <div className="stack">
            {players.map((p, i) => (
              <p key={p.id}>
                <i className="swatch" style={{ background: p.color }} /> {p.name}: ${table.cash[i]}
              </p>
            ))}
          </div>
          <Log lines={table.log} />
        </>
      }
    >
      <div className="bj-table">
        <div>
          <p>Dealer {table.dealer.length && !table.hideHole ? `· ${handValue(table.dealer)}` : ""}</p>
          <div className="card-row">
            {table.dealer.map((c, i) => (
              <PlayingCard key={i} r={c.r} s={c.s} hidden={table.hideHole && i === 1} />
            ))}
          </div>
        </div>
        {players.map((p, i) => (
          <div key={p.id} className="bj-seat" style={{ outline: table.phase === "play" && table.seat === i ? `2px solid ${p.color}` : undefined }}>
            <p>{p.name}</p>
            {(table.hands[i] ?? []).map((h, hi) => (
              <div key={hi} className="card-row">
                {h.cards.map((c, ci) => (
                  <PlayingCard key={ci} r={c.r} s={c.s} />
                ))}
                {h.cards.length ? <span>{handValue(h.cards)} · ${h.bet}</span> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function rank(c: BCard) {
  return Math.min(c.r, 10);
}
function face(c: BCard) {
  const r = c.r === 1 ? "A" : c.r > 10 ? "JQK"[c.r - 11] : String(c.r);
  return `${r}${{ s: "♠", h: "♥", d: "♦", c: "♣" }[c.s]}`;
}
