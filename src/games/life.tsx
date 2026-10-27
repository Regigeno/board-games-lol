import { useState } from "react";
import { Banner, Die, Frame, Log } from "../components/ui";
import { HOUSES, LIFE_CARDS, LIFE_TRACK, retireScore } from "../logic/life";
import { shuffle } from "../logic/util";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "life")!;

type Person = {
  cash: number;
  salary: number;
  kids: number;
  married: boolean;
  houses: { name: string; value: number }[];
  space: number;
  retired: boolean;
  started: boolean;
  college: boolean;
};

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US")}`;
}

export function LifeGame({ players, onExit }: GameProps) {
  const [people, setPeople] = useState<Person[]>(() =>
    players.map(() => ({
      cash: 0,
      salary: 0,
      kids: 0,
      married: false,
      houses: [],
      space: -1,
      retired: false,
      started: false,
      college: false,
    })),
  );
  const [turn, setTurn] = useState(0);
  const [spin, setSpin] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [offer, setOffer] = useState<(typeof HOUSES)[number] | null>(null);
  const [deck, setDeck] = useState(() => shuffle(LIFE_CARDS));

  const person = people[turn];
  const finished = people.every((p) => p.retired);

  function patch(i: number, fn: (p: Person) => Person) {
    setPeople((prev) => prev.map((p, idx) => (idx === i ? fn(p) : p)));
  }

  function advanceFrom(snapshot: Person[]) {
    for (let step = 1; step <= players.length; step++) {
      const i = (turn + step) % players.length;
      if (!snapshot[i].retired) {
        setTurn(i);
        return;
      }
    }
  }

  function start(college: boolean) {
    patch(turn, (p) => ({
      ...p,
      started: true,
      college,
      salary: college ? 90000 : 45000,
      cash: college ? 0 : 200000,
      space: 0,
    }));
    setLog((l) => [...l, `${players[turn].name} ${college ? "finishes college" : "starts a job"}`]);
  }

  function land(p: Person, index: number, note: string[]): { person: Person; house: (typeof HOUSES)[number] | null } {
    const space = LIFE_TRACK[index];
    let next = { ...p, space: index, houses: [...p.houses] };
    let house: (typeof HOUSES)[number] | null = null;
    if (space.kind === "payday") {
      next.cash += next.salary;
      note.push(`payday ${money(next.salary)}`);
    } else if (space.kind === "baby") {
      if (next.kids < 4) {
        next.kids += 1;
        note.push("a child joins the family");
      } else note.push("the house is already full");
    } else if (space.kind === "marriage") {
      if (!next.married) {
        next.married = true;
        next.cash += 20000;
        note.push("gets married and receives $20,000");
      } else note.push("renews the vows");
    } else if (space.kind === "tax") {
      const due = Math.max(20000, Math.round(next.cash * 0.1));
      next.cash -= due;
      note.push(`pays ${money(due)} in taxes`);
    } else if (space.kind === "lawsuit") {
      const due = Math.min(50000, Math.max(0, next.cash));
      next.cash -= due;
      note.push(`pays ${money(due)}`);
    } else if (space.kind === "career") {
      next.salary += 20000;
      note.push("salary rises");
    } else if (space.kind === "life") {
      const card = deck[0] ?? LIFE_CARDS[0];
      setDeck((d) => (d.length > 1 ? d.slice(1) : shuffle(LIFE_CARDS)));
      next.cash += card.money;
      note.push(card.text);
    } else if (space.kind === "house") {
      const owned = new Set(next.houses.map((h) => h.name));
      house = HOUSES.find((h) => !owned.has(h.name) && next.cash >= h.cost) ?? null;
      note.push(house ? `may buy the ${house.name}` : "passes the open houses");
    } else if (space.kind === "stop") {
      next.retired = true;
      note.push("retires");
    } else note.push(space.label);
    return { person: next, house };
  }

  function spinWheel() {
    if (!person.started || person.retired || finished) return;
    const n = 1 + Math.floor(Math.random() * 10);
    setSpin(n);
    const dest = Math.min(LIFE_TRACK.length - 1, person.space + n);
    const note: string[] = [];
    const moved = land(person, dest, note);
    const snapshot = people.map((p, i) => (i === turn ? moved.person : p));
    patch(turn, () => moved.person);
    setOffer(moved.house);
    setLog((l) => [...l, `${players[turn].name} spins ${n}: ${note.join("; ")}`]);
    if (!moved.house) advanceFrom(snapshot);
  }

  function buy(yes: boolean) {
    if (offer && yes) {
      patch(turn, (p) => ({ ...p, cash: p.cash - offer.cost, houses: [...p.houses, { name: offer.name, value: offer.value }] }));
      setLog((l) => [...l, `${players[turn].name} buys the ${offer.name}`]);
    }
    setOffer(null);
    const snapshot = people.map((p, i) =>
      i === turn
        ? {
            ...p,
            cash: yes && offer ? p.cash - offer.cost : p.cash,
            houses: yes && offer ? [...p.houses, { name: offer.name, value: offer.value }] : p.houses,
          }
        : p,
    );
    advanceFrom(snapshot);
  }

  const scores = people.map((p) => retireScore(p.cash, p.kids, p.houses));
  const winner = finished ? scores.indexOf(Math.max(...scores)) : -1;

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={finished ? `${players[winner].name} retires richest` : person.started ? `It is ${players[turn].name}'s turn` : `${players[turn].name} chooses a start`}
      side={
        <>
          <Banner>
            {finished ? `${players[winner].name} wins with ${money(scores[winner])}` : `${players[turn].name} · ${person.started ? money(person.cash) : "choosing a path"}`}
          </Banner>
          {!person.started && !finished ? (
            <div className="actions">
              <button className="btn solid" onClick={() => start(true)}>
                College · $90k salary
              </button>
              <button className="btn solid" onClick={() => start(false)}>
                Career · $200k and $45k
              </button>
            </div>
          ) : null}
          {person.started && !person.retired && !finished && !offer ? (
            <div className="actions">
              {spin ? <Die value={spin} sides={10} /> : null}
              <button className="btn solid" onClick={spinWheel}>
                Spin
              </button>
            </div>
          ) : null}
          {offer ? (
            <div className="stack">
              <p>
                Buy the {offer.name} for {money(offer.cost)}? It is worth {money(offer.value)} at retirement.
              </p>
              <div className="actions">
                <button className="btn solid" onClick={() => buy(true)}>
                  Buy
                </button>
                <button className="btn ghost" onClick={() => buy(false)}>
                  Pass
                </button>
              </div>
            </div>
          ) : null}
          <div className="stack">
            {players.map((p, i) => (
              <p key={p.id}>
                <i className="swatch" style={{ background: p.color }} /> {p.name}: {money(people[i].cash)} · {people[i].kids} kids
                {people[i].retired ? " · retired" : ""}
              </p>
            ))}
          </div>
          <Log lines={log} />
        </>
      }
    >
      <div className="life-path">
        {LIFE_TRACK.map((space, i) => (
          <div key={i} className={`life-space ${people.some((p) => p.space === i) ? "here" : ""}`}>
            <strong>{space.label}</strong>
            <span className="dots">
              {people.map((p, pi) => (p.space === i ? <i key={pi} className="pawn" style={{ background: players[pi].color }} /> : null))}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
