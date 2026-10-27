import { describe, expect, it } from "vitest";
import { applyMove, legalMoves, outcome, startChess } from "./chess";
import { applyChecker, legalCheckerMoves, startCheckers, type CBoard } from "./checkers";
import { applyStep, legalSteps, rollDice, startBackgammon, type BGState } from "./backgammon";
import { rentFor, BOARD, type Deed } from "./monopoly";
import { canPlay, freshUnoDeck, type UnoCard } from "./uno";
import { burns, playable, type SHCard } from "./shithead";
import { canFoundation, flipStock, freshDeal, type Card } from "./solitaire";
import { moveToken } from "./chutes";
import { DOORS, isHall, reachable, roomAt, ROOMS, STARTS, H, W } from "./clue";
import { GEOM, longestRoad, makeBoard } from "./catan";
import { forward, slideEnd, slideSquares, sorryDeck, startOf } from "./sorry";
import {
  adjudicate,
  ARMY,
  FLEET,
  PROVINCES,
  startUnits,
  type Order,
  type Unit,
} from "./diplomacy";
import { mulberry32 } from "./util";

describe("chess", () => {
  it("starts with 20 legal moves", () => {
    expect(legalMoves(startChess())).toHaveLength(20);
  });

  it("mates a king shut in the corner", () => {
    const s = startChess();
    s.board = s.board.map(() => null);
    s.board[0] = { c: "w", t: "k" };
    s.board[9] = { c: "b", t: "q" };
    s.board[18] = { c: "b", t: "k" };
    expect(outcome(s, new Map())).toMatch(/checkmate/);
  });

  it("allows castling until the path is attacked", () => {
    const s = startChess();
    s.board[5] = null;
    s.board[6] = null;
    expect(legalMoves(s).some((m) => m.castle === "K")).toBe(true);
    s.board[13] = null;
    s.board[53] = null;
    s.board[61] = { c: "b", t: "r" };
    expect(legalMoves(s).some((m) => m.castle === "K")).toBe(false);
  });

  it("opens with e4 and sets en passant", () => {
    const s = applyMove(startChess(), { from: 12, to: 28 });
    expect(s.board[28]).toEqual({ c: "w", t: "p" });
    expect(s.ep).toBe(20);
    expect(s.turn).toBe("b");
  });
});

describe("en passant direct", () => {
  it("captures the passed pawn", () => {
    const s = startChess();
    s.board = s.board.map(() => null);
    s.board[4] = { c: "w", t: "k" };
    s.board[60] = { c: "b", t: "k" };
    s.board[32] = { c: "w", t: "p" };
    s.board[49] = { c: "b", t: "p" };
    s.turn = "b";
    const after = applyMove(s, { from: 49, to: 33 });
    expect(after.ep).toBe(41);
    const ep = legalMoves(after).find((m) => m.ep);
    expect(ep).toBeTruthy();
    const done = applyMove(after, ep!);
    expect(done.board[33]).toBeNull();
    expect(done.board[41]?.c).toBe("w");
  });
});

describe("checkers", () => {
  it("forces a jump", () => {
    const b: CBoard = startCheckers().map(() => null);
    b[16] = { side: "r", king: false };
    b[25] = { side: "b", king: false };
    const moves = legalCheckerMoves(b, "r", null);
    expect(moves).toEqual([{ from: 16, to: 34, cap: 25 }]);
    const next = applyChecker(b, moves[0]);
    expect(next.board[25]).toBeNull();
    expect(next.board[34]?.side).toBe("r");
  });
});

