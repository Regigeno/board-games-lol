import { useState } from "react";
import { PassScreen, Frame, Log } from "../components/ui";
import { canPlay, cardLabel, colorName, freshUnoDeck, nextIndex, type UnoCard, type UnoColor } from "../logic/uno";
import { shuffle } from "../logic/util";
import { GAMES, type GameProps } from "../types";

const meta = GAMES.find((g) => g.id === "uno")!;
const COLORS: UnoColor[] = ["R", "Y", "G", "B"];
const PAINT: Record<string, string> = { R: "#d64545", Y: "#e2b325", G: "#1f9d62", B: "#2f6fed", W: "#221c17" };

function UnoFace({ card, onClick, disabled }: { card: UnoCard; onClick?: () => void; disabled?: boolean }) {
  return (
    <button className={`card ${card.color === "R" ? "red" : ""}`} style={{ background: card.color === "W" ? "#221c17" : PAINT[card.color], color: card.color === "Y" ? "#1a1814" : "white" }} onClick={onClick} disabled={disabled}>
      <span className="big">{card.kind === "n" ? card.n : card.kind === "skip" ? "Skip" : card.kind === "rev" ? "Rev" : card.kind === "d2" ? "+2" : card.kind === "w" ? "Wild" : "+4"}</span>
    </button>
  );
}

