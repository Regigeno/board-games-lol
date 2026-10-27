import { useMemo, useState } from "react";
import { Frame, Log, PassScreen } from "../components/ui";
import {
  COST,
  GEOM,
  RES_COLOR,
  RES_NAME,
  RESOURCES,
  canAfford,
  devDeck,
  emptyHand,
  longestRoad,
  makeBoard,
  pay,
  portAtVertex,
  type Dev,
  type HexTile,
  type Port,
  type Resource,
} from "../logic/catan";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "catan")!;
type Bld = { player: number; city: boolean };

export function CatanGame({ players, onExit }: GameProps) {
  const board = useMemo(() => makeBoard(), []);
  const [tiles] = useState<HexTile[]>(board.tiles);
  const [ports] = useState<Port[]>(board.ports);
  const [roads, setRoads] = useState<Record<string, number | null>>({});
  const [buildings, setBuildings] = useState<Record<string, Bld | null>>({});
  const [hands, setHands] = useState(() => players.map(() => emptyHand()));
  const [devs, setDevs] = useState<Dev[][]>(() => players.map(() => []));
  const [fresh, setFresh] = useState<Dev[][]>(() => players.map(() => []));
  const [knights, setKnights] = useState(() => players.map(() => 0));
  const [deck, setDeck] = useState<Dev[]>(() => devDeck());
  const [bank, setBank] = useState<Record<Resource, number>>({ lumber: 19, brick: 19, wool: 19, grain: 19, ore: 19 });
  const [robber, setRobber] = useState(() => Math.max(0, board.tiles.findIndex((t) => t.res === "desert")));
  const [turn, setTurn] = useState(0);
  const [setupStep, setSetupStep] = useState(0);
  const [pendingRoad, setPendingRoad] = useState<string | null>(null);
  const [phase, setPhase] = useState<"setup" | "roll" | "main" | "rob" | "win">("setup");
  const [cover, setCover] = useState<{ player: number; detail: string } | null>({
    player: 0,
    detail: "Place your first settlement and a road. Other players, look away.",
  });
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [mode, setMode] = useState<"road" | "settlement" | "city" | "robber" | null>(null);
  const [freeRoads, setFreeRoads] = useState(0);
  const [discard, setDiscard] = useState<{ player: number; left: number; picked: Record<Resource, number> } | null>(null);
  const [steal, setSteal] = useState<number[] | null>(null);
  const [offer, setOffer] = useState<{ to: number; give: Record<Resource, number>; want: Record<Resource, number> } | null>(null);
  const [draft, setDraft] = useState(() => emptyHand());
  const [want, setWant] = useState(() => emptyHand());
  const [played, setPlayed] = useState(false);
  const [roadAward, setRoadAward] = useState<number | null>(null);
  const [armyAward, setArmyAward] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const n = players.length;
  const order = useMemo(() => {
    const fwd = Array.from({ length: n }, (_, i) => i);
    return [...fwd, ...fwd.slice().reverse()];
  }, [n]);

  function push(line: string) {
    setLog((l) => [...l, line]);
  }

  function points(player: number, buildingsNow = buildings, devsNow = devs, roadNow = roadAward, armyNow = armyAward) {
    let score = 0;
    for (const b of Object.values(buildingsNow)) if (b?.player === player) score += b.city ? 2 : 1;
    score += devsNow[player].filter((d) => d === "vp").length;
    if (roadNow === player) score += 2;
    if (armyNow === player) score += 2;
    return score;
  }

  function checkWin(player: number, extra?: Partial<{ roads: typeof roads; buildings: typeof buildings; devs: Dev[][]; roadAward: number | null; armyAward: number | null }>) {
    const score = points(player, extra?.buildings ?? buildings, extra?.devs ?? devs, extra?.roadAward === undefined ? roadAward : extra.roadAward, extra?.armyAward === undefined ? armyAward : extra.armyAward);
    if (phase !== "setup" && score >= 10) setWinner(player);
  }

  function setupPlayer() {
    return order[Math.min(setupStep, order.length - 1)];
  }

  function give(hand: Record<Resource, number>, res: Resource, count: number, bankNow: Record<Resource, number>) {
    const got = Math.min(count, bankNow[res]);
    bankNow[res] -= got;
    hand[res] += got;
  }

  function produce(roll: number, handsNow = hands.map((h) => ({ ...h })), bankNow = { ...bank }, buildingsNow = buildings) {
    const demand: { player: number; res: Resource; count: number }[] = [];
    tiles.forEach((tile, hex) => {
      if (tile.num !== roll || tile.res === "desert" || hex === robber) return;
      for (const v of GEOM.hexes[hex].verts) {
        const b = buildingsNow[v];
        if (!b) continue;
        demand.push({ player: b.player, res: tile.res, count: b.city ? 2 : 1 });
      }
    });
    for (const res of RESOURCES) {
      const asks = demand.filter((d) => d.res === res);
      const total = asks.reduce((s, a) => s + a.count, 0);
      if (total === 0 || total > bankNow[res]) continue;
      for (const ask of asks) give(handsNow[ask.player], res, ask.count, bankNow);
    }
    setHands(handsNow);
    setBank(bankNow);
  }

  function awardRoad(roadsNow: typeof roads, buildingsNow: typeof buildings) {
    let best = roadAward;
    let bestLen = best === null ? 4 : longestRoad(roadsNow, buildingsNow, best);
    players.forEach((_, i) => {
      const len = longestRoad(roadsNow, buildingsNow, i);
      if (len >= 5 && (best === null || len > bestLen)) {
        best = i;
        bestLen = len;
      }
    });
    if (best !== null && longestRoad(roadsNow, buildingsNow, best) < 5) best = null;
    setRoadAward(best);
    return best;
  }

  function onVertex(id: string) {
    if (winner !== null || cover) return;
    const player = phase === "setup" ? setupPlayer() : turn;
    if (phase === "setup" && !pendingRoad) {
      if (!openVertex(id)) return;
      const buildingsNow = { ...buildings, [id]: { player, city: false } };
      setBuildings(buildingsNow);
      setPendingRoad(id);
      if (setupStep >= n) {
        const handsNow = hands.map((h) => ({ ...h }));
        const bankNow = { ...bank };
        for (const hex of GEOM.vertices.find((v) => v.id === id)?.hexes ?? []) {
          const tile = tiles[hex];
          if (tile.res !== "desert" && hex !== robber) give(handsNow[player], tile.res, 1, bankNow);
        }
        setHands(handsNow);
        setBank(bankNow);
      }
      return;
    }
    if (mode === "settlement" && canSettle(id, turn)) {
      if (!canAfford(hands[turn], COST.settlement)) return;
      const buildingsNow = { ...buildings, [id]: { player: turn, city: false } };
      const handsNow = hands.map((h, i) => (i === turn ? pay(h, COST.settlement) : h));
      setBuildings(buildingsNow);
      setHands(handsNow);
      setMode(null);
      push(`${players[turn].name} builds a settlement`);
      const roadNow = awardRoad(roads, buildingsNow);
      checkWin(turn, { buildings: buildingsNow, roadAward: roadNow });
    }
    if (mode === "city" && buildings[id]?.player === turn && !buildings[id]?.city) {
      if (!canAfford(hands[turn], COST.city)) return;
      const buildingsNow = { ...buildings, [id]: { player: turn, city: true } };
      setBuildings(buildingsNow);
      setHands(hands.map((h, i) => (i === turn ? pay(h, COST.city) : h)));
      setMode(null);
      push(`${players[turn].name} builds a city`);
      checkWin(turn, { buildings: buildingsNow });
    }
  }

  function onEdge(id: string) {
    if (winner !== null || cover || roads[id] != null) return;
    const edge = GEOM.edges.find((e) => e.id === id);
    if (!edge) return;
    if (phase === "setup" && pendingRoad) {
      if (edge.a !== pendingRoad && edge.b !== pendingRoad) return;
      const roadsNow = { ...roads, [id]: setupPlayer() };
      setRoads(roadsNow);
      const next = setupStep + 1;
      setSetupStep(next);
      setPendingRoad(null);
      awardRoad(roadsNow, buildings);
      if (next >= order.length) {
        setPhase("roll");
        setTurn(0);
        setCover({ player: 0, detail: "Other players, look away. Your resource cards stay covered." });
      } else {
        const p = order[next];
        setCover({ player: p, detail: "Place a settlement, then a road from it." });
      }
      return;
    }
    const player = turn;
    const free = freeRoads > 0;
    if ((mode === "road" || free) && canRoad(id, player)) {
      if (!free && !canAfford(hands[player], COST.road)) return;
      const roadsNow = { ...roads, [id]: player };
      setRoads(roadsNow);
      if (!free) setHands(hands.map((h, i) => (i === player ? pay(h, COST.road) : h)));
      else setFreeRoads((c) => c - 1);
      const roadNow = awardRoad(roadsNow, buildings);
      push(`${players[player].name} builds a road`);
      if (freeRoads <= 1) setMode(null);
      checkWin(player, { roads: roadsNow, roadAward: roadNow });
    }
  }

  function openVertex(id: string) {
    if (buildings[id]) return false;
    const vert = GEOM.vertices.find((v) => v.id === id);
    return !!vert && vert.neighbors.every((n) => !buildings[n]);
  }
  function canSettle(id: string, player: number) {
    if (!openVertex(id)) return false;
    return GEOM.edges.some((e) => (e.a === id || e.b === id) && roads[e.id] === player);
  }
  function canRoad(id: string, player: number) {
    const edge = GEOM.edges.find((e) => e.id === id);
    if (!edge || roads[id] != null) return false;
    return [edge.a, edge.b].some((v) => {
      const b = buildings[v];
      if (b && b.player !== player) return false;
      if (b?.player === player) return true;
      return GEOM.edges.some((e) => e.id !== id && (e.a === v || e.b === v) && roads[e.id] === player);
    });
  }

  function roll() {
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    setDice([a, b]);
    push(`${players[turn].name} rolls ${a + b}`);
    if (a + b === 7) {
      const queue = players.map((_, i) => i).filter((i) => total(hands[i]) > 7);
      if (queue.length) {
        const player = queue[0];
        setDiscard({ player, left: Math.floor(total(hands[player]) / 2), picked: emptyHand() });
        setCover({ player, detail: "You hold more than seven cards. Choose half of them, rounded down, to discard." });
      } else {
        setPhase("rob");
        setMode("robber");
      }
      return;
    }
    produce(a + b);
    setPhase("main");
  }

  function total(hand: Record<Resource, number>) {
    return RESOURCES.reduce((s, r) => s + hand[r], 0);
  }

  function confirmDiscard() {
    if (!discard) return;
    const hand = { ...hands[discard.player] };
    for (const r of RESOURCES) {
      hand[r] -= discard.picked[r];
      bank[r] += discard.picked[r];
    }
    const handsNow = hands.map((h, i) => (i === discard.player ? hand : h));
    setHands(handsNow);
    setBank({ ...bank });
    const rest = players.map((_, i) => i).filter((i) => i !== discard.player && total(handsNow[i]) > 7);
    if (rest.length) {
      const player = rest[0];
      setDiscard({ player, left: Math.floor(total(handsNow[player]) / 2), picked: emptyHand() });
      setCover({ player, detail: "You hold more than seven cards. Discard half, rounded down." });
    } else {
      setDiscard(null);
      setPhase("rob");
      setMode("robber");
      setCover({ player: turn, detail: "Move the robber. Other players, look away." });
    }
  }

  function moveRobber(hex: number) {
    if (hex === robber || tiles[hex] === undefined) return;
    setRobber(hex);
    const victims = new Set<number>();
    for (const v of GEOM.hexes[hex].verts) {
      const b = buildings[v];
      if (b && b.player !== turn && total(hands[b.player]) > 0) victims.add(b.player);
    }
    const list = [...victims];
    if (list.length === 1) stealFrom(list[0], hex);
    else if (list.length > 1) setSteal(list);
    else {
      setPhase("main");
      setMode(null);
    }
  }

  function stealFrom(player: number, _hex = robber) {
    const bag: Resource[] = [];
    for (const r of RESOURCES) for (let i = 0; i < hands[player][r]; i++) bag.push(r);
    if (!bag.length) {
      setSteal(null);
      setPhase("main");
      setMode(null);
      return;
    }
    const res = bag[Math.floor(Math.random() * bag.length)];
    const handsNow = hands.map((h) => ({ ...h }));
    handsNow[player][res] -= 1;
    handsNow[turn][res] += 1;
    setHands(handsNow);
    setSteal(null);
    setPhase("main");
    setMode(null);
    push(`${players[turn].name} steals a card from ${players[player].name}`);
  }

  function buyDev() {
    if (!deck.length || played || !canAfford(hands[turn], COST.dev)) return;
    const card = deck[0];
    setDeck(deck.slice(1));
    setDevs(devs.map((d, i) => (i === turn ? [...d, card] : d)));
    setFresh(fresh.map((d, i) => (i === turn ? [...d, card] : d)));
    setHands(hands.map((h, i) => (i === turn ? pay(h, COST.dev) : h)));
    push(`${players[turn].name} buys a development card`);
    if (card === "vp") checkWin(turn, { devs: devs.map((d, i) => (i === turn ? [...d, card] : d)) });
  }

  function available(card: Dev) {
    return devs[turn].filter((d) => d === card).length > fresh[turn].filter((d) => d === card).length;
  }

  function playKnight() {
    if (played || !available("knight")) return;
    const devsNow = removeOne(devs, turn, "knight");
    const freshNow = removeOne(fresh, turn, "knight");
    setDevs(devsNow);
    setFresh(freshNow);
    const knightsNow = knights.map((k, i) => (i === turn ? k + 1 : k));
    setKnights(knightsNow);
    setPlayed(true);
    setPhase("rob");
    setMode("robber");
    let army = armyAward;
    const mine = knightsNow[turn];
    if (mine >= 3 && (army === null || mine > knightsNow[army])) army = turn;
    setArmyAward(army);
    checkWin(turn, { armyAward: army, devs: devsNow });
  }

  function playPlenty(a: Resource, b: Resource) {
    if (played || !available("plenty") || bank[a] < 1 || bank[b] < (a === b ? 2 : 1)) return;
    const handsNow = hands.map((h) => ({ ...h }));
    const bankNow = { ...bank };
    give(handsNow[turn], a, 1, bankNow);
    give(handsNow[turn], b, 1, bankNow);
    setHands(handsNow);
    setBank(bankNow);
    setDevs(removeOne(devs, turn, "plenty"));
    setPlayed(true);
  }

  function playMono(res: Resource) {
    if (played || !available("mono")) return;
    const handsNow = hands.map((h) => ({ ...h }));
    let got = 0;
    players.forEach((_, i) => {
      if (i === turn) return;
      got += handsNow[i][res];
      handsNow[i][res] = 0;
    });
    handsNow[turn][res] += got;
    setHands(handsNow);
    setDevs(removeOne(devs, turn, "mono"));
    setPlayed(true);
    push(`${players[turn].name} calls a monopoly on ${RES_NAME[res]}`);
  }

  function endTurn() {
    const next = (turn + 1) % n;
    setTurn(next);
    setPhase("roll");
    setDice(null);
    setPlayed(false);
    setFresh(fresh.map((d, i) => (i === turn ? [] : d)));
    setMode(null);
    setFreeRoads(0);
    setCover({ player: next, detail: "Other players, look away. Your resource cards stay covered." });
  }

  function bankTrade(res: Resource) {
    const rate = rateFor(turn, res);
    if (hands[turn][res] < rate) return;
    const target = RESOURCES.find((r) => r !== res && want[r] > 0);
    if (!target || bank[target] < 1) return;
    const handsNow = hands.map((h) => ({ ...h }));
    handsNow[turn][res] -= rate;
    handsNow[turn][target] += 1;
    const bankNow = { ...bank, [res]: bank[res] + rate, [target]: bank[target] - 1 };
    setHands(handsNow);
    setBank(bankNow);
  }

  function rateFor(player: number, res: Resource) {
    let rate = 4;
    for (const [id, b] of Object.entries(buildings)) {
      if (!b || b.player !== player) continue;
      for (const kind of portAtVertex(ports, id)) {
        if (kind === "any") rate = Math.min(rate, 3);
        if (kind === res) rate = Math.min(rate, 2);
      }
    }
    return rate;
  }

  const viewer = offer ? offer.to : discard?.player ?? turn;
  const hand = hands[viewer] ?? emptyHand();
  const box = bounds();

  if (cover) {
    return (
      <Frame meta={meta} onExit={onExit} status="Private turn">
        <PassScreen name={players[cover.player].name} color={players[cover.player].color} detail={cover.detail} onContinue={() => setCover(null)} />
      </Frame>
    );
  }

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={winner !== null ? `${players[winner].name} reaches ten` : phase === "setup" ? `${players[setupPlayer()].name} places` : `It is ${players[turn].name}'s turn`}
      side={
        <>
          <p>
            {players.map((p, i) => `${p.name} ${points(i)}`).join(" · ")}
            {dice ? ` · dice ${dice[0] + dice[1]}` : ""}
          </p>
          {winner === null && phase === "roll" ? (
            <button className="btn solid" onClick={roll}>
              Roll
            </button>
          ) : null}
          {discard ? (
            <div className="stack">
              <p>Discard {discard.left - total(discard.picked)} more.</p>
              <div className="actions">
                {RESOURCES.map((r) => (
                  <button
                    key={r}
                    className="btn ghost"
                    disabled={hands[discard.player][r] - discard.picked[r] <= 0 || total(discard.picked) >= discard.left}
                    onClick={() => setDiscard({ ...discard, picked: { ...discard.picked, [r]: discard.picked[r] + 1 } })}
                  >
                    {RES_NAME[r]}
                  </button>
                ))}
                <button className="btn solid" disabled={total(discard.picked) !== discard.left} onClick={confirmDiscard}>
                  Discard
                </button>
              </div>
            </div>
          ) : null}
          {steal ? (
            <div className="actions">
              {steal.map((i) => (
                <button key={i} className="btn solid" onClick={() => stealFrom(i)}>
                  Steal from {players[i].name}
                </button>
              ))}
            </div>
          ) : null}
          {phase === "main" && winner === null && !offer ? (
            <div className="stack">
              <div className="actions">
                <button className="btn ghost" onClick={() => setMode("road")}>Road</button>
                <button className="btn ghost" onClick={() => setMode("settlement")}>Settlement</button>
                <button className="btn ghost" onClick={() => setMode("city")}>City</button>
                <button className="btn ghost" disabled={!deck.length || played} onClick={buyDev}>Dev card</button>
                <button className="btn solid" onClick={endTurn}>End turn</button>
              </div>
              <div className="actions">
                {available("knight") ? <button className="btn ghost" disabled={played} onClick={playKnight}>Knight</button> : null}
                {available("plenty") ? (
                  <button className="btn ghost" disabled={played} onClick={() => playPlenty(want.lumber ? "lumber" : "grain", want.brick ? "brick" : "wool")}>
                    Year of plenty
                  </button>
                ) : null}
                {available("road") ? (
                  <button className="btn ghost" disabled={played} onClick={() => { setDevs(removeOne(devs, turn, "road")); setFreeRoads(2); setPlayed(true); setMode("road"); }}>
                    Road building
                  </button>
                ) : null}
              </div>
              <div className="actions">
                {RESOURCES.map((r) => (
                  <button key={r} className="btn small ghost" onClick={() => playMono(r)}>
                    Monopoly {RES_NAME[r]}
                  </button>
                ))}
              </div>
              <p>Bank trade. Mark the resource you want, then spend one pile at {RESOURCES.map((r) => `${RES_NAME[r]} ${rateFor(turn, r)}:1`).join(", ")}.</p>
              <div className="actions">
                {RESOURCES.map((r) => (
                  <button key={r} className="btn small ghost" onClick={() => setWant({ ...emptyHand(), [r]: 1 })}>
                    Want {RES_NAME[r]}
                  </button>
                ))}
                {RESOURCES.map((r) => (
                  <button key={`s${r}`} className="btn small solid" onClick={() => bankTrade(r)}>
                    Spend {RES_NAME[r]}
                  </button>
                ))}
              </div>
              <p>Offer a player cards. Set give and want, then propose.</p>
              <div className="actions">
                {RESOURCES.map((r) => (
                  <button key={`g${r}`} className="btn small ghost" onClick={() => setDraft({ ...draft, [r]: draft[r] + 1 })}>
                    Give {RES_NAME[r]} {draft[r] || ""}
                  </button>
                ))}
              </div>
              {players.map((p, i) =>
                i === turn ? null : (
                  <button
                    key={p.id}
                    className="btn ghost"
                    onClick={() => {
                      setOffer({ to: i, give: draft, want });
                      setCover({ player: i, detail: `${players[turn].name} offers a trade. Continue to see your cards and answer.` });
                    }}
                  >
                    Propose to {p.name}
                  </button>
                ),
              )}
            </div>
          ) : null}
          {offer && !cover ? (
            <div className="stack">
              <p>
                {players[turn].name} gives {fmt(offer.give)} for {fmt(offer.want)}.
              </p>
              <div className="actions">
                <button
                  className="btn solid"
                  onClick={() => {
                    const handsNow = hands.map((h) => ({ ...h }));
                    if (RESOURCES.some((r) => handsNow[offer.to][r] < offer.want[r] || handsNow[turn][r] < offer.give[r])) return;
                    for (const r of RESOURCES) {
                      handsNow[turn][r] += offer.want[r] - offer.give[r];
                      handsNow[offer.to][r] += offer.give[r] - offer.want[r];
                    }
                    setHands(handsNow);
                    setOffer(null);
                    setDraft(emptyHand());
                    setWant(emptyHand());
                    setCover({ player: turn, detail: "Trade accepted. The screen comes back to you." });
                  }}
                >
                  Accept
                </button>
                <button className="btn ghost" onClick={() => { setOffer(null); setCover({ player: turn, detail: "Trade declined. The screen comes back to you." }); }}>
                  Decline
                </button>
              </div>
            </div>
          ) : null}
          <p>Your hand: {RESOURCES.map((r) => `${RES_NAME[r]} ${hand[r]}`).join(" · ")}</p>
          <p>Hidden points: {devs[viewer].filter((d) => d === "vp").length}</p>
          <Log lines={log} />
        </>
      }
    >
      <svg className="hex-board" viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}>
        {tiles.map((tile, i) => {
          const hex = GEOM.hexes[i];
          const pts = hex.verts.map((id) => GEOM.vertices.find((v) => v.id === id)!).map((v) => `${v.x},${v.y}`).join(" ");
          return (
            <g key={i} onClick={() => (phase === "rob" && mode === "robber" ? moveRobber(i) : undefined)}>
              <polygon points={pts} fill={RES_COLOR[tile.res]} stroke="#1a1814" strokeWidth={2} />
              <text x={hex.x} y={hex.y} textAnchor="middle" fontSize={16} fontWeight={700}>
                {tile.num ?? ""}
              </text>
              {robber === i ? <circle cx={hex.x} cy={hex.y + 16} r={7} fill="#1a1814" /> : null}
            </g>
          );
        })}
        {GEOM.edges.map((e) => {
          const a = GEOM.vertices.find((v) => v.id === e.a)!;
          const b = GEOM.vertices.find((v) => v.id === e.b)!;
          const owner = roads[e.id];
          return (
            <line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={owner != null ? players[owner].color : "transparent"}
              strokeWidth={owner != null ? 7 : 12}
              onClick={() => onEdge(e.id)}
            />
          );
        })}
        {GEOM.vertices.map((v) => {
          const b = buildings[v.id];
          return (
            <g key={v.id} onClick={() => onVertex(v.id)}>
              <circle cx={v.x} cy={v.y} r={b ? 9 : 5} fill={b ? players[b.player].color : "#fffaf3"} stroke="#1a1814" />
              {b?.city ? <circle cx={v.x} cy={v.y} r={4} fill="#fffaf3" /> : null}
            </g>
          );
        })}
        {ports.map((p) => {
          const e = GEOM.edges.find((edge) => edge.id === p.edge);
          if (!e) return null;
          const a = GEOM.vertices.find((v) => v.id === e.a)!;
          const b = GEOM.vertices.find((v) => v.id === e.b)!;
          return (
            <text key={p.edge} x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} fontSize={10} textAnchor="middle">
              {p.kind === "any" ? "3:1" : `2:1 ${RES_NAME[p.kind][0]}`}
            </text>
          );
        })}
      </svg>
    </Frame>
  );
}

function removeOne(lists: Dev[][], player: number, card: Dev) {
  let removed = false;
  return lists.map((list, i) => {
    if (i !== player) return list;
    return list.filter((d) => {
      if (!removed && d === card) {
        removed = true;
        return false;
      }
      return true;
    });
  });
}

function fmt(bag: Record<Resource, number>) {
  return RESOURCES.filter((r) => bag[r] > 0).map((r) => `${bag[r]} ${RES_NAME[r]}`).join(", ") || "nothing";
}

function bounds() {
  const xs = GEOM.vertices.map((v) => v.x);
  const ys = GEOM.vertices.map((v) => v.y);
  const minX = Math.min(...xs) - 40;
  const minY = Math.min(...ys) - 40;
  return { x: minX, y: minY, w: Math.max(...xs) - minX + 80, h: Math.max(...ys) - minY + 80 };
}
