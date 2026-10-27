const SUIT = { s: "♠", h: "♥", d: "♦", c: "♣" } as const;

export function PlayingCard({
  r,
  s,
  hidden,
  selected,
  onClick,
}: {
  r: number;
  s: "s" | "h" | "d" | "c";
  hidden?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  if (hidden) return <button className="card back" onClick={onClick} aria-label="Face-down card" />;
  const red = s === "h" || s === "d";
  const label = r === 1 ? "A" : r === 11 ? "J" : r === 12 ? "Q" : r === 13 ? "K" : String(r);
  return (
    <button className={`card ${red ? "red" : ""} ${selected ? "sel" : ""}`} onClick={onClick}>
      <span className="corner">
        {label}
        {SUIT[s]}
      </span>
      <span className="big">
        {label}
        <br />
        {SUIT[s]}
      </span>
    </button>
  );
}

export function handValue(cards: { r: number }[]) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.r === 1) {
      aces++;
      total += 11;
    } else total += Math.min(c.r, 10);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}
