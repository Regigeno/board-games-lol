export const LADDERS: Record<number, number> = {
  1: 38,
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100,
};

export const CHUTES: Record<number, number> = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 78,
};

export function land(square: number) {
  if (LADDERS[square]) return { to: LADDERS[square], via: "ladder" as const };
  if (CHUTES[square]) return { to: CHUTES[square], via: "chute" as const };
  return { to: square, via: null };
}

export function moveToken(from: number, spin: number) {
  const raw = from + spin;
  if (raw > 100) return { to: from, via: "exact" as const };
  const hit = land(raw);
  return { to: hit.to, via: hit.via ?? ("move" as const), raw };
}
