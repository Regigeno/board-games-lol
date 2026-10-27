import { useState } from "react";
import { Frame, Log, PassScreen } from "../components/ui";
import { burns, freshShDeck, playable, sameRank, shLabel, type SHCard } from "../logic/shithead";
import { shuffle } from "../logic/util";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "shithead")!;

type Seat = { hand: SHCard[]; up: SHCard[]; down: SHCard[]; place: number | null };

function rankKey(r: number) {
  if (r === 2 || r === 10) return 99;
  return r === 1 ? 14 : r;
}

export function ShitheadGame({ players, onExit }: GameProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [deck, setDeck] = useState<SHCard[]>([]);
  const [pile, setPile] = useState<SHCard[]>([]);
  const [turn, setTurn] = useState(0);
  const [locked, setLocked] = useState(true);
  const [sel, setSel] = useState<number[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [places, setPlaces] = useState(0);

  function boot() {
    let cards = shuffle(freshShDeck());
    const next: Seat[] = players.map(() => ({ hand: [], up: [], down: [], place: null }));
    for (const s of next) s.down = cards.splice(0, 3);
    for (const s of next) s.up = cards.splice(0, 3);
    for (const s of next) s.hand = cards.splice(0, 3);
    let starter = 0;
    let best = 99;
    next.forEach((s, i) => {
      const low = Math.min(...s.hand.map((c) => rankKey(c.r)));
      if (low < best) {
        best = low;
        starter = i;
      }
    });
    setSeats(next);
    setDeck(cards);
    setPile([]);
    setTurn(starter);
    setLocked(true);
    setSel([]);
    setPlaces(0);
    setReady(true);
    setLog([`${players[starter].name} starts`]);
  }

  if (!ready) {
    return (
      <Frame meta={meta} onExit={onExit} status="Deal">
        <button className="btn solid big" onClick={boot}>
          Deal nine each
        </button>
      </Frame>
    );
  }

  const seat = seats[turn];
  const finished = seats.filter((s) => s.place === null).length <= 1 && places > 0;

  function source(): SHCard[] {
    if (!seat) return [];
    if (seat.hand.length) return seat.hand;
    if (seat.up.length) return seat.up;
    return seat.down;
  }
  const zone = !seat ? "hand" : seat.hand.length ? "hand" : seat.up.length ? "up" : "down";
  const cards = source();
  const chosen = sel.map((i) => cards[i]).filter(Boolean);

  function finishSeat(next: Seat[], index: number, soFar: number) {
    if (next[index].place !== null) return soFar;
    if (next[index].hand.length || next[index].up.length || next[index].down.length) return soFar;
    next[index] = { ...next[index], place: soFar + 1 };
    return soFar + 1;
  }

  function pass(next: Seat[], from: number, soFar: number) {
    let n = (from + 1) % players.length;
    let guard = 0;
    while (next[n].place !== null && guard++ < players.length) n = (n + 1) % players.length;
    const remaining = next.filter((s) => s.place === null);
    if (remaining.length <= 1) {
      const last = next.findIndex((s) => s.place === null);
      if (last >= 0) next[last] = { ...next[last], place: soFar + 1 };
      setSeats(next);
      setPlaces(soFar + 1);
      setLocked(false);
      return;
    }
    setSeats(next);
    setPlaces(soFar);
    setTurn(n);
    setSel([]);
    setLocked(true);
  }

  function play() {
    if (!chosen.length || !sameRank(chosen)) return;
    const blind = zone === "down";
    if (!blind && chosen.some((c) => !playable(c, pile))) return;
    if (blind && chosen.length !== 1) return;
    let nextPile = [...pile, ...chosen];
    const next = seats.map((s) => ({ ...s, hand: s.hand.slice(), up: s.up.slice(), down: s.down.slice() }));
    const remove = new Set(chosen.map((c) => c.id));
    next[turn][zone] = next[turn][zone].filter((c) => !remove.has(c.id));
    if (blind && !playable(chosen[0], pile)) {
      next[turn].hand = [...next[turn].hand, ...nextPile];
      setPile([]);
      setLog((l) => [...l, `${players[turn].name} flips ${shLabel(chosen[0].r)} and picks up the pile`]);
      pass(next, turn, places);
      return;
    }
    let pack = deck.slice();
    if (zone === "hand") {
      while (next[turn].hand.length < 3 && pack.length) next[turn].hand.push(pack.shift()!);
    }
    const burned = burns(nextPile);
    if (burned) nextPile = [];
    setDeck(pack);
    setPile(nextPile);
    setLog((l) => [...l, `${players[turn].name} plays ${chosen.map((c) => shLabel(c.r)).join(" ")}${burned ? " and burns the pile" : ""}`]);
    const placed = finishSeat(next, turn, places);
    if (burned && next[turn].place === null) {
      setSeats(next);
      setPlaces(placed);
      setSel([]);
      return;
    }
    pass(next, turn, placed);
  }

  function pickup() {
    const next = seats.map((s) => ({ ...s, hand: s.hand.slice(), up: s.up.slice(), down: s.down.slice() }));
    next[turn].hand = [...next[turn].hand, ...pile];
    setPile([]);
    setLog((l) => [...l, `${players[turn].name} picks up the pile`]);
    pass(next, turn, places);
  }

  if (locked && !finished) {
    return (
      <Frame meta={meta} onExit={onExit} status="Private turn">
        <PassScreen name={players[turn].name} color={players[turn].color} onContinue={() => setLocked(false)} />
      </Frame>
    );
  }

  const legal = zone !== "down" && chosen.length > 0 && sameRank(chosen) && chosen.every((c) => playable(c, pile));

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={finished ? `${players[seats.findIndex((s) => s.place === players.length)]?.name ?? "Someone"} is the shithead` : `It is ${players[turn].name}'s turn`}
      side={
        <>
          <div className="card-row">
            {pile.length ? <CardFace r={pile[pile.length - 1].r} /> : <div className="card" style={{ opacity: 0.4 }}>Empty</div>}
            <span>{pile.length} in the pile · {deck.length} left</span>
          </div>
          <div className="actions">
            <button className="btn solid" disabled={zone === "down" ? sel.length !== 1 : !legal} onClick={play}>
              Play
            </button>
            <button className="btn ghost" disabled={!pile.length || zone === "down"} onClick={pickup}>
              Pick up
            </button>
            {finished ? (
              <button className="btn solid" onClick={boot}>
                Deal again
              </button>
            ) : null}
          </div>
          <div className="stack">
            {players.map((p, i) => (
              <p key={p.id}>
                {p.name}: {seats[i].place ? `#${seats[i].place}` : `${seats[i].hand.length + seats[i].up.length + seats[i].down.length} cards`}
              </p>
            ))}
          </div>
          <Log lines={log} />
        </>
      }
    >
      <div className="stack">
        <p>{zone === "down" ? "Face-down cards. Flip one." : zone === "up" ? "Face-up cards." : "Your hand."}</p>
        <div className="hand">
          {cards.map((card, i) =>
            zone === "down" ? (
              <button key={card.id} className={`card back ${sel.includes(i) ? "sel" : ""}`} onClick={() => setSel([i])} aria-label="Face-down card" />
            ) : (
              <button key={card.id} className={`card ${sel.includes(i) ? "sel" : ""}`} onClick={() => setSel((cur) => (cur.includes(i) ? cur.filter((n) => n !== i) : [...cur, i]))}>
                <span className="big">{shLabel(card.r)}</span>
              </button>
            ),
          )}
        </div>
        {zone !== "down" ? (
          <div className="card-row">
            {seats[turn].up.map((c) => (
              <span key={c.id} className="card" style={{ opacity: 0.7 }}>
                <span className="big">{shLabel(c.r)}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Frame>
  );
}

function CardFace({ r }: { r: number }) {
  return (
    <div className="card">
      <span className="big">{shLabel(r)}</span>
    </div>
  );
}
