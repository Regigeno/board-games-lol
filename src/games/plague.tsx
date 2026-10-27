import { useMemo, useState } from "react";
import { Frame, Log, PassScreen } from "../components/ui";
import {
  CONTINENTS,
  COUNTRIES,
  ZONE,
  describeTrait,
  eventDeck,
  traitDeck,
  type Climate,
  type CountryDef,
  type EventCard,
  type TraitDef,
} from "../logic/plague";
import { shuffle } from "../logic/util";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "plague")!;

type City = { climate: Climate; player: number | null };
type Placed = { def: CountryDef; cities: City[] };
type Phase = "dna" | "country" | "evolve" | "infect" | "death";

export function PlagueGame({ players, onExit }: GameProps) {
  const boot = useMemo(() => {
    const starts = shuffle(COUNTRIES.filter((c) => c.start)).slice(0, players.length);
    const deck = shuffle(COUNTRIES.filter((c) => !c.start));
    const need = players.length === 2 ? 24 : players.length === 3 ? 30 : 36;
    const countryDeck = deck.slice(0, need);
    const placed: Placed[] = starts.map((def) => ({
      def,
      cities: def.cities.map((climate, i) => ({ climate, player: i === 0 ? null : null })),
    }));
    placed.forEach((country, i) => {
      const city = country.cities.findIndex((c) => c.climate === "neutral");
      country.cities[city < 0 ? 0 : city].player = i;
    });
    const traitPile = shuffle(traitDeck());
    const hands = players.map(() => [] as TraitDef[]);
    for (let i = 0; i < players.length; i++) hands[i] = traitPile.splice(0, 5);
    return {
      placed,
      deck: countryDeck,
      face: countryDeck.splice(0, 3),
      traits: traitPile,
      events: shuffle(eventDeck()),
      hands,
    };
  }, [players.length]);

  const [placed, setPlaced] = useState<Placed[]>(boot.placed);
  const [deck, setDeck] = useState<CountryDef[]>(boot.deck);
  const [face, setFace] = useState<CountryDef[]>(boot.face);
  const [traits, setTraits] = useState<TraitDef[]>(boot.traits);
  const [traitDiscard, setTraitDiscard] = useState<TraitDef[]>([]);
  const [events, setEvents] = useState<EventCard[]>(boot.events);
  const [eventDiscard, setEventDiscard] = useState<EventCard[]>([]);
  const [hands, setHands] = useState<TraitDef[][]>(boot.hands);
  const [eventHands, setEventHands] = useState<EventCard[][]>(() => players.map(() => []));
  const [slides, setSlides] = useState<(TraitDef | null)[][]>(() => players.map(() => [null, null, null, null, null]));
  const [dna, setDna] = useState<number[]>(() => players.map((_, i) => i));
  const [supply, setSupply] = useState<number[]>(() => players.map(() => 15));
  const [killed, setKilled] = useState<{ def: CountryDef; by: number; counts: number[] }[]>([]);
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>("dna");
  const [cover, setCover] = useState(true);
  const [sudden, setSudden] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [infectLeft, setInfectLeft] = useState(0);
  const [slot, setSlot] = useState(0);

  function push(line: string) {
    setLog((l) => [...l, line]);
  }

  function drawTraits(n: number, into: TraitDef[][]) {
    let pile = traits.slice();
    let discard = traitDiscard.slice();
    const next = into.map((h) => h.slice());
    for (let i = 0; i < n; i++) {
      if (!pile.length) {
        pile = shuffle(discard);
        discard = [];
      }
      const card = pile.shift();
      if (card) next[turn].push(card);
    }
    setTraits(pile);
    setTraitDiscard(discard);
    return next;
  }

  function profile(player: number) {
    const cards = slides[player].filter((c): c is TraitDef => !!c);
    return {
      infect: 1 + cards.reduce((s, c) => s + c.infect, 0),
      lethal: cards.reduce((s, c) => s + c.lethal, 0),
      heat: cards.some((c) => c.heat),
      cold: cards.some((c) => c.cold),
      air: cards.some((c) => c.air),
      water: cards.some((c) => c.water),
      bonus: slides[player][0] === null,
      outbreak: slides[player][2] === null,
    };
  }

  function counts(country: Placed) {
    return players.map((_, i) => country.cities.filter((c) => c.player === i).length);
  }
  function controllers(country: Placed) {
    const c = counts(country);
    const max = Math.max(...c);
    if (max <= 0) return [];
    return c.map((n, i) => (n === max ? i : -1)).filter((i) => i >= 0);
  }

  function connected(player: number, country: Placed) {
    const mine = placed.filter((p) => p.cities.some((c) => c.player === player));
    if (mine.some((p) => p.def.id === country.def.id)) return true;
    if (mine.some((p) => p.def.continent === country.def.continent)) return true;
    const pro = profile(player);
    if (pro.air && country.def.airport && mine.some((p) => p.def.airport)) return true;
    if (pro.water && country.def.seaport && mine.some((p) => p.def.seaport)) return true;
    return false;
  }

  function resist(player: number, climate: Climate) {
    if (climate === "neutral") return true;
    const pro = profile(player);
    return climate === "hot" ? pro.heat : pro.cold;
  }

  function scoreDna() {
    let gained = 0;
    for (const country of placed) if (controllers(country).includes(turn)) gained += 1;
    if (profile(turn).bonus) gained += 1;
    const next = dna.slice();
    next[turn] += gained;
    setDna(next);
    push(`${players[turn].name} collects ${gained} DNA`);
    setPhase("country");
  }

  function takeCountry(def: CountryDef | null, discardIt: boolean) {
    let pile = deck.slice();
    let up = face.slice();
    const chosen = def ?? pile.shift() ?? null;
    if (!chosen) {
      setSudden(true);
      setPhase("evolve");
      return;
    }
    if (def) up = up.filter((c) => c.id !== def.id);
    while (up.length < 3 && pile.length) up.push(pile.shift()!);
    setDeck(pile);
    setFace(up);
    const full = placed.filter((p) => p.def.continent === chosen.continent).length >= ZONE;
    if (discardIt || full) {
      const wiped = hands.map((h, i) => (i === turn ? [] : h.slice()));
      const next = drawTraits(5, wiped);
      setHands(next);
      push(`${players[turn].name} discards ${chosen.name} and draws a new trait hand`);
    } else {
      setPlaced([...placed, { def: chosen, cities: chosen.cities.map((climate) => ({ climate, player: null })) }]);
      push(`${players[turn].name} places ${chosen.name}`);
    }
    if (!pile.length && up.length === 0) setSudden(true);
    setPhase("evolve");
  }

  function evolve(card: TraitDef) {
    if (dna[turn] < card.cost || slides[turn][slot]) return;
    const slidesNow = slides.map((s) => s.slice());
    slidesNow[turn][slot] = card;
    setSlides(slidesNow);
    setDna(dna.map((n, i) => (i === turn ? n - card.cost : n)));
    setHands(hands.map((h, i) => (i === turn ? h.filter((c) => c.id !== card.id) : h)));
    push(`${players[turn].name} evolves ${card.name}`);
    setPhase("infect");
    setInfectLeft(profile(turn).infect + card.infect);
  }

  function placeToken(countryId: string, cityIndex: number, ignore = false) {
    if (supply[turn] <= 0 || infectLeft <= 0) return;
    const country = placed.find((p) => p.def.id === countryId);
    if (!country) return;
    const city = country.cities[cityIndex];
    if (!city || city.player !== null) return;
    if (!ignore && (!connected(turn, country) || !resist(turn, city.climate))) return;
    const next = placed.map((p) => (p.def.id === countryId ? { ...p, cities: p.cities.map((c, i) => (i === cityIndex ? { ...c, player: turn } : c)) } : p));
    setPlaced(next);
    setSupply(supply.map((n, i) => (i === turn ? n - 1 : n)));
    setInfectLeft((n) => n - 1);
  }

  function kill(countryId: string) {
    const country = placed.find((p) => p.def.id === countryId);
    if (!country) return;
    const full = country.cities.every((c) => c.player !== null);
    const control = controllers(country);
    const allowed = sudden ? country.cities.some((c) => c.player === turn) : control.includes(turn);
    if (!full || !allowed) return;
    const roll = 1 + Math.floor(Math.random() * 6);
    const lethal = profile(turn).lethal;
    if (roll > lethal) {
      push(`${players[turn].name} fails to kill ${country.def.name} (${roll} vs ${lethal})`);
      return;
    }
    const c = counts(country);
    const dnaNow = dna.map((n, i) => n + c[i]);
    const present = c.map((n, i) => (n > 0 ? i : -1)).filter((i) => i >= 0);
    let pile = events.slice();
    let discard = eventDiscard.slice();
    const ev = eventHands.map((h) => h.slice());
    for (const i of present) {
      if (ev[i].length >= 3) continue;
      if (!pile.length) {
        pile = shuffle(discard);
        discard = [];
      }
      const card = pile.shift();
      if (card) ev[i].push(card);
    }
    const back = supply.slice();
    c.forEach((n, i) => (back[i] += n));
    setDna(dnaNow);
    setEvents(pile);
    setEventDiscard(discard);
    setEventHands(ev);
    setSupply(back);
    setKilled([...killed, { def: country.def, by: turn, counts: c }]);
    setPlaced(placed.filter((p) => p.def.id !== countryId));
    push(`${players[turn].name} kills ${country.def.name}`);
  }

  function endTurn() {
    const empty = supply.map((n, i) => placed.some((p) => p.cities.some((c) => c.player === i)) ? false : n >= 0);
    if (sudden && empty.some(Boolean)) {
      finish();
      return;
    }
    const next = (turn + 1) % players.length;
    setTurn(next);
    setPhase("dna");
    setInfectLeft(0);
    setCover(true);
    if (!placed.some((p) => p.cities.some((c) => c.player === next)) && !sudden) {
      const card = deck[0];
      if (card) {
        setDeck(deck.slice(1));
        setPlaced([...placed, { def: card, cities: card.cities.map((climate, idx) => ({ climate, player: idx === 0 ? next : null })) }]);
        setDna(dna.map((n, i) => (i === next ? Math.max(0, n - 7) : n)));
        setSupply(supply.map((n, i) => (i === next ? n - 1 : n)));
        push(`${players[next].name} restarts in ${card.name} and loses 7 DNA`);
      }
    }
  }

  function finish() {
    const scores = dna.slice();
    slides.forEach((slide, i) => {
      scores[i] += slide.reduce((s, c) => s + (c?.cost ?? 0), 0);
    });
    const left = players.map((_, i) => placed.reduce((s, p) => s + p.cities.filter((c) => c.player === i).length, 0));
    const most = Math.max(...left);
    left.forEach((n, i) => {
      if (n === most && n > 0) scores[i] += 4;
    });
    for (const continent of CONTINENTS) {
      const kills = players.map((_, i) => killed.filter((k) => k.by === i && k.def.continent === continent).length);
      const best = Math.max(...kills);
      if (best > 0) kills.forEach((n, i) => {
        if (n === best) scores[i] += 6;
      });
    }
    const biggest = killed.reduce((m, k) => Math.max(m, k.def.cities.length), 0);
    killed.forEach((k) => {
      if (k.def.cities.length === biggest) scores[k.by] += 7;
    });
    const top = Math.max(...scores);
    const names = players.filter((_, i) => scores[i] === top).map((p) => p.name);
    setWinner(names.join(" & "));
    push(`Final DNA: ${players.map((p, i) => `${p.name} ${scores[i]}`).join(", ")}`);
    setDna(scores);
  }

  function playEvent(card: EventCard) {
    const dnaNow = dna.slice();
    if (card.kind === "aid") dnaNow[turn] += 2;
    if (card.kind === "dna") dnaNow[turn] += 3;
    if (card.kind === "draw") setHands(drawTraits(2, hands));
    setDna(dnaNow);
    setEventHands(eventHands.map((h, i) => (i === turn ? h.filter((c) => c.id !== card.id) : h)));
    setEventDiscard([...eventDiscard, card]);
    push(`${players[turn].name} plays ${card.name}`);
  }

  if (cover && !winner) {
    return (
      <Frame meta={meta} onExit={onExit} status="Private turn">
        <PassScreen
          name={players[turn].name}
          color={players[turn].color}
          detail="Trait cards and events stay covered until this player continues."
          onContinue={() => setCover(false)}
        />
      </Frame>
    );
  }

  const pro = profile(turn);

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={winner ? `${winner} leads the collapse` : `It is ${players[turn].name}'s turn · ${phase}`}
      side={
        <>
          <p>{players.map((p, i) => `${p.name} DNA ${dna[i]} · tokens ${supply[i]}`).join(" · ")}{sudden ? " · sudden death" : ""}</p>
          {winner ? <p>Highest DNA wins.</p> : null}
          {!winner && phase === "dna" ? <button className="btn solid" onClick={scoreDna}>Collect DNA</button> : null}
          {!winner && phase === "country" ? (
            <div className="stack">
              {face.map((c) => (
                <div key={c.id} className="actions">
                  <button className="btn ghost" onClick={() => takeCountry(c, false)}>Place {c.name}</button>
                  <button className="btn ghost" onClick={() => takeCountry(c, true)}>Discard for traits</button>
                </div>
              ))}
              <button className="btn solid" onClick={() => takeCountry(null, false)}>Draw a blind country</button>
            </div>
          ) : null}
          {!winner && phase === "evolve" ? (
            <div className="stack">
              <label className="field">
                Slot
                <select value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
                  {slides[turn].map((s, i) => (
                    <option key={i} value={i} disabled={!!s}>
                      {i + 1} {i === 0 ? "Bonus DNA" : i === 2 ? "Outbreak" : ""} {s ? s.name : "empty"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="hand">
                {hands[turn].map((card) => (
                  <button key={card.id} className="trait" disabled={dna[turn] < card.cost} onClick={() => evolve(card)}>
                    <b>{card.name}</b>
                    <small>{describeTrait(card)} · {card.cost} DNA</small>
                  </button>
                ))}
              </div>
              <button className="btn ghost" onClick={() => { setPhase("infect"); setInfectLeft(pro.infect); }}>Skip evolution</button>
            </div>
          ) : null}
          {!winner && phase === "infect" ? (
            <div className="stack">
              <p>Place {infectLeft} more tokens. Infectivity {pro.infect}. {pro.heat ? "Heat. " : ""}{pro.cold ? "Cold. " : ""}{pro.air ? "Air. " : ""}{pro.water ? "Water." : ""}</p>
              <button className="btn solid" onClick={() => setPhase("death")}>To the death roll</button>
            </div>
          ) : null}
          {!winner && phase === "death" ? (
            <div className="stack">
              {placed.filter((c) => c.cities.every((city) => city.player !== null) && (sudden ? c.cities.some((city) => city.player === turn) : controllers(c).includes(turn))).map((c) => (
                <button key={c.def.id} className="btn ghost" onClick={() => kill(c.def.id)}>{c.def.name}</button>
              ))}
              <button className="btn solid" onClick={endTurn}>End turn</button>
            </div>
          ) : null}
          <div className="hand">
            {eventHands[turn].map((card) => (
              <button key={card.id} className="trait" onClick={() => playEvent(card)}>
                <b>{card.name}</b>
                <small>{card.text}</small>
              </button>
            ))}
          </div>
          <Log lines={log} />
        </>
      }
    >
      <div className="world">
        {CONTINENTS.map((continent) => (
          <section key={continent} className="continent">
            <h3>{continent}</h3>
            {placed.filter((p) => p.def.continent === continent).map((country) => (
              <div key={country.def.id} className="country">
                <strong>
                  {country.def.name} {country.def.airport ? "✈" : ""} {country.def.seaport ? "⚓" : ""}
                </strong>
                <div className="cities">
                  {country.cities.map((city, i) => (
                    <button
                      key={i}
                      className={`city ${city.climate} ${city.player !== null ? "filled" : ""}`}
                      style={city.player !== null ? { background: players[city.player].color } : undefined}
                      onClick={() => phase === "infect" && placeToken(country.def.id, i)}
                    >
                      {city.player === null ? city.climate : players[city.player].name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </Frame>
  );
}
