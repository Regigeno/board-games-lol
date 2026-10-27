export type Suit = "s" | "h" | "d" | "c";
export type Card = { r: number; s: Suit; up: boolean };

export type Solitaire = {
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
  draw: 1 | 3;
  redeals: number;
};

const SUITS: Suit[] = ["s", "h", "d", "c"];

export function isRed(s: Suit) {
  return s === "h" || s === "d";
}

export function freshDeal(draw: 1 | 3 = 1, rng: () => number = Math.random): Solitaire {
  const deck: Card[] = [];
  for (const s of SUITS) for (let r = 1; r <= 13; r++) deck.push({ r, s, up: false });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const tableau: Card[][] = [];
  for (let col = 0; col < 7; col++) {
    const pile: Card[] = [];
    for (let n = 0; n <= col; n++) {
      const card = deck.pop()!;
      card.up = n === col;
      pile.push(card);
    }
    tableau.push(pile);
  }
  return { tableau, foundations: [[], [], [], []], stock: deck, waste: [], draw, redeals: 0 };
}

export function canFoundation(foundations: Card[][], card: Card) {
  const same = foundations.findIndex((f) => f.length > 0 && f[f.length - 1].s === card.s);
  if (same >= 0) {
    const top = foundations[same][foundations[same].length - 1];
    return top.r + 1 === card.r ? same : -1;
  }
  if (card.r !== 1) return -1;
  return foundations.findIndex((f) => f.length === 0);
}

export function canPlaceTableau(dest: Card[], card: Card) {
  if (dest.length === 0) return card.r === 13;
  const top = dest[dest.length - 1];
  return top.up && top.r === card.r + 1 && isRed(top.s) !== isRed(card.s);
}

export function flipStock(state: Solitaire): Solitaire {
  const next: Solitaire = {
    ...state,
    tableau: state.tableau.map((p) => p.map((c) => ({ ...c }))),
    foundations: state.foundations.map((p) => p.map((c) => ({ ...c }))),
    stock: state.stock.map((c) => ({ ...c })),
    waste: state.waste.map((c) => ({ ...c })),
  };
  if (next.stock.length === 0) {
    next.stock = next.waste.reverse().map((c) => ({ ...c, up: false }));
    next.waste = [];
    next.redeals += 1;
    return next;
  }
  const n = Math.min(next.draw, next.stock.length);
  for (let i = 0; i < n; i++) {
    const c = next.stock.pop()!;
    c.up = true;
    next.waste.push(c);
  }
  return next;
}

export function won(state: Solitaire) {
  return state.foundations.reduce((n, f) => n + f.length, 0) === 52;
}

export function cloneSol(state: Solitaire): Solitaire {
  return {
    ...state,
    tableau: state.tableau.map((p) => p.map((c) => ({ ...c }))),
    foundations: state.foundations.map((p) => p.map((c) => ({ ...c }))),
    stock: state.stock.map((c) => ({ ...c })),
    waste: state.waste.map((c) => ({ ...c })),
  };
}
