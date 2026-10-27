export type UnoColor = "R" | "Y" | "G" | "B";
export type UnoKind = "n" | "skip" | "rev" | "d2" | "w" | "wd4";
export type UnoCard = { id: number; color: UnoColor | "W"; kind: UnoKind; n?: number };

let seq = 1;

export function freshUnoDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  const colors: UnoColor[] = ["R", "Y", "G", "B"];
  for (const color of colors) {
    deck.push({ id: seq++, color, kind: "n", n: 0 });
    for (let n = 1; n <= 9; n++) {
      deck.push({ id: seq++, color, kind: "n", n });
      deck.push({ id: seq++, color, kind: "n", n });
    }
    for (const kind of ["skip", "rev", "d2"] as const) {
      deck.push({ id: seq++, color, kind });
      deck.push({ id: seq++, color, kind });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: seq++, color: "W", kind: "w" });
    deck.push({ id: seq++, color: "W", kind: "wd4" });
  }
  return deck;
}

export function cardLabel(c: UnoCard) {
  if (c.kind === "w") return "Wild";
  if (c.kind === "wd4") return "Wild +4";
  const rank = c.kind === "n" ? String(c.n) : c.kind === "skip" ? "Skip" : c.kind === "rev" ? "Reverse" : "+2";
  return `${colorName(c.color)} ${rank}`;
}

export function colorName(c: UnoCard["color"]) {
  return c === "R" ? "Red" : c === "Y" ? "Yellow" : c === "G" ? "Green" : c === "B" ? "Blue" : "Wild";
}

export function canPlay(card: UnoCard, top: UnoCard, active: UnoColor, hand: UnoCard[]) {
  if (card.kind === "wd4") return !hand.some((c) => c.color === active);
  if (card.kind === "w") return true;
  if (card.color === active) return true;
  if (card.kind === "n" && top.kind === "n" && card.n === top.n) return true;
  if (card.kind !== "n" && card.kind === top.kind) return true;
  return false;
}

export function nextIndex(current: number, count: number, dir: 1 | -1, skip = 0) {
  let i = current;
  for (let s = 0; s < skip + 1; s++) i = (i + dir + count) % count;
  return i;
}
