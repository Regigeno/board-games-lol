export type Resource = "lumber" | "brick" | "wool" | "grain" | "ore";
export type HexRes = Resource | "desert";
export type Dev = "knight" | "vp" | "road" | "plenty" | "mono";

export const RESOURCES: Resource[] = ["lumber", "brick", "wool", "grain", "ore"];

export const COST: Record<string, Partial<Record<Resource, number>>> = {
  road: { brick: 1, lumber: 1 },
  settlement: { brick: 1, lumber: 1, wool: 1, grain: 1 },
  city: { grain: 2, ore: 3 },
  dev: { wool: 1, grain: 1, ore: 1 },
};

export const RES_COLOR: Record<HexRes, string> = {
  lumber: "#2f7d32",
  brick: "#c15a3a",
  wool: "#8fbf63",
  grain: "#e2b33a",
  ore: "#8d8f99",
  desert: "#e6d7a8",
};

export const RES_NAME: Record<Resource, string> = {
  lumber: "Lumber",
  brick: "Brick",
  wool: "Wool",
  grain: "Grain",
  ore: "Ore",
};

const AXIAL: [number, number][] = [];
for (let r = 0; r < 5; r++) {
  const width = r < 3 ? 3 + r : 7 - r;
  const q0 = r < 3 ? -r : -2;
  for (let i = 0; i < width; i++) AXIAL.push([q0 + i, r]);
}

export type GeomHex = {
  id: number;
  q: number;
  r: number;
  x: number;
  y: number;
  verts: string[];
  neighbors: number[];
};
export type Geom = {
  hexes: GeomHex[];
  vertices: { id: string; x: number; y: number; hexes: number[]; neighbors: string[] }[];
  edges: { id: string; a: string; b: string; hexes: number[]; coastal: boolean }[];
};

function snap(n: number) {
  return Math.round(n * 100) / 100;
}

export function buildGeometry(size = 48): Geom {
  const centers = AXIAL.map(([q, r], id) => {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * (1.5 * r);
    return { id, q, r, x, y };
  });
  const vertMap = new Map<string, { id: string; x: number; y: number; hexes: number[] }>();
  const edgeMap = new Map<string, { id: string; a: string; b: string; hexes: number[] }>();
  const hexes: GeomHex[] = centers.map((c) => {
    const verts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const x = snap(c.x + size * Math.cos(angle));
      const y = snap(c.y + size * Math.sin(angle));
      const id = `${x},${y}`;
      verts.push(id);
      if (!vertMap.has(id)) vertMap.set(id, { id, x, y, hexes: [] });
      vertMap.get(id)!.hexes.push(c.id);
    }
    for (let i = 0; i < 6; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % 6];
      const id = [a, b].sort().join("|");
      if (!edgeMap.has(id)) edgeMap.set(id, { id, a, b, hexes: [] });
      edgeMap.get(id)!.hexes.push(c.id);
    }
    return { ...c, verts, neighbors: [] };
  });
  const key = (q: number, r: number) => `${q},${r}`;
  const index = new Map(hexes.map((h) => [key(h.q, h.r), h.id]));
  for (const h of hexes) {
    for (const [dq, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, -1],
      [-1, 1],
    ]) {
      const id = index.get(key(h.q + dq, h.r + dr));
      if (id !== undefined) h.neighbors.push(id);
    }
  }
  const neighborSets = new Map<string, Set<string>>();
  for (const e of edgeMap.values()) {
    if (!neighborSets.has(e.a)) neighborSets.set(e.a, new Set());
    if (!neighborSets.has(e.b)) neighborSets.set(e.b, new Set());
    neighborSets.get(e.a)!.add(e.b);
    neighborSets.get(e.b)!.add(e.a);
  }
  const vertices = [...vertMap.values()].map((v) => ({
    ...v,
    neighbors: [...(neighborSets.get(v.id) ?? [])],
  }));
  const edges = [...edgeMap.values()].map((e) => ({ ...e, coastal: e.hexes.length === 1 }));
  return { hexes, vertices, edges };
}

export const GEOM = buildGeometry();

export type HexTile = { res: HexRes; num: number | null };
export type Port = { edge: string; kind: Resource | "any" };