export function UnoGame({ players, onExit }: GameProps) {
  const [hands, setHands] = useState<UnoCard[][]>(() => []);
  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [discard, setDiscard] = useState<UnoCard[]>([]);
  const [active, setActive] = useState<UnoColor>("R");
  const [dir, setDir] = useState<1 | -1>(1);
  const [turn, setTurn] = useState(0);
  const [locked, setLocked] = useState(true);
  const [called, setCalled] = useState(false);
  const [missed, setMissed] = useState<number | null>(null);
  const [wild, setWild] = useState<UnoCard | null>(null);
  const [naming, setNaming] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  function boot() {
    let pile = shuffle(freshUnoDeck());
    const dealt = players.map(() => pile.splice(0, 7));
    let top = pile.shift()!;
    while (top.kind === "wd4") {
      pile.push(top);
      pile = shuffle(pile);
      top = pile.shift()!;
    }
    setHands(dealt);
    setDeck(pile);
    setDiscard([top]);
    setActive(top.color === "W" ? "R" : top.color);
    setTurn(0);
    setDir(1);
    setLocked(true);
    setReady(true);
    setWinner(null);
    setLog([`Opening card: ${cardLabel(top)}`]);
    setNaming(top.kind === "w");
    setWild(null);
  }

  if (!ready) {
    return (
      <Frame meta={meta} onExit={onExit} status="Shuffle">
        <button className="btn solid big" onClick={boot}>
          Shuffle and deal
        </button>
      </Frame>
    );
  }

  function replenish(pile: UnoCard[], discardPile: UnoCard[]) {
    if (pile.length) return { pile, discardPile };
    const top = discardPile[discardPile.length - 1];
    return { pile: shuffle(discardPile.slice(0, -1)), discardPile: [top] };
  }

  function drawCards(count: number, who: number, pile: UnoCard[], discardPile: UnoCard[], nextHands: UnoCard[][]) {
    let pack = replenish(pile, discardPile);
    const drawn: UnoCard[] = [];
    for (let i = 0; i < count; i++) {
      pack = replenish(pack.pile, pack.discardPile);
      const card = pack.pile.shift();
      if (card) drawn.push(card);
    }
    nextHands[who] = [...nextHands[who], ...drawn];
    return pack;
  }

  function play(card: UnoCard, color?: UnoColor) {
    if (winner) return;
    const hand = hands[turn];
    if (!canPlay(card, discard[discard.length - 1], active, hand)) return;
    if ((card.kind === "w" || card.kind === "wd4") && !color) {
      setWild(card);
      return;
    }
    const nextHands = hands.map((h, i) => (i === turn ? h.filter((c) => c.id !== card.id) : h.slice()));
    const wasTwo = hand.length === 2;
    const forgot = wasTwo && !called;
    let direction = dir;
    let skip = 0;
    let penalty = 0;
    if (card.kind === "rev") {
      if (players.length === 2) skip = 1;
      else direction = (direction * -1) as 1 | -1;
    }
    if (card.kind === "skip") skip = 1;
    if (card.kind === "d2") {
      penalty = 2;
      skip = 1;
    }
    if (card.kind === "wd4") {
      penalty = 4;
      skip = 1;
    }
    const victim = nextIndex(turn, players.length, direction, 0);
    let pack = { pile: deck.slice(), discardPile: [...discard, { ...card, color: color ?? card.color }] };
    if (penalty) pack = drawCards(penalty, victim, pack.pile, pack.discardPile, nextHands);
    const nxt = nextIndex(turn, players.length, direction, skip);
    setHands(nextHands);
    setDeck(pack.pile);
    setDiscard(pack.discardPile);
    setActive(color ?? (card.color as UnoColor));
    setDir(direction);
    setCalled(false);
    setWild(null);
    setLog((l) => [...l, `${players[turn].name} plays ${cardLabel({ ...card, color: color ?? card.color })}`]);
    if (nextHands[turn].length === 0) {
      setWinner(players[turn].name);
      setLocked(false);
      return;
    }
    setMissed(forgot ? turn : null);
    setTurn(nxt);
    setLocked(true);
  }

  function drawOne() {
    const nextHands = hands.map((h) => h.slice());
    const pack = drawCards(1, turn, deck.slice(), discard, nextHands);
    setHands(nextHands);
    setDeck(pack.pile);
    setDiscard(pack.discardPile);
    const drawn = nextHands[turn][nextHands[turn].length - 1];
    setLog((l) => [...l, `${players[turn].name} draws`]);
    if (!drawn || !canPlay(drawn, discard[discard.length - 1], active, nextHands[turn])) {
      setCalled(false);
      setTurn(nextIndex(turn, players.length, dir, 0));
      setLocked(true);
    }
  }

  if (locked && !winner) {
    return (
      <Frame meta={meta} onExit={onExit} status="Private turn">
        <PassScreen
          name={players[turn].name}
          color={players[turn].color}
          detail="Other players, look away. Hidden cards stay covered until this player continues."
          extra={
            missed !== null ? (
              <button
                className="btn danger"
                onClick={() => {
                  const nextHands = hands.map((h) => h.slice());
                  const pack = drawCards(2, missed, deck.slice(), discard, nextHands);
                  setHands(nextHands);
                  setDeck(pack.pile);
                  setLog((l) => [...l, `${players[turn].name} catches ${players[missed].name} for skipping UNO`]);
                  setMissed(null);
                  setLocked(false);
                }}
              >
                Catch {players[missed].name} — they forgot UNO
              </button>
            ) : null
          }
          onContinue={() => setLocked(false)}
        />
      </Frame>
    );
  }

  const top = discard[discard.length - 1];
  const hand = hands[turn] ?? [];

  return (
    <Frame
      meta={meta}
      onExit={onExit}
      status={winner ? `${winner} wins` : `It is ${players[turn].name}'s turn`}
      side={
        <>
          <p>{players.map((p, i) => `${p.name} ${hands[i]?.length ?? 0}`).join(" · ")} · {dir === 1 ? "clockwise" : "counterclockwise"}</p>
          {hand.length === 2 && !winner ? (
            <button className={`btn ${called ? "solid" : "ghost"}`} onClick={() => setCalled(true)}>
              Call UNO
            </button>
          ) : null}
          {!winner ? (
            <button className="btn ghost" onClick={drawOne}>
              Draw
            </button>
          ) : (
            <button className="btn solid" onClick={boot}>
              Deal again
            </button>
          )}
          <Log lines={log} />
        </>
      }
    >
      <div className="stack">
        <div className="card-row">
          <UnoFace card={top} />
          <span className="banner" style={{ margin: 0 }}>
            Color {colorName(active)}
          </span>
          <button className="card back" aria-label="Draw pile" />
        </div>
        {naming ? (
          <div className="actions">
            {COLORS.map((c) => (
              <button key={c} className="btn solid" style={{ background: PAINT[c], color: c === "Y" ? "#1a1814" : "white" }} onClick={() => { setActive(c); setNaming(false); }}>
                {colorName(c)}
              </button>
            ))}
          </div>
        ) : wild ? (
          <div className="actions">
            {COLORS.map((c) => (
              <button key={c} className="btn solid" style={{ background: PAINT[c], color: c === "Y" ? "#1a1814" : "white" }} onClick={() => play(wild, c)}>
                {colorName(c)}
              </button>
            ))}
          </div>
        ) : (
          <div className="hand">
            {hand.map((card) => (
              <UnoFace key={card.id} card={card} disabled={!!winner || !canPlay(card, top, active, hand)} onClick={() => play(card)} />
            ))}
          </div>
        )}
      </div>
    </Frame>
  );
}
