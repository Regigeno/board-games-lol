export const ROOMS = [
  "Study",
  "Hall",
  "Lounge",
  "Library",
  "Billiard Room",
  "Dining Room",
  "Conservatory",
  "Ballroom",
  "Kitchen",
] as const;
export type Room = (typeof ROOMS)[number];

export const SUSPECTS = ["Scarlet", "Mustard", "White", "Green", "Peacock", "Plum"] as const;
export type Suspect = (typeof SUSPECTS)[number];

export const WEAPONS = ["Knife", "Candlestick", "Revolver", "Rope", "Pipe", "Wrench"] as const;
export type Weapon = (typeof WEAPONS)[number];

export const W = 24;
export const H = 25;

type Rect = { id: Room; r: number; c: number; h: number; w: number };

const RECTS: Rect[] = [
  { id: "Conservatory", r: 0, c: 0, h: 5, w: 6 },
  { id: "Ballroom", r: 0, c: 8, h: 7, w: 8 },
  { id: "Kitchen", r: 0, c: 18, h: 6, w: 6 },
  { id: "Library", r: 6, c: 0, h: 6, w: 7 },
  { id: "Billiard Room", r: 7, c: 18, h: 5, w: 6 },
  { id: "Dining Room", r: 14, c: 16, h: 5, w: 8 },
  { id: "Study", r: 19, c: 0, h: 6, w: 7 },
  { id: "Hall", r: 18, c: 9, h: 7, w: 6 },
  { id: "Lounge", r: 20, c: 17, h: 5, w: 7 },
];

export const ROOM_COLOR: Record<Room, string> = {
  Study: "#c9843a",
  Hall: "#e6d3a3",
  Lounge: "#d35d8a",
  Library: "#6e8b74",
  "Billiard Room": "#3d7a4a",
  "Dining Room": "#c4493a",
  Conservatory: "#7d9a62",
  Ballroom: "#d7c4e8",
  Kitchen: "#e07a32",
};

export function roomAt(r: number, c: number): Room | null {
  if (r < 0 || c < 0 || r >= H || c >= W) return null;
  for (const rect of RECTS) {
    if (r >= rect.r && r < rect.r + rect.h && c >= rect.c && c < rect.c + rect.w) return rect.id;
  }
  return null;
}

export function isHall(r: number, c: number) {
  return r >= 0 && c >= 0 && r < H && c < W && roomAt(r, c) === null;
}

export const DOORS: { room: Room; r: number; c: number }[] = [
  { room: "Conservatory", r: 4, c: 6 },
  { room: "Conservatory", r: 5, c: 1 },
  { room: "Ballroom", r: 6, c: 7 },
  { room: "Ballroom", r: 6, c: 16 },
  { room: "Ballroom", r: 7, c: 10 },
  { room: "Ballroom", r: 7, c: 13 },
  { room: "Kitchen", r: 5, c: 17 },
  { room: "Kitchen", r: 6, c: 20 },
  { room: "Library", r: 8, c: 7 },
  { room: "Library", r: 11, c: 7 },
  { room: "Library", r: 12, c: 3 },
  { room: "Billiard Room", r: 9, c: 17 },
  { room: "Billiard Room", r: 12, c: 20 },
  { room: "Dining Room", r: 13, c: 18 },
  { room: "Dining Room", r: 16, c: 15 },
  { room: "Dining Room", r: 19, c: 18 },
  { room: "Study", r: 18, c: 3 },
  { room: "Study", r: 21, c: 7 },
  { room: "Hall", r: 17, c: 11 },
  { room: "Hall", r: 21, c: 8 },
  { room: "Hall", r: 21, c: 15 },
  { room: "Lounge", r: 19, c: 19 },
  { room: "Lounge", r: 22, c: 16 },
];

export const SECRET: Partial<Record<Room, Room>> = {
  Study: "Kitchen",
  Kitchen: "Study",
  Lounge: "Conservatory",
  Conservatory: "Lounge",
};

export type Pos = { t: "hall"; r: number; c: number } | { t: "room"; room: Room };

export function posKey(p: Pos) {
  return p.t === "hall" ? `h${p.r},${p.c}` : `r${p.room}`;
}

export const STARTS: Record<Suspect, Pos> = {
  Scarlet: { t: "hall", r: 16, c: 12 },
  Mustard: { t: "hall", r: 12, c: 22 },
  White: { t: "hall", r: 6, c: 21 },
  Green: { t: "hall", r: 5, c: 2 },
  Peacock: { t: "hall", r: 12, c: 2 },
  Plum: { t: "hall", r: 17, c: 3 },
};

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function hallNeighbors(r: number, c: number): Pos[] {
  const out: Pos[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (isHall(nr, nc)) out.push({ t: "hall", r: nr, c: nc });
  }
  return out;
}

export function reachable(start: Pos, roll: number, blocked: Set<string>): Pos[] {
  const found = new Map<string, Pos>();
  const seen = new Set<string>();
  const q: { pos: Pos; dist: number }[] = [{ pos: start, dist: 0 }];
  while (q.length) {
    const cur = q.shift()!;
    const stamp = `${posKey(cur.pos)}@${cur.dist}`;
    if (seen.has(stamp)) continue;
    seen.add(stamp);
    if (cur.dist > 0 && (cur.pos.t === "room" || cur.dist === roll)) {
      found.set(posKey(cur.pos), cur.pos);
    }
    if (cur.dist === roll) continue;
    if (cur.pos.t === "room") {
      if (cur.dist > 0) continue;
      const room = cur.pos.room;
      for (const d of DOORS.filter((d) => d.room === room)) {
        const k = `h${d.r},${d.c}`;
        if (blocked.has(k)) continue;
        q.push({ pos: { t: "hall", r: d.r, c: d.c }, dist: cur.dist + 1 });
      }
    } else {
      const hr = cur.pos.r;
      const hc = cur.pos.c;
      for (const n of hallNeighbors(hr, hc)) {
        const k = posKey(n);
        if (blocked.has(k)) continue;
        q.push({ pos: n, dist: cur.dist + 1 });
      }
      const door = DOORS.find((d) => d.r === hr && d.c === hc);
      if (door) q.push({ pos: { t: "room", room: door.room }, dist: cur.dist + 1 });
    }
  }
  return [...found.values()];
}

export type ClueCard = { kind: "suspect" | "weapon" | "room"; name: string };

export function allCards(): ClueCard[] {
  return [
    ...SUSPECTS.map((name) => ({ kind: "suspect" as const, name })),
    ...WEAPONS.map((name) => ({ kind: "weapon" as const, name })),
    ...ROOMS.map((name) => ({ kind: "room" as const, name })),
  ];
}

export function cardKey(c: ClueCard) {
  return `${c.kind}:${c.name}`;
}
