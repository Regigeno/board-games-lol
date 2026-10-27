export type SHCard = { id: number; r: number };
export type SHPlayer = {
  hand: SHCard[];
  up: SHCard[];
  down: SHCard[];
  out: boolean;
};

export function shRank(r: number) {
  if (r === 2) return 20;
  if (r === 10) return 21;
  return r;
}

export function shLabel(r: number) {
  return r === 1 ? "A" : r === 11 ? "J" : r === 12 ? "Q" : r === 13 ? "K" : String(r);
}

export function freshShDeck(): SHCard[] {
  const deck: SHCard[] = [];
  let id = 1;
  for (let i = 0; i < 52; i++) deck.push({ id: id++, r: (i % 13) + 1 });
  return deck;
}

export function playable(card: SHCard, pile: SHCard[]) {
  if (pile.length === 0) return true;
  if (card.r === 2 || card.r === 10) return true;
  const top = pile[pile.length - 1];
  if (top.r === 2) return true;
  return shRank(card.r) >= shRank(top.r);
}

export function burns(pile: SHCard[]) {
  if (pile.length === 0) return false;
  if (pile[pile.length - 1].r === 10) return true;
  if (pile.length >= 4) {
    const r = pile[pile.length - 1].r;
    if (pile.slice(-4).every((c) => c.r === r)) return true;
  }
  return false;
}

export function sameRank(cards: SHCard[]) {
  return cards.length > 0 && cards.every((c) => c.r === cards[0].r);
}
