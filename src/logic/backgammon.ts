export type Side = "W" | "B";

export type BGState = {
  w: number[];
  b: number[];
  turn: Side;
  dice: number[];
  cube: number;
  cubeOwner: Side | "C";
  offeredBy: Side | null;
  stakeNote: string | null;
};

export type BGStep = { from: number; to: number; die: number };

export function other(s: Side): Side {
  return s === "W" ? "B" : "W";
}

export function startBackgammon(): BGState {
  const w = Array(26).fill(0);
  const b = Array(26).fill(0);
  w[24] = 2;
  w[13] = 5;
  w[8] = 3;
  w[6] = 5;
  b[1] = 2;
  b[12] = 5;
  b[17] = 3;
  b[19] = 5;
  return { w, b, turn: "W", dice: [], cube: 1, cubeOwner: "C", offeredBy: null, stakeNote: null };
}

function mine(state: BGState, side = state.turn) {
  return side === "W" ? state.w : state.b;
}
function opp(state: BGState, side = state.turn) {
  return side === "W" ? state.b : state.w;
}

export function allHome(state: BGState, side: Side) {
  const m = mine(state, side);
  if (m[0] > 0) return false;
  if (side === "W") {
    for (let p = 7; p <= 24; p++) if (m[p] > 0) return false;
  } else {
    for (let p = 1; p <= 18; p++) if (m[p] > 0) return false;
  }
  return true;
}

function blocked(state: BGState, side: Side, point: number) {
  return opp(state, side)[point] >= 2;
}

export function applyStep(state: BGState, step: BGStep): BGState {
  const next: BGState = {
    ...state,
    w: state.w.slice(),
    b: state.b.slice(),
    dice: state.dice.slice(),
  };
  const m = mine(next);
  const o = opp(next);
  m[step.from]--;
  if (step.to === 25) {
    m[25]++;
  } else {
    if (o[step.to] === 1) {
      o[step.to] = 0;
      o[0]++;
    }
    m[step.to]++;
  }
  const idx = next.dice.indexOf(step.die);
  next.dice.splice(idx, 1);
  return next;
}

function candidateSteps(state: BGState): BGStep[] {
  const side = state.turn;
  const m = mine(state);
  const dice = [...new Set(state.dice)];
  const steps: BGStep[] = [];
  const sources: number[] = [];
  if (m[0] > 0) sources.push(0);
  else for (let p = 1; p <= 24; p++) if (m[p] > 0) sources.push(p);

  for (const from of sources) {
    for (const die of dice) {
      if (from === 0) {
        const to = side === "W" ? 25 - die : die;
        if (!blocked(state, side, to)) steps.push({ from, to, die });
        continue;
      }
      if (side === "W") {
        const to = from - die;
        if (to >= 1) {
          if (!blocked(state, side, to)) steps.push({ from, to, die });
        } else if (allHome(state, side)) {
          if (to === 0) steps.push({ from, to: 25, die });
          else if (from === highestWhite(state)) steps.push({ from, to: 25, die });
        }
      } else {
        const to = from + die;
        if (to <= 24) {
          if (!blocked(state, side, to)) steps.push({ from, to, die });
        } else if (allHome(state, side)) {
          if (to === 25) steps.push({ from, to: 25, die });
          else if (from === lowestBlack(state)) steps.push({ from, to: 25, die });
        }
      }
    }
  }
  return steps;
}

function highestWhite(state: BGState) {
  for (let p = 6; p >= 1; p--) if (state.w[p] > 0) return p;
  return 0;
}
function lowestBlack(state: BGState) {
  for (let p = 19; p <= 24; p++) if (state.b[p] > 0) return p;
  return 0;
}

function maxUsed(state: BGState): number {
  if (state.dice.length === 0) return 0;
  let best = 0;
  const steps = candidateSteps(state);
  const seen = new Set<string>();
  for (const step of steps) {
    const key = `${step.from}-${step.to}-${step.die}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const next = applyStep(state, step);
    best = Math.max(best, 1 + maxUsed(next));
  }
  return best;
}

export function legalSteps(state: BGState): BGStep[] {
  if (state.dice.length === 0) return [];
  const target = maxUsed(state);
  if (target === 0) return [];
  const steps = candidateSteps(state);
  const unique: BGStep[] = [];
  const seen = new Set<string>();
  for (const step of steps) {
    const key = `${step.from}-${step.to}-${step.die}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const next = applyStep(state, step);
    if (1 + maxUsed(next) === target) unique.push(step);
  }
  return unique;
}

export function winnerOf(state: BGState): { side: Side; multiplier: number } | null {
  if (state.w[25] === 15) {
    const back = state.b[25] === 0;
    const deep = state.b[0] > 0 || [1, 2, 3, 4, 5, 6].some((p) => state.b[p] > 0);
    return { side: "W", multiplier: back ? (deep ? 3 : 2) : 1 };
  }
  if (state.b[25] === 15) {
    const back = state.w[25] === 0;
    const deep = state.w[0] > 0 || [19, 20, 21, 22, 23, 24].some((p) => state.w[p] > 0);
    return { side: "B", multiplier: back ? (deep ? 3 : 2) : 1 };
  }
  return null;
}

export function rollDice(rng: () => number = Math.random) {
  const a = 1 + Math.floor(rng() * 6);
  const b = 1 + Math.floor(rng() * 6);
  return a === b ? [a, a, a, a] : [a, b];
}
