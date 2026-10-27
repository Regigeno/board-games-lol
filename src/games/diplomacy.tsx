import { useMemo, useState } from "react";
import { Frame, Log, PassScreen } from "../components/ui";
import {
  POWERS,
  POWER_COLOR,
  PROVINCES,
  SEAS,
  adjudicate,
  coastChoices,
  homeCenters,
  mustChooseCoast,
  provOf,
  startUnits,
  supplyCenters,
  ARMY,
  FLEET,
  type Order,
  type Power,
  type Unit,
} from "../logic/diplomacy";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "diplomacy")!;

type Season = "Spring" | "Fall" | "Winter";

export function DiplomacyGame({ players, onExit }: GameProps) {
  const [chosen, setChosen] = useState<(Power | "")[]>(() => players.map(() => ""));
  const ready = chosen.every(Boolean) && new Set(chosen).size === players.length;
  const active = chosen.filter((p): p is Power => Boolean(p));
  const [units, setUnits] = useState<Unit[]>([]);
  const [owned, setOwned] = useState<Record<string, Power | null>>({});
  const [started, setStarted] = useState(false);
  const [year, setYear] = useState(1901);
  const [season, setSeason] = useState<Season>("Spring");
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [locked, setLocked] = useState<Power[]>([]);
  const [cover, setCover] = useState<Power | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"move" | "support" | "convoy">("move");
  const [supportFrom, setSupportFrom] = useState<string | null>(null);
  const [report, setReport] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [dislodged, setDislodged] = useState<{ unit: Unit; from: string; ban: string }[]>([]);
  const [standoffs, setStandoffs] = useState<string[]>([]);
  const [retreats, setRetreats] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"orders" | "reveal" | "retreat" | "adjust">("orders");
  const [winner, setWinner] = useState<string | null>(null);

  const powerOf = useMemo(() => {
    const map = new Map<Power, number>();
    chosen.forEach((p, i) => {
      if (p) map.set(p, i);
    });
    return map;
  }, [chosen]);

  function begin() {
    const list = startUnits(active);
    const own: Record<string, Power | null> = {};
    for (const id of supplyCenters()) {
      const home = homeCenters()[id];
      own[id] = home && active.includes(home) ? home : null;
    }
    setUnits(list);
    setOwned(own);
    setStarted(true);
    setCover(active[0]);
    setLog([`${year} Spring. Orders are sealed until every power locks them.`]);
  }

  if (!ready || !started) {
    return (
      <Frame meta={meta} onExit={onExit} status="Choose powers">
        <div className="stack">
          {players.map((p, i) => (
            <label key={p.id} className="field">
              {p.name}
              <select
                value={chosen[i]}
                onChange={(e) => {
                  const next = chosen.slice();
                  next[i] = e.target.value as Power | "";
                  setChosen(next);
                }}
              >
                <option value="">Choose a power</option>
                {POWERS.map((power) => (
                  <option key={power} value={power} disabled={chosen.includes(power) && chosen[i] !== power}>
                    {power}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button className="btn solid" disabled={!ready} onClick={begin}>
            Spring 1901
          </button>
        </div>
      </Frame>
    );
  }

  const writing = active.find((p) => !locked.includes(p)) ?? null;

  function orderFor(loc: string): Order {
    const unit = units.find((u) => u.loc === loc);
    return (
      orders[loc] ?? {
        power: unit!.power,
        type: unit!.type,
        loc,
        action: "hold",
      }
    );
  }

  function setOrder(order: Order) {
    setOrders({ ...orders, [order.loc]: order });
  }

  function destinations(unit: Unit) {
    if (unit.type === "A") return ARMY[provOf(unit.loc)] ?? [];
    return FLEET[unit.loc] ?? [];
  }

  function clickProv(id: string) {
    const unitHere = units.find((u) => provOf(u.loc) === id);
    if (!selected) {
      if (unitHere && unitHere.power === writing) setSelected(unitHere.loc);
      return;
    }
    const unit = units.find((u) => u.loc === selected);
    if (!unit || unit.power !== writing) return;
    if (mode === "move") {
      const direct = destinations(unit).find((d) => provOf(d) === id);
      if (unit.type === "A" && !(ARMY[provOf(unit.loc)] ?? []).includes(id)) {
        setOrder({ power: unit.power, type: "A", loc: unit.loc, action: "move", to: id, via: "convoy" });
        return;
      }
      if (unit.type === "F" && mustChooseCoast("F", unit.loc, id)) {
        const coasts = coastChoices(unit.loc, id);
        setOrder({ power: unit.power, type: "F", loc: unit.loc, action: "move", to: coasts[0] });
        return;
      }
      if (direct || (unit.type === "A" && (ARMY[provOf(unit.loc)] ?? []).includes(id))) {
        setOrder({ power: unit.power, type: unit.type, loc: unit.loc, action: "move", to: unit.type === "F" ? direct ?? id : id });
      }
      return;
    }
    if (mode === "support") {
      if (!supportFrom) {
        if (unitHere) setSupportFrom(unitHere.loc);
        return;
      }
      setOrder({ power: unit.power, type: unit.type, loc: unit.loc, action: "support", ally: supportFrom, to: id });
      setSupportFrom(null);
      return;
    }
    if (mode === "convoy" && unit.type === "F" && SEAS.has(provOf(unit.loc))) {
      if (!supportFrom) {
        if (unitHere?.type === "A") setSupportFrom(unitHere.loc);
        return;
      }
      setOrder({ power: unit.power, type: "F", loc: unit.loc, action: "convoy", ally: supportFrom, to: id });
      setSupportFrom(null);
    }
  }

  function lockPower() {
    if (!writing) return;
    setLocked([...locked, writing]);
    const next = active.find((p) => p !== writing && !locked.includes(p));
    setSelected(null);
    if (next) setCover(next);
  }

  function resolveOrders() {
    const list = units.map((u) => orders[u.loc] ?? { power: u.power, type: u.type, loc: u.loc, action: "hold" as const });
    const result = adjudicate(units, list);
    setUnits(result.units);
    setDislodged(result.dislodged);
    setStandoffs(result.standoffs);
    setReport(result.report);
    setLog((l) => [...l, ...result.report]);
    setOrders({});
    setLocked([]);
    if (result.dislodged.length) {
      setPhase("retreat");
      setCover(result.dislodged[0].unit.power);
    } else if (season === "Fall") {
      ownCenters(result.units);
      setPhase("adjust");
      setCover(active[0]);
    } else {
      setSeason("Fall");
      setCover(active[0]);
      setPhase("orders");
    }
  }

  function ownCenters(list: Unit[]) {
    const next = { ...owned };
    if (season === "Fall") {
      for (const sc of supplyCenters()) {
        const u = list.find((unit) => provOf(unit.loc) === sc);
        if (u) next[sc] = u.power;
      }
    }
    setOwned(next);
    const counts = countCenters(next);
    const victor = active.find((p) => counts[p] >= 18);
    if (victor) setWinner(`${players[powerOf.get(victor)!].name} (${victor})`);
    return next;
  }

  function countCenters(map: Record<string, Power | null>) {
    const counts = Object.fromEntries(active.map((p) => [p, 0])) as Record<Power, number>;
    for (const owner of Object.values(map)) if (owner && counts[owner] !== undefined) counts[owner] += 1;
    return counts;
  }

  function submitRetreats() {
    let next = units.slice();
    const grouped = new Map<string, string[]>();
    for (const d of dislodged) {
      const dest = retreats[d.unit.loc];
      if (!dest) continue;
      const key = provOf(dest);
      grouped.set(key, [...(grouped.get(key) ?? []), d.unit.loc]);
    }
    for (const d of dislodged) {
      const dest = retreats[d.unit.loc];
      const clash = dest && (grouped.get(provOf(dest))?.length ?? 0) > 1;
      const occupied = dest && next.some((u) => provOf(u.loc) === provOf(dest));
      const banned = dest && (provOf(dest) === d.ban || standoffs.includes(provOf(dest)));
      if (!dest || clash || occupied || banned) continue;
      next = [...next, { ...d.unit, loc: d.unit.type === "A" ? provOf(dest) : dest }];
    }
    setUnits(next);
    setDislodged([]);
    setRetreats({});
    if (season === "Fall") {
      const ownedNow = ownCenters(next);
      setOwned(ownedNow);
      setPhase("adjust");
      setCover(active[0]);
    } else {
      setSeason("Fall");
      setPhase("orders");
      setCover(active[0]);
    }
  }

  function build(power: Power, loc: string, type: "A" | "F") {
    if (units.some((u) => provOf(u.loc) === provOf(loc))) return;
    setUnits([...units, { power, type, loc }]);
  }

  function disband(loc: string) {
    setUnits(units.filter((u) => u.loc !== loc));
  }

  function finishAdjust() {
    const counts = countCenters(owned);
    for (const p of active) {
      const have = units.filter((u) => u.power === p).length;
      if (have > (counts[p] ?? 0)) return;
    }
    const victor = active.find((p) => counts[p] >= 18);
    if (victor) {
      setWinner(`${players[powerOf.get(victor)!].name} (${victor})`);
      return;
    }
    setYear((y) => y + 1);
    setSeason("Spring");
    setPhase("orders");
    setCover(active[0]);
    setLog((l) => [...l, `${year + 1}`]);
  }

  if (cover && !winner) {
    const idx = powerOf.get(cover) ?? 0;
    return (
      <Frame meta={meta} onExit={onExit} status="Private orders">
        <PassScreen
          name={players[idx].name}
          color={POWER_COLOR[cover]}
          detail={`${cover}, enter orders where the others cannot see them.`}
          onContinue={() => setCover(null)}
        />
      </Frame>
    );
  }

  const counts = countCenters(owned);
  const focus = writing;

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={winner ?? `${season} ${year}`}
      side={
        <>
          <p>{active.map((p) => `${p} ${counts[p] ?? 0}`).join(" · ")}</p>
          {winner ? <p>{winner} reaches 18 centers.</p> : null}
          {phase === "orders" && focus ? (
            <div className="stack">
              <p>{players[powerOf.get(focus)!].name} writes for {focus}.</p>
              <div className="actions">
                <button className={`btn ${mode === "move" ? "solid" : "ghost"}`} onClick={() => setMode("move")}>Move</button>
                <button className={`btn ${mode === "support" ? "solid" : "ghost"}`} onClick={() => { setMode("support"); setSupportFrom(null); }}>Support</button>
                <button className={`btn ${mode === "convoy" ? "solid" : "ghost"}`} onClick={() => { setMode("convoy"); setSupportFrom(null); }}>Convoy</button>
              </div>
              {selected ? (
                <button className="btn ghost" onClick={() => setOrder({ ...orderFor(selected), action: "hold" })}>
                  Hold {selected.toUpperCase()}
                </button>
              ) : (
                <p>Select a unit, then a destination.</p>
              )}
              {supportFrom ? <p>Supporting {supportFrom.toUpperCase()}. Click the destination.</p> : null}
              <button className="btn solid" onClick={lockPower}>Lock orders</button>
            </div>
          ) : null}
          {phase === "orders" && !focus ? (
            <button className="btn solid" onClick={resolveOrders}>Resolve orders</button>
          ) : null}
          {phase === "retreat" ? (
            <div className="stack">
              {dislodged.map((d) => (
                <label key={d.unit.loc} className="field">
                  {d.unit.power} {d.unit.type} {d.unit.loc.toUpperCase()} retreats
                  <select
                    value={retreats[d.unit.loc] ?? ""}
                    onChange={(e) => setRetreats({ ...retreats, [d.unit.loc]: e.target.value })}
                  >
                    <option value="">Disband</option>
                    {(d.unit.type === "A" ? ARMY[provOf(d.unit.loc)] ?? [] : FLEET[d.unit.loc] ?? [])
                      .filter((dest) => provOf(dest) !== d.ban && !standoffs.includes(provOf(dest)) && !units.some((u) => provOf(u.loc) === provOf(dest)))
                      .map((dest) => (
                        <option key={dest} value={dest}>
                          {dest.toUpperCase()}
                        </option>
                      ))}
                  </select>
                </label>
              ))}
              <button className="btn solid" onClick={submitRetreats}>Confirm retreats</button>
            </div>
          ) : null}
          {phase === "adjust" && !winner ? (
            <div className="stack">
              {active.map((p) => {
                const have = units.filter((u) => u.power === p).length;
                const need = (counts[p] ?? 0) - have;
                return (
                  <div key={p}>
                    <p>
                      {p}: {have} units, {counts[p] ?? 0} centers ({need >= 0 ? `may build ${need}` : `disband ${-need}`})
                    </p>
                    {need < 0
                      ? units.filter((u) => u.power === p).map((u) => (
                          <button key={u.loc} className="btn ghost" onClick={() => disband(u.loc)}>
                            Disband {u.type} {u.loc.toUpperCase()}
                          </button>
                        ))
                      : null}
                    {need > 0
                      ? PROVINCES.filter((prov) => prov.home === p && owned[prov.id] === p && !units.some((u) => provOf(u.loc) === prov.id)).map((prov) => (
                          <span key={prov.id} className="actions">
                            <button className="btn ghost" onClick={() => build(p, prov.id, "A")}>A {prov.name}</button>
                            {prov.kind === "coast" ? (
                              <button className="btn ghost" onClick={() => build(p, prov.id === "stp" ? "stp/sc" : prov.id === "bul" ? "bul/ec" : prov.id === "spa" ? "spa/nc" : prov.id, "F")}>
                                F {prov.name}
                              </button>
                            ) : null}
                          </span>
                        ))
                      : null}
                  </div>
                );
              })}
              <button className="btn solid" onClick={finishAdjust}>Next year</button>
            </div>
          ) : null}
          <Log lines={[...log, ...report].slice(-12)} />
        </>
      }
    >
      <svg className="dip-map" viewBox="0 0 980 860">
        {PROVINCES.filter((p) => p.kind !== "sea").flatMap((p) =>
          (ARMY[p.id] ?? []).filter((n) => n > p.id).map((n) => {
            const o = PROVINCES.find((x) => x.id === n);
            if (!o) return null;
            return <line key={`${p.id}${n}`} x1={p.x} y1={p.y} x2={o.x} y2={o.y} stroke="#9bb7c9" strokeWidth={2} />;
          }),
        )}
        {PROVINCES.map((p) => {
          const owner = owned[p.id];
          const unit = units.find((u) => provOf(u.loc) === p.id);
          return (
            <g key={p.id} onClick={() => clickProv(p.id)}>
              <circle cx={p.x} cy={p.y} r={p.kind === "sea" ? 16 : 18} fill={owner ? POWER_COLOR[owner] : p.kind === "sea" ? "#d5ebf6" : "#f7f1e6"} stroke="#1b1a17" />
              <text className="node-label" x={p.x} y={p.y - 22} textAnchor="middle" fill="#1b1a17">
                {p.name}
              </text>
              {unit ? (
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={POWER_COLOR[unit.power] === "#f4f1ea" ? "#1b1a17" : "#fff"}>
                  {unit.type}
                  {orders[unit.loc] ? "" : ""}
                </text>
              ) : null}
              {p.sc ? <circle cx={p.x + 12} cy={p.y + 10} r={3} fill={owner ? "#1b1a17" : "#c0392b"} /> : null}
            </g>
          );
        })}
      </svg>
    </Frame>
  );
}