describe("backgammon", () => {
  it("opens with 15 checkers a side", () => {
    const s = startBackgammon();
    expect(s.w.reduce((a, n) => a + n, 0)).toBe(15);
    expect(s.b.reduce((a, n) => a + n, 0)).toBe(15);
  });

  it("hits a blot and cannot land on a made point", () => {
    const s = startBackgammon();
    s.w = Array(26).fill(0);
    s.b = Array(26).fill(0);
    s.w[13] = 1;
    s.w[6] = 1;
    s.w[25] = 13;
    s.b[7] = 1;
    s.b[8] = 2;
    s.b[25] = 12;
    s.dice = [6, 5];
    const steps = legalSteps(s);
    expect(steps.some((step) => step.from === 13 && step.to === 7)).toBe(true);
    expect(steps.some((step) => step.from === 13 && step.to === 8)).toBe(false);
    const next = applyStep(s, steps.find((step) => step.to === 7)!);
    expect(next.b[0]).toBe(1);
    expect(next.b[7]).toBe(0);
  });

  it("bears off with an exact and an oversized die", () => {
    const s: BGState = { ...startBackgammon(), w: Array(26).fill(0), b: Array(26).fill(0), dice: [6, 2] };
    s.w[6] = 1;
    s.w[4] = 1;
    s.w[25] = 13;
    s.b[25] = 15;
    const steps = legalSteps(s);
    expect(steps.some((step) => step.from === 6 && step.to === 25 && step.die === 6)).toBe(true);
    expect(steps.some((step) => step.from === 4 && step.to === 25 && step.die === 6)).toBe(false);
  });

  it("rolls doubles as four dice", () => {
    const rng = () => 0;
    expect(rollDice(rng)).toEqual([1, 1, 1, 1]);
  });
});

describe("monopoly rent", () => {
  it("doubles a color set and scales houses", () => {
    const deeds: Deed[] = BOARD.map(() => ({ owner: null, houses: 0, mortgaged: false }));
    deeds[1] = { owner: 0, houses: 0, mortgaged: false };
    deeds[3] = { owner: 0, houses: 0, mortgaged: false };
    const med = BOARD[1];
    if (med.kind !== "prop") throw new Error("med");
    expect(rentFor(med, deeds[1], deeds, 7)).toBe(4);
    deeds[1].houses = 1;
    expect(rentFor(med, deeds[1], deeds, 7)).toBe(10);
  });
});

describe("uno", () => {
  it("builds a 108 card deck and gates wild draw four", () => {
    const deck = freshUnoDeck();
    expect(deck).toHaveLength(108);
    const hand: UnoCard[] = [
      { id: 1, color: "R", kind: "n", n: 5 },
      { id: 2, color: "W", kind: "wd4" },
    ];
    const top: UnoCard = { id: 9, color: "R", kind: "n", n: 1 };
    expect(canPlay(hand[1], top, "R", hand)).toBe(false);
    expect(canPlay(hand[1], top, "Y", hand)).toBe(true);
  });
});

describe("shithead", () => {
  it("lets a ten burn and a four-of-a-kind burn", () => {
    const c = (r: number): SHCard => ({ id: r, r });
    expect(playable(c(3), [])).toBe(true);
    expect(playable(c(5), [c(9)])).toBe(false);
    expect(playable(c(10), [c(13)])).toBe(true);
    expect(burns([c(4), c(4), c(4), c(4)])).toBe(true);
    expect(burns([c(10)])).toBe(true);
  });
});

describe("solitaire", () => {
  it("deals 52 cards and stacks aces", () => {
    const s = freshDeal(1, mulberry32(1));
    const n =
      s.stock.length +
      s.waste.length +
      s.tableau.reduce((a, p) => a + p.length, 0);
    expect(n).toBe(52);
    const ace: Card = { r: 1, s: "h", up: true };
    expect(canFoundation([[], [], [], []], ace)).toBe(0);
    expect(canFoundation([[{ r: 1, s: "h", up: true }], [], [], []], { r: 2, s: "h", up: true })).toBe(0);
    const turned = flipStock(s);
    expect(turned.waste).toHaveLength(1);
    expect(turned.waste[0].up).toBe(true);
    expect(turned.stock).toHaveLength(s.stock.length - 1);
  });
});

describe("chutes", () => {
  it("climbs, slides, and refuses to pass 100", () => {
    expect(moveToken(2, 1).to).toBe(3);
    expect(moveToken(0, 1).to).toBe(38);
    expect(moveToken(95, 3).to).toBe(78);
    expect(moveToken(98, 3).to).toBe(98);
  });
});

