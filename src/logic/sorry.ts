export const SORRY_COLORS = ["red", "blue", "yellow", "green"] as const;
export type SorryColor = (typeof SORRY_COLORS)[number];

export type PawnSpot = { z: "base" } | { z: "track"; i: number } | { z: "safe"; n: number };

export type SorryCard =
  | { id: number; kind: "n"; n: 1 | 2 | 3 | 4 | 5 | 7 | 8 | 10 | 11 | 12 }
  | { id: number; kind: "sorry" };

export function sorryDeck(): SorryCard[] {
  const deck: SorryCard[] = [];
  let id = 1;
  const add = (n: SorryCard["kind"] extends string ? number : never, count: number, kind: "n" | "sorry" = "n") => {
    for (let i = 0; i < count; i++) {
      if (kind === "sorry") deck.push({ id: id++, kind: "sorry" });
      else deck.push({ id: id++, kind: "n", n: n as 1 });
    }
  };
  add(1, 5);
  for (const n of [2, 3, 4, 5, 7, 8, 10, 11, 12]) add(n, 4);
  add(0, 4, "sorry");
  return deck;
}

export function startOf(color: number) {
  return color * 15;
}

export function progress(color: number, trackIndex: number) {
  return (trackIndex - startOf(color) + 60) % 60;
}

export function trackAt(color: number, prog: number) {
  return (startOf(color) + prog) % 60;
}

export function slideEnd(mover: number, index: number): number | null {
  for (let c = 0; c < 4; c++) {
    if (c === mover) continue;
    const s = startOf(c);
    if (index === (s + 1) % 60) return (s + 4) % 60;
    if (index === (s + 9) % 60) return (s + 13) % 60;
  }
  return null;
}

export function slideSquares(mover: number, index: number): number[] {
  const end = slideEnd(mover, index);
  if (end === null) return [];
  const squares = [index];
  let i = index;
  while (i !== end) {
    i = (i + 1) % 60;
    squares.push(i);
  }
  return squares;
}

export function forward(color: number, spot: PawnSpot, steps: number): PawnSpot | null {
  if (spot.z === "base") return null;
  if (spot.z === "safe") {
    const n = spot.n + steps;
    if (n > 5) return null;
    return { z: "safe", n };
  }
  const prog = progress(color, spot.i);
  const total = prog + steps;
  if (total < 60) return { z: "track", i: trackAt(color, total) };
  const into = total - 60;
  if (into > 5) return null;
  return { z: "safe", n: into };
}

export function backward(color: number, spot: PawnSpot, steps: number): PawnSpot | null {
  if (spot.z !== "track") return null;
  const prog = progress(color, spot.i);
  return { z: "track", i: trackAt(color, (prog - steps + 60) % 60) };
}

export function cardLabel(card: SorryCard) {
  return card.kind === "sorry" ? "Sorry!" : String(card.n);
}
