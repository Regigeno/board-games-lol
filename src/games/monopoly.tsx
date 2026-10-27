import { useState } from "react";
import { Banner, Die, Frame, Log } from "../components/ui";
import {
  BOARD,
  CHEST,
  CHANCE,
  GROUP_COLOR,
  ownsSet,
  rentFor,
  spacePos,
  type CardFx,
  type Deed,
} from "../logic/monopoly";
import { shuffle } from "../logic/util";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "monopoly")!;

type Guy = { pos: number; cash: number; jail: number; out: boolean; free: number };
type Auction = { space: number; bid: number; leader: number | null; passed: number[]; seat: number };
type Debt = { from: number; to: number | "bank"; amount: number; space?: number };

export function MonopolyGame({ players, onExit }: GameProps) {
  const [guys, setGuys] = useState<Guy[]>(() => players.map(() => ({ pos: 0, cash: 1500, jail: 0, out: false, free: 0 })));
  const [deeds, setDeeds] = useState<Deed[]>(() => BOARD.map(() => ({ owner: null, houses: 0, mortgaged: false })));
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<number[] | null>(null);
  const [doubles, setDoubles] = useState(0);
  const [phase, setPhase] = useState<"roll" | "buy" | "manage" | "auction" | "debt">("roll");
  const [offer, setOffer] = useState<number | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [debt, setDebt] = useState<Debt | null>(null);
  const [chance, setChance] = useState(() => shuffle(CHANCE));
  const [chest, setChest] = useState(() => shuffle(CHEST));
  const [cardText, setCardText] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(["Each player starts with $1,500."]);
  const [tradeWith, setTradeWith] = useState(1);
  const [giveCash, setGiveCash] = useState(0);
  const [wantCash, setWantCash] = useState(0);

  const living = guys.map((g, i) => (g.out ? -1 : i)).filter((i) => i >= 0);
  const winner = living.length === 1 ? living[0] : null;

  function logLine(s: string) {
    setLog((l) => [...l, s]);
  }

  function nextLiving(from: number) {
    for (let s = 1; s <= players.length; s++) {
      const i = (from + s) % players.length;
      if (!guys[i].out) return i;
    }
    return from;
  }

  function moveTo(list: Guy[], who: number, dest: number, collect: boolean) {
    if (collect) {
      const pass = dest < list[who].pos;
      if (pass || dest === 0) list[who].cash += 200;
    }
    list[who].pos = dest;
  }

  function owe(list: Guy[], from: number, to: number | "bank", amount: number, board = deeds): boolean {
    if (amount <= 0) return true;
    if (list[from].cash >= amount) {
      list[from].cash -= amount;
      if (to !== "bank") list[to].cash += amount;
      return true;
    }
    setDebt({ from, to, amount });
    setPhase("debt");
    setGuys(list.map((g) => ({ ...g })));
    setDeeds(board.map((d) => ({ ...d })));
    return false;
  }

  function resolve(list: Guy[], board: Deed[], who: number, roll: number[], doublesNow: boolean) {
    const space = BOARD[list[who].pos];
    if (space.kind === "goto") {
      list[who].pos = 10;
      list[who].jail = 3;
      logLine(`${players[who].name} goes to jail`);
      finish(list, board, who, false);
      return;
    }
    if (space.kind === "tax") {
      logLine(`${players[who].name} pays ${space.name}`);
      if (!owe(list, who, "bank", space.tax ?? 0, board)) return;
      finish(list, board, who, doublesNow);
      return;
    }
    if (space.kind === "chance" || space.kind === "chest") {
      drawCard(list, board, who, space.kind, roll, doublesNow);
      return;
    }
    if (space.kind === "prop") {
      const deed = board[space.i];
      if (deed.owner === null) {
        setGuys(list);
        setDeeds(board);
        setOffer(space.i);
        setPhase("buy");
        setDice(roll);
        return;
      }
      if (deed.owner !== who) {
        const rent = rentFor(space, deed, board, roll[0] + roll[1]);
        logLine(`${players[who].name} pays $${rent} rent to ${players[deed.owner].name}`);
        if (!owe(list, who, deed.owner, rent, board)) return;
      }
    }
    finish(list, board, who, doublesNow);
  }

  function drawCard(list: Guy[], board: Deed[], who: number, kind: "chance" | "chest", roll: number[], doublesNow: boolean) {
    const pile = kind === "chance" ? chance.slice() : chest.slice();
    const fx = pile.shift() ?? (kind === "chance" ? CHANCE[0] : CHEST[0]);
    if (!pile.length) pile.push(...shuffle(kind === "chance" ? CHANCE : CHEST));
    if (kind === "chance") setChance(pile);
    else setChest(pile);
    setCardText(fx.text);
    logLine(fx.text);
    applyFx(list, board, who, fx, roll, doublesNow);
  }

  function applyFx(list: Guy[], board: Deed[], who: number, fx: CardFx, roll: number[], doublesNow: boolean) {
    if (fx.type === "cash") {
      if (fx.n >= 0) list[who].cash += fx.n;
      else if (!owe(list, who, "bank", -fx.n, board)) return;
    } else if (fx.type === "move") {
      moveTo(list, who, fx.to, true);
      resolve(list, board, who, roll, doublesNow);
      return;
    } else if (fx.type === "jail") {
      list[who].pos = 10;
      list[who].jail = 3;
      finish(list, board, who, false);
      return;
    } else if (fx.type === "back") {
      const dest = (list[who].pos - fx.n + 40) % 40;
      list[who].pos = dest;
      resolve(list, board, who, roll, doublesNow);
      return;
    } else if (fx.type === "out") {
      list[who].free += 1;
    } else if (fx.type === "each") {
      for (const i of living) {
        if (i === who) continue;
        if (fx.n >= 0) {
          if (!owe(list, i, who, fx.n, board)) return;
        } else if (!owe(list, who, i, -fx.n, board)) return;
      }
    } else if (fx.type === "repair") {
      let due = 0;
      board.forEach((d, i) => {
        if (d.owner !== who || d.houses === 0) return;
        const sp = BOARD[i];
        if (sp.kind !== "prop") return;
        due += d.houses >= 5 ? fx.hotel : d.houses * fx.house;
      });
      if (due && !owe(list, who, "bank", due, board)) return;
    } else if (fx.type === "nearest") {
      let dest = list[who].pos;
      for (let s = 1; s <= 40; s++) {
        const i = (list[who].pos + s) % 40;
        const sp = BOARD[i];
        if (sp.kind === "prop" && sp.group === (fx.what === "rr" ? "rr" : "util")) {
          dest = i;
          break;
        }
      }
      moveTo(list, who, dest, true);
      const sp = BOARD[dest];
      if (sp.kind === "prop" && board[dest].owner !== null && board[dest].owner !== who) {
        const rent = fx.what === "rr" ? rentFor(sp, board[dest], board, 0, true) : (roll[0] + roll[1]) * 10;
        if (!owe(list, who, board[dest].owner as number, rent, board)) return;
        finish(list, board, who, doublesNow);
        return;
      }
      resolve(list, board, who, roll, doublesNow);
      return;
    }
    finish(list, board, who, doublesNow);
  }

  function finish(list: Guy[], board: Deed[], who: number, again: boolean) {
    setGuys(list.map((g) => ({ ...g })));
    setDeeds(board.map((d) => ({ ...d })));
    if (list[who].out) {
      setTurn(nextLiving(who));
      setPhase("roll");
      setDoubles(0);
      setDice(null);
      return;
    }
    if (again) {
      setPhase("roll");
      setDice(null);
      return;
    }
    setPhase("manage");
    setDice(null);
    setDoubles(0);
  }

  function roll() {
    if (winner !== null || phase !== "roll") return;
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    const list = guys.map((g) => ({ ...g }));
    const board = deeds.map((d) => ({ ...d }));
    setDice([a, b]);
    const who = turn;
    if (list[who].jail > 0) {
      if (a === b) {
        list[who].jail = 0;
        logLine(`${players[who].name} rolls doubles and leaves jail`);
      } else if (list[who].jail === 1) {
        list[who].cash -= 50;
        list[who].jail = 0;
        logLine(`${players[who].name} pays $50 and leaves jail`);
      } else {
        list[who].jail -= 1;
        logLine(`${players[who].name} stays in jail`);
        finish(list, board, who, false);
        return;
      }
    }
    if (a === b) {
      const streak = doubles + 1;
      setDoubles(streak);
      if (streak === 3 && list[who].jail === 0) {
        list[who].pos = 10;
        list[who].jail = 3;
        logLine(`${players[who].name} rolls a third double and goes to jail`);
        finish(list, board, who, false);
        return;
      }
    }
    const dest = (list[who].pos + a + b) % 40;
    moveTo(list, who, dest, true);
    logLine(`${players[who].name} rolls ${a} and ${b}, lands on ${BOARD[dest].name}`);
    resolve(list, board, who, [a, b], a === b && doubles + 1 < 3);
  }

  function buy() {
    if (offer === null) return;
    const space = BOARD[offer];
    if (space.kind !== "prop") return;
    const list = guys.map((g) => ({ ...g }));
    const board = deeds.map((d) => ({ ...d }));
    if (list[turn].cash < space.price) return;
    list[turn].cash -= space.price;
    board[offer].owner = turn;
    logLine(`${players[turn].name} buys ${space.name}`);
    setOffer(null);
    finish(list, board, turn, doubles > 0 && dice !== null && dice[0] === dice[1]);
  }

  function startAuction() {
    if (offer === null) return;
    setAuction({ space: offer, bid: 0, leader: null, passed: [], seat: nextLiving(turn) });
    setOffer(null);
    setPhase("auction");
  }

  function passBid() {
    if (!auction) return;
    const passed = [...auction.passed, auction.seat];
    const still = living.filter((i) => !passed.includes(i));
    if (auction.leader !== null && (still.length === 0 || (still.length === 1 && still[0] === auction.leader))) {
      const closed = { ...auction, passed };
      setAuction(closed);
      const space = BOARD[auction.space];
      if (space.kind !== "prop") return;
      const nextGuys = guys.map((g) => ({ ...g }));
      const nextDeeds = deeds.map((d) => ({ ...d }));
      nextGuys[auction.leader].cash -= auction.bid;
      nextDeeds[auction.space].owner = auction.leader;
      logLine(`${players[auction.leader].name} wins the auction at $${auction.bid}`);
      setAuction(null);
      finish(nextGuys, nextDeeds, turn, false);
      return;
    }
    if (auction.leader === null && still.length === 0) {
      logLine(`${BOARD[auction.space].name} stays with the bank`);
      setAuction(null);
      setPhase("manage");
      return;
    }
    let seat = nextLiving(auction.seat);
    while (passed.includes(seat)) seat = nextLiving(seat);
    setAuction({ ...auction, passed, seat });
  }

  function raiseBid() {
    if (!auction) return;
    const amount = auction.bid + 10;
    if (guys[auction.seat].cash < amount) return;
    let seat = nextLiving(auction.seat);
    const passed = auction.passed.filter((i) => i !== auction.seat);
    while (passed.includes(seat)) seat = nextLiving(seat);
    setAuction({ ...auction, bid: amount, leader: auction.seat, passed, seat });
  }

  function endTurn() {
    setCardText(null);
    setTurn(nextLiving(turn));
    setPhase("roll");
    setDoubles(0);
  }

  function build(index: number, up: boolean) {
    const space = BOARD[index];
    if (space.kind !== "prop" || space.house === 0) return;
    const board = deeds.map((d) => ({ ...d }));
    const list = guys.map((g) => ({ ...g }));
    const group = BOARD.filter((s) => s.kind === "prop" && s.group === space.group).map((s) => s.i);
    if (!ownsSet(turn, space.group, board)) return;
    if (up) {
      if (board[index].houses >= 5 || list[turn].cash < space.house) return;
      const heights = group.map((i) => board[i].houses);
      if (board[index].houses + 1 > Math.min(...heights) + 1) return;
      board[index].houses += 1;
      list[turn].cash -= space.house;
    } else {
      if (board[index].houses <= 0) return;
      const heights = group.map((i) => board[i].houses);
      if (board[index].houses - 1 < Math.max(...heights) - 1) return;
      board[index].houses -= 1;
      list[turn].cash += space.house / 2;
    }
    setDeeds(board);
    setGuys(list);
  }

  function mortgage(index: number) {
    const space = BOARD[index];
    if (space.kind !== "prop") return;
    const board = deeds.map((d) => ({ ...d }));
    const list = guys.map((g) => ({ ...g }));
    if (board[index].owner !== turn) return;
    const group = BOARD.filter((s) => s.kind === "prop" && s.group === space.group);
    if (group.some((s) => board[s.i].houses > 0)) return;
    if (board[index].mortgaged) {
      const cost = Math.round(space.mortgage * 1.1);
      if (list[turn].cash < cost) return;
      list[turn].cash -= cost;
      board[index].mortgaged = false;
    } else {
      board[index].mortgaged = true;
      list[turn].cash += space.mortgage;
    }
    setDeeds(board);
    setGuys(list);
  }

  function payDebt() {
    if (!debt) return;
    if (guys[debt.from].cash < debt.amount) return;
    const list = guys.map((g) => ({ ...g }));
    list[debt.from].cash -= debt.amount;
    if (debt.to !== "bank") list[debt.to].cash += debt.amount;
    setDebt(null);
    finish(list, deeds, debt.from, false);
  }

  function bankrupt() {
    if (!debt) return;
    const list = guys.map((g) => ({ ...g }));
    const board = deeds.map((d) => ({ ...d }));
    list[debt.from].out = true;
    list[debt.from].cash = 0;
    board.forEach((d) => {
      if (d.owner === debt.from) {
        d.owner = debt.to === "bank" ? null : debt.to;
        d.houses = 0;
        if (debt.to === "bank") d.mortgaged = false;
      }
    });
    logLine(`${players[debt.from].name} is bankrupt`);
    setDebt(null);
    setGuys(list);
    setDeeds(board);
    if (list.filter((g) => !g.out).length <= 1) {
      setPhase("roll");
      return;
    }
    let nxt = (debt.from + 1) % players.length;
    for (let s = 0; s < players.length; s++) {
      if (!list[nxt].out) break;
      nxt = (nxt + 1) % players.length;
    }
    setTurn(nxt);
    setPhase("roll");
  }

  function proposeTrade() {
    const other = tradeWith;
    if (other === turn || guys[other].out) return;
    if (giveCash > guys[turn].cash || wantCash > guys[other].cash) return;
    const list = guys.map((g) => ({ ...g }));
    list[turn].cash += wantCash - giveCash;
    list[other].cash += giveCash - wantCash;
    logLine(`${players[turn].name} trades $${giveCash} to ${players[other].name} for $${wantCash}`);
    setGuys(list);
  }

  const me = guys[turn];

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={winner !== null ? `${players[winner].name} owns the table` : `It is ${players[turn].name}'s turn`}
      wide
      side={
        <>
          <Banner>
            {winner !== null ? `${players[winner].name} wins` : `${players[turn].name} · $${me?.cash ?? 0}${me?.jail ? " · in jail" : ""}`}
          </Banner>
          {dice ? (
            <div className="actions">
              <Die value={dice[0]} />
              <Die value={dice[1]} />
            </div>
          ) : null}
          {cardText ? <p>{cardText}</p> : null}
          {phase === "roll" && winner === null ? (
            <button className="btn solid" onClick={roll}>
              {me.jail ? "Try to leave jail" : "Roll"}
            </button>
          ) : null}
          {me.jail > 0 && phase === "roll" && me.free > 0 ? (
            <button
              className="btn ghost"
              onClick={() => {
                const list = guys.map((g) => ({ ...g }));
                list[turn].free -= 1;
                list[turn].jail = 0;
                setGuys(list);
                logLine(`${players[turn].name} uses a release card`);
              }}
            >
              Use a release card
            </button>
          ) : null}
          {phase === "buy" && offer !== null && BOARD[offer].kind === "prop" ? (
            <div className="stack">
              <p>Buy {BOARD[offer].name} for ${BOARD[offer].kind === "prop" ? BOARD[offer].price : 0}?</p>
              <div className="actions">
                <button className="btn solid" onClick={buy}>
                  Buy
                </button>
                <button className="btn ghost" onClick={startAuction}>
                  Auction
                </button>
              </div>
            </div>
          ) : null}
          {phase === "auction" && auction ? (
            <div className="stack">
              <p>
                Auction for {BOARD[auction.space].name}. Bid ${auction.bid || 0}. {players[auction.seat].name} to speak.
              </p>
              <div className="actions">
                <button className="btn solid" onClick={raiseBid}>
                  Bid ${auction.bid + 10}
                </button>
                <button className="btn ghost" onClick={passBid}>
                  Pass
                </button>
              </div>
            </div>
          ) : null}
          {phase === "debt" && debt ? (
            <div className="stack">
              <p>
                {players[debt.from].name} owes ${debt.amount}. Cash ${guys[debt.from].cash}. Sell houses or mortgage, then pay.
              </p>
              <div className="actions">
                <button className="btn solid" disabled={guys[debt.from].cash < debt.amount} onClick={payDebt}>
                  Pay
                </button>
                <button className="btn danger" onClick={bankrupt}>
                  Go bankrupt
                </button>
              </div>
            </div>
          ) : null}
          {phase === "manage" ? (
            <div className="stack">
              <p>Build, mortgage, or trade, then end the turn.</p>
              <div className="actions">
                <button className="btn solid" onClick={endTurn}>
                  End turn
                </button>
              </div>
              <label className="field">
                Trade cash with
                <select value={tradeWith} onChange={(e) => setTradeWith(Number(e.target.value))}>
                  {players.map((p, i) => (
                    <option key={p.id} value={i} disabled={i === turn || guys[i].out}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                You pay
                <input className="inline-input" type="number" value={giveCash} onChange={(e) => setGiveCash(Number(e.target.value) || 0)} />
              </label>
              <label className="field">
                You receive
                <input className="inline-input" type="number" value={wantCash} onChange={(e) => setWantCash(Number(e.target.value) || 0)} />
              </label>
              <button className="btn ghost" onClick={proposeTrade}>
                Make the trade
              </button>
            </div>
          ) : null}
          <div className="stack">
            {players.map((p, i) => (
              <p key={p.id}>
                <i className="swatch" style={{ background: p.color }} /> {p.name}: {guys[i].out ? "out" : `$${guys[i].cash}`}
              </p>
            ))}
          </div>
          <Log lines={log} />
        </>
      }
    >
      <div className="mono">
        {BOARD.map((space) => {
          const pos = spacePos(space.i);
          const deed = deeds[space.i];
          return (
            <div key={space.i} className={`space ${space.kind === "go" || space.kind === "jail" || space.kind === "parking" || space.kind === "goto" ? "corner" : ""}`} style={{ gridColumn: pos.gridColumn, gridRow: pos.gridRow }}>
              {space.kind === "prop" ? <span className="band" style={{ background: GROUP_COLOR[space.group] }} /> : null}
              <span className="nm">{space.name}</span>
              {space.kind === "prop" ? (
                <span className="price">
                  ${space.price}
                  {deed.mortgaged ? " M" : ""}
                  {deed.houses ? ` ${deed.houses === 5 ? "H" : "⌂".repeat(deed.houses)}` : ""}
                </span>
              ) : null}
              <span className="tokens">
                {guys.map((g, i) => (g.pos === space.i && !g.out ? <i key={i} className="token" style={{ background: players[i].color }} title={players[i].name} /> : null))}
              </span>
              {phase === "manage" && space.kind === "prop" && deed.owner === turn ? (
                <span className="actions">
                  {space.house > 0 ? (
                    <>
                      <button className="btn small ink" onClick={() => build(space.i, true)}>+</button>
                      <button className="btn small ink" onClick={() => build(space.i, false)}>-</button>
                    </>
                  ) : null}
                  <button className="btn small ink" onClick={() => mortgage(space.i)}>
                    {deed.mortgaged ? "Lift" : "Mortgage"}
                  </button>
                </span>
              ) : null}
            </div>
          );
        })}
        <div className="mono-center">
          <h2>Monopoly</h2>
          <p>{winner !== null ? `${players[winner].name} takes the last dollar.` : "Pass Go, collect $200."}</p>
        </div>
      </div>
    </Frame>
  );
}