function adjacentNumbers(hexes: { num: number | null; neighbors: number[] }[], id: number) {
  const n = hexes[id].num;
  if (n !== 6 && n !== 8) return false;
  return hexes[id].neighbors.some((nid) => hexes[nid].num === 6 || hexes[nid].num === 8);
}

export function makeBoard(rng: () => number = Math.random): { tiles: HexTile[]; ports: Port[] } {
  const bag: HexRes[] = [
    ..."lumber,lumber,lumber,lumber".split(",") as HexRes[],
    ..."brick,brick,brick".split(",") as HexRes[],
    ..."wool,wool,wool,wool".split(",") as HexRes[],
    ..."grain,grain,grain,grain".split(",") as HexRes[],
    ..."ore,ore,ore".split(",") as HexRes[],
    "desert",
  ];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  const nums = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  let tiles: HexTile[] = [];
  for (let attempt = 0; attempt < 200; attempt++) {
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    let k = 0;
    tiles = bag.map((res) => ({ res, num: res === "desert" ? null : nums[k++] }));
    const view = tiles.map((t, i) => ({ num: t.num, neighbors: GEOM.hexes[i].neighbors }));
    if (!view.some((_, i) => adjacentNumbers(view, i))) break;
  }
  const coastal = GEOM.edges.filter((e) => e.coastal);
  const step = Math.max(1, Math.floor(coastal.length / 9));
  const kinds: (Resource | "any")[] = ["lumber", "brick", "wool", "grain", "ore", "any", "any", "any", "any"];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  const used = new Set<string>();
  const ports: Port[] = [];
  for (let i = 0; ports.length < 9 && i < coastal.length * 2; i++) {
    const edge = coastal[(i * step) % coastal.length];
    if (used.has(edge.id)) continue;
    used.add(edge.id);
    ports.push({ edge: edge.id, kind: kinds[ports.length] });
  }
  return { tiles, ports };
}

export function portAtVertex(ports: Port[], vertex: string): (Resource | "any")[] {
  const out: (Resource | "any")[] = [];
  for (const port of ports) {
    const edge = GEOM.edges.find((e) => e.id === port.edge);
    if (edge && (edge.a === vertex || edge.b === vertex)) out.push(port.kind);
  }
  return out;
}

export function vertexHexes(vertex: string) {
  return GEOM.vertices.find((v) => v.id === vertex)?.hexes ?? [];
}

export function longestRoad(
  roads: Record<string, number | null>,
  buildings: Record<string, { player: number; city: boolean } | null>,
  player: number,
) {
  const owned = GEOM.edges.filter((e) => roads[e.id] === player);
  const blocked = new Set(
    Object.entries(buildings)
      .filter(([, b]) => b && b.player !== player)
      .map(([id]) => id),
  );
  const adj = new Map<string, string[]>();
  for (const e of owned) {
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a)!.push(e.id);
    adj.get(e.b)!.push(e.id);
  }
  let best = 0;
  const nodes = new Set<string>();
  for (const e of owned) {
    nodes.add(e.a);
    nodes.add(e.b);
  }
  function dfs(node: string, used: Set<string>): number {
    let m = 0;
    for (const id of adj.get(node) ?? []) {
      if (used.has(id)) continue;
      const e = GEOM.edges.find((x) => x.id === id)!;
      const next = e.a === node ? e.b : e.a;
      if (blocked.has(next)) continue;
      used.add(id);
      m = Math.max(m, 1 + (blocked.has(next) ? 0 : dfs(next, used)));
      used.delete(id);
    }
    return m;
  }
  for (const n of nodes) best = Math.max(best, dfs(n, new Set()));
  return best;
}

export function devDeck(rng: () => number = Math.random): Dev[] {
  const deck: Dev[] = [
    ...Array(14).fill("knight"),
    ...Array(5).fill("vp"),
    ...Array(2).fill("road"),
    ...Array(2).fill("plenty"),
    ...Array(2).fill("mono"),
  ];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function canAfford(hand: Record<Resource, number>, cost: Partial<Record<Resource, number>>) {
  return RESOURCES.every((r) => (hand[r] ?? 0) >= (cost[r] ?? 0));
}

export function pay(hand: Record<Resource, number>, cost: Partial<Record<Resource, number>>) {
  const next = { ...hand };
  for (const r of RESOURCES) next[r] -= cost[r] ?? 0;
  return next;
}

export function emptyHand(): Record<Resource, number> {
  return { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
}