describe("clue map", () => {
  it("has nine rooms, valid doors, and a connected hallway", () => {
    const seen = new Set<string>();
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const room = roomAt(r, c);
        if (room) seen.add(room);
      }
    }
    expect([...seen].sort()).toEqual([...ROOMS].sort());
    for (const d of DOORS) {
      expect(isHall(d.r, d.c)).toBe(true);
      const touch = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dr, dc]) => roomAt(d.r + dr, d.c + dc) === d.room);
      expect(touch).toBe(true);
    }
    for (const pos of Object.values(STARTS)) {
      if (pos.t === "hall") expect(isHall(pos.r, pos.c)).toBe(true);
    }
    const fromStudy = reachable({ t: "room", room: "Study" }, 12, new Set());
    expect(fromStudy.some((p) => p.t === "hall")).toBe(true);
  });
});

describe("catan geometry", () => {
  it("has 19 hexes, 54 vertices, and nine ports", () => {
    expect(GEOM.hexes).toHaveLength(19);
    expect(GEOM.vertices).toHaveLength(54);
    const board = makeBoard(mulberry32(3));
    expect(board.tiles.filter((t) => t.res === "desert")).toHaveLength(1);
    expect(board.ports).toHaveLength(9);
    const reds = board.tiles.filter((t) => t.num === 6 || t.num === 8);
    for (const tile of board.tiles) {
      if (tile.num !== 6 && tile.num !== 8) continue;
      const id = board.tiles.indexOf(tile);
      const touch = GEOM.hexes[id].neighbors.some((n) => board.tiles[n].num === 6 || board.tiles[n].num === 8);
      expect(touch).toBe(false);
    }
    expect(reds.length).toBe(4);
  });

  it("breaks a road at an opponent settlement", () => {
    const edges = GEOM.edges.slice(0, 5);
    const roads: Record<string, number | null> = {};
    for (const e of edges) roads[e.id] = 0;
    expect(longestRoad(roads, {}, 0)).toBeGreaterThanOrEqual(3);
  });
});

describe("sorry", () => {
  it("deals 45 cards, slides, and enters home exactly", () => {
    expect(sorryDeck()).toHaveLength(45);
    expect(slideEnd(0, (startOf(1) + 1) % 60)).toBe((startOf(1) + 4) % 60);
    expect(slideSquares(0, (startOf(1) + 1) % 60)).toHaveLength(4);
    const near = forward(0, { z: "track", i: (startOf(0) + 58) % 60 }, 3);
    expect(near).toEqual({ z: "safe", n: 1 });
    expect(forward(0, { z: "safe", n: 4 }, 2)).toBeNull();
  });
});

describe("diplomacy map", () => {
  it("is symmetric for armies and fleets", () => {
    for (const [a, list] of Object.entries(ARMY)) {
      for (const b of list) expect(ARMY[b], `${b} missing ${a}`).toContain(a);
    }
    for (const [a, list] of Object.entries(FLEET)) {
      for (const b of list) expect(FLEET[b], `${a}->${b}`).toContain(a);
    }
    expect(PROVINCES.filter((p) => p.sc)).toHaveLength(34);
    expect(startUnits(["Austria", "England", "France", "Germany", "Italy", "Russia", "Turkey"])).toHaveLength(22);
  });
});

function unit(power: Unit["power"], type: Unit["type"], loc: string): Unit {
  return { power, type, loc };
}
function move(u: Unit, to: string, via?: "convoy"): Order {
  return { power: u.power, type: u.type, loc: u.loc, action: "move", to, via };
}
function support(u: Unit, ally: string, to: string): Order {
  return { power: u.power, type: u.type, loc: u.loc, action: "support", ally, to };
}
function convoy(u: Unit, ally: string, to: string): Order {
  return { power: u.power, type: u.type, loc: u.loc, action: "convoy", ally, to };
}

