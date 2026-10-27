import { useMemo, useState } from "react";
import { Frame, Log, PassScreen } from "../components/ui";
import {
  DOORS,
  H,
  ROOMS,
  ROOM_COLOR,
  SECRET,
  STARTS,
  SUSPECTS,
  W,
  WEAPONS,
  allCards,
  cardKey,
  posKey,
  reachable,
  roomAt,
  type ClueCard,
  type Pos,
  type Room,
  type Suspect,
  type Weapon,
} from "../logic/clue";
import { shuffle } from "../logic/util";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "clue")!;

type Cover = { player: number; detail: string } | null;

export function ClueGame({ players, onExit }: GameProps) {
  const setup = useMemo(() => {
    const cards = shuffle(allCards());
    const solution = {
      suspect: cards.find((c) => c.kind === "suspect")!.name as Suspect,
      weapon: cards.find((c) => c.kind === "weapon")!.name as Weapon,
      room: cards.find((c) => c.kind === "room")!.name as Room,
    };
    const rest = shuffle(cards.filter((c) => c.name !== solution.suspect && c.name !== solution.weapon && c.name !== solution.room));
    const hands: ClueCard[][] = players.map(() => []);
    rest.forEach((card, i) => hands[i % players.length].push(card));
    const weapons = {} as Record<Weapon, Room>;
    WEAPONS.forEach((w, i) => (weapons[w] = ROOMS[i]));
    return { solution, hands, weapons, positions: { ...STARTS } as Record<Suspect, Pos> };
  }, [players]);

  const [positions, setPositions] = useState(setup.positions);
  const [weapons, setWeapons] = useState(setup.weapons);
  const [turn, setTurn] = useState(0);
  const [cover, setCover] = useState<Cover>({ player: 0, detail: "Other players, look away. Your cards stay covered until you continue." });
  const [rolled, setRolled] = useState<number | null>(null);
  const [moved, setMoved] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [out, setOut] = useState<boolean[]>(() => players.map(() => false));
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [suspectPick, setSuspectPick] = useState<Suspect>(SUSPECTS[0]);
  const [weaponPick, setWeaponPick] = useState<Weapon>(WEAPONS[0]);
  const [roomPick, setRoomPick] = useState<Room>(ROOMS[0]);
  const [accusing, setAccusing] = useState(false);
  const [ask, setAsk] = useState<{ player: number; options: ClueCard[]; room: string } | null>(null);
  const [shown, setShown] = useState<ClueCard | null>(null);

  const me = players[turn];
  const who = SUSPECTS[turn];
  const pos = positions[who];
  const blocked = useMemo(() => {
    const set = new Set<string>();
    for (const s of SUSPECTS) {
      const p = positions[s];
      if (s !== who && p.t === "hall") set.add(posKey(p));
    }
    return set;
  }, [positions, who]);
  const options = rolled && !moved && !ask && !shown ? reachable(pos, rolled, blocked) : [];

  function endTurn() {
    let n = (turn + 1) % players.length;
    let guard = 0;
    while (out[n] && guard++ < players.length) n = (n + 1) % players.length;
    setTurn(n);
    setRolled(null);
    setMoved(false);
    setSuggested(false);
    setAccusing(false);
    setShown(null);
    setAsk(null);
    setCover({ player: n, detail: "Other players, look away. Your cards stay covered until you continue." });
  }

  function seek(from: number, room: string, suspect: Suspect, weapon: Weapon) {
    for (let step = 1; step < players.length; step++) {
      const i = (from + step) % players.length;
      const matched = setup.hands[i].filter((c) => c.name === suspect || c.name === weapon || c.name === room);
      if (matched.length) {
        setAsk({ player: i, options: matched, room });
        setCover({ player: i, detail: "You can disprove the suggestion. Everyone else look away." });
        return;
      }
      setLog((l) => [...l, `${players[i].name} cannot disprove it`]);
    }
    setLog((l) => [...l, "Nobody can disprove the suggestion"]);
  }

  function suggest() {
    if (pos.t !== "room" || suggested) return;
    const room = pos.room;
    setPositions({ ...positions, [suspectPick]: { t: "room", room } });
    setWeapons({ ...weapons, [weaponPick]: room });
    setSuggested(true);
    setLog((l) => [...l, `${me.name} suggests ${suspectPick}, the ${weaponPick}, in the ${room}`]);
    seek(turn, room, suspectPick, weaponPick);
  }

  function accuse() {
    const ok = suspectPick === setup.solution.suspect && weaponPick === setup.solution.weapon && roomPick === setup.solution.room;
    if (ok) {
      setWinner(me.name);
      setLog((l) => [...l, `${me.name} names ${suspectPick}, the ${weaponPick}, and the ${roomPick}`]);
      return;
    }
    setLog((l) => [...l, `${me.name} is wrong and sits out`]);
    const nextOut = out.slice();
    nextOut[turn] = true;
    setOut(nextOut);
    endTurn();
  }

  if (cover) {
    const person = players[cover.player];
    return (
      <Frame meta={meta} onExit={onExit} status="Private turn">
        <PassScreen name={person.name} color={person.color} detail={cover.detail} onContinue={() => setCover(null)} />
      </Frame>
    );
  }

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={winner ? `${winner} solves it` : `It is ${ask ? players[ask.player].name : me.name}'s turn`}
      side={
        <>
          {winner ? (
            <p>
              {setup.solution.suspect}, the {setup.solution.weapon}, in the {setup.solution.room}.
            </p>
          ) : null}
          {ask ? (
            <div className="stack">
              <p>{players[ask.player].name}, show one card.</p>
              {ask.options.map((card) => (
                <button
                  key={cardKey(card)}
                  className="btn solid"
                  onClick={() => {
                    setLog((l) => [...l, `${players[ask.player].name} shows a card in private`]);
                    setShown(card);
                    setAsk(null);
                    setCover({ player: turn, detail: "A card is ready for you alone." });
                  }}
                >
                  Show {card.name}
                </button>
              ))}
            </div>
          ) : null}
          {shown ? (
            <div className="stack">
              <p>You were shown: {shown.name}</p>
              <button className="btn solid" onClick={() => setShown(null)}>
                Noted
              </button>
            </div>
          ) : null}
          {!winner && !out[turn] && !ask && !shown ? (
            <div className="stack">
              {!rolled ? (
                <button className="btn solid" onClick={() => setRolled(1 + Math.floor(Math.random() * 6))}>
                  Roll
                </button>
              ) : (
                <p>Rolled {rolled}.</p>
              )}
              {pos.t === "room" && SECRET[pos.room] && !moved ? (
                <button
                  className="btn ghost"
                  onClick={() => {
                    const room = SECRET[pos.room]!;
                    setPositions({ ...positions, [who]: { t: "room", room } });
                    setMoved(true);
                    setLog((l) => [...l, `${me.name} takes the passage to the ${room}`]);
                  }}
                >
                  Secret passage
                </button>
              ) : null}
              {pos.t === "room" && !suggested ? (
                <div className="stack">
                  <select value={suspectPick} onChange={(e) => setSuspectPick(e.target.value as Suspect)}>
                    {SUSPECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <select value={weaponPick} onChange={(e) => setWeaponPick(e.target.value as Weapon)}>
                    {WEAPONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button className="btn solid" onClick={suggest}>
                    Suggest the {pos.room}
                  </button>
                </div>
              ) : null}
              <button className="btn ghost" onClick={() => setAccusing((v) => !v)}>
                Accusation
              </button>
              {accusing ? (
                <div className="stack">
                  <select value={roomPick} onChange={(e) => setRoomPick(e.target.value as Room)}>
                    {ROOMS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button className="btn danger" onClick={accuse}>
                    Accuse {suspectPick}, {weaponPick}, {roomPick}
                  </button>
                </div>
              ) : null}
              <button className="btn ghost" onClick={endTurn}>
                End turn
              </button>
            </div>
          ) : null}
          {!ask ? (
            <div className="stack">
              <p>{me.name}&apos;s cards</p>
              {setup.hands[turn].map((c) => (
                <p key={cardKey(c)}>{c.name}</p>
              ))}
            </div>
          ) : null}
          <Log lines={log} />
        </>
      }
    >
      <div className="clue-board" style={{ gridTemplateColumns: `repeat(${W}, 1fr)`, gridTemplateRows: `repeat(${H}, 1fr)` }}>
        {Array.from({ length: H * W }, (_, n) => {
          const r = Math.floor(n / W);
          const c = n % W;
          const room = roomAt(r, c);
          const hall = options.find((p) => p.t === "hall" && p.r === r && p.c === c);
          const door = DOORS.find((d) => d.r === r && d.c === c);
          const doorRoom = door ? options.find((p) => p.t === "room" && p.room === door.room) : undefined;
          return (
            <button
              key={n}
              className={`cell ${room ? "room" : "hall"}`}
              style={{ background: room ? ROOM_COLOR[room] : hall || doorRoom ? "#f2c14e" : undefined }}
              onClick={() => {
                if (hall) {
                  setPositions({ ...positions, [who]: hall });
                  setMoved(true);
                } else if (doorRoom && doorRoom.t === "room") {
                  setPositions({ ...positions, [who]: doorRoom });
                  setMoved(true);
                }
              }}
            >
              {SUSPECTS.map((s, i) =>
                positions[s].t === "hall" && positions[s].r === r && positions[s].c === c ? (
                  <i key={s} className="piece-dot" style={{ background: players[i]?.color ?? "#222" }}>
                    {s[0]}
                  </i>
                ) : null,
              )}
            </button>
          );
        })}
      </div>
      <div className="card-row">
        {ROOMS.map((room) => {
          const people = SUSPECTS.filter((s) => positions[s].t === "room" && positions[s].room === room);
          const arms = WEAPONS.filter((w) => weapons[w] === room);
          if (!people.length && !arms.length) return null;
          return (
            <p key={room}>
              <b>{room}:</b> {people.join(", ")} {arms.join(", ")}
            </p>
          );
        })}
      </div>
    </Frame>
  );
}