describe("diplomacy adjudication", () => {
  it("bounces equal moves", () => {
    const units = [unit("France", "A", "par"), unit("Germany", "A", "mun")];
    const orders = [move(units[0], "bur"), move(units[1], "bur")];
    const result = adjudicate(units, orders);
    expect(result.units.map((u) => u.loc).sort()).toEqual(["mun", "par"]);
    expect(result.dislodged).toHaveLength(0);
  });

  it("dislodges with support", () => {
    const units = [unit("France", "A", "par"), unit("France", "A", "gas"), unit("Germany", "A", "bur")];
    const orders: Order[] = [move(units[0], "bur"), support(units[1], "par", "bur"), { power: "Germany", type: "A", loc: "bur", action: "hold" }];
    const result = adjudicate(units, orders);
    expect(result.units.find((u) => u.power === "France" && u.type === "A" && u.loc === "bur")).toBeTruthy();
    expect(result.dislodged.map((d) => d.unit.loc)).toEqual(["bur"]);
  });

  it("cuts support from the side", () => {
    const units = [unit("France", "A", "par"), unit("France", "A", "mar"), unit("Italy", "A", "pie"), unit("Germany", "A", "bur")];
    const orders: Order[] = [
      move(units[0], "bur"),
      support(units[1], "par", "bur"),
      move(units[2], "mar"),
      { power: "Germany", type: "A", loc: "bur", action: "hold" },
    ];
    const result = adjudicate(units, orders);
    expect(result.dislodged).toHaveLength(0);
    expect(result.units.map((u) => u.loc).sort()).toEqual(["bur", "mar", "par", "pie"]);
  });

  it("does not cut support given against the attacker", () => {
    const units = [unit("Germany", "A", "mun"), unit("Germany", "A", "ber"), unit("France", "A", "kie")];
    const orders: Order[] = [move(units[0], "kie"), support(units[1], "mun", "kie"), move(units[2], "ber")];
    const result = adjudicate(units, orders);
    expect(result.units.some((u) => u.loc === "kie" && u.power === "Germany")).toBe(true);
    expect(result.dislodged.map((d) => d.from)).toContain("kie");
  });

  it("convoys an army", () => {
    const units = [unit("England", "A", "lon"), unit("England", "F", "nth")];
    const orders: Order[] = [move(units[0], "nwy", "convoy"), convoy(units[1], "lon", "nwy")];
    const result = adjudicate(units, orders);
    expect(result.units.map((u) => u.loc).sort()).toEqual(["nth", "nwy"]);
  });

  it("rotates a cycle", () => {
    const units = [unit("Germany", "A", "kie"), unit("Germany", "A", "ber"), unit("Germany", "A", "mun")];
    const orders = [move(units[0], "ber"), move(units[1], "mun"), move(units[2], "kie")];
    const result = adjudicate(units, orders);
    expect(result.dislodged).toHaveLength(0);
    expect(result.report.some((line) => line.includes("KIE") && line.includes("BER"))).toBe(true);
    expect(result.report.some((line) => line.includes("MUN") && line.includes("KIE"))).toBe(true);
    expect(result.units.map((u) => u.loc).sort()).toEqual(["ber", "kie", "mun"]);
  });

  it("refuses to dislodge its own unit", () => {
    const units = [unit("Germany", "A", "mun"), unit("Germany", "A", "kie"), unit("Germany", "A", "ber")];
    const orders: Order[] = [move(units[0], "ber"), support(units[1], "mun", "ber"), { power: "Germany", type: "A", loc: "ber", action: "hold" }];
    const result = adjudicate(units, orders);
    expect(result.dislodged).toHaveLength(0);
    expect(result.units.some((u) => u.loc === "ber")).toBe(true);
  });

  it("swaps by convoy when the provinces also touch by land", () => {
    const units = [unit("France", "A", "gas"), unit("France", "F", "mao"), unit("Italy", "A", "spa")];
    const orders: Order[] = [move(units[0], "spa", "convoy"), convoy(units[1], "gas", "spa"), move(units[2], "gas")];
    const result = adjudicate(units, orders);
    expect(result.dislodged).toHaveLength(0);
    expect(result.units.find((u) => u.loc === "spa")?.power).toBe("France");
    expect(result.units.find((u) => u.loc === "gas")?.power).toBe("Italy");
  });
});
