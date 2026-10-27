export const POWERS = ["Austria", "England", "France", "Germany", "Italy", "Russia", "Turkey"] as const;
export type Power = (typeof POWERS)[number];

export const POWER_COLOR: Record<Power, string> = {
  Austria: "#c0392b",
  England: "#1d4e89",
  France: "#5dade2",
  Germany: "#4a4a4a",
  Italy: "#1e8f4e",
  Russia: "#f4f1ea",
  Turkey: "#e2b33a",
};

export type Province = {
  id: string;
  name: string;
  kind: "inland" | "coast" | "sea";
  sc: boolean;
  home: Power | null;
  x: number;
  y: number;
};

export const PROVINCES: Province[] = [
  { id: "nao", name: "North Atlantic", kind: "sea", sc: false, home: null, x: 70, y: 250 },
  { id: "nwg", name: "Norwegian Sea", kind: "sea", sc: false, home: null, x: 250, y: 70 },
  { id: "bar", name: "Barents Sea", kind: "sea", sc: false, home: null, x: 470, y: 40 },
  { id: "nth", name: "North Sea", kind: "sea", sc: false, home: null, x: 300, y: 230 },
  { id: "ska", name: "Skagerrak", kind: "sea", sc: false, home: null, x: 400, y: 210 },
  { id: "hel", name: "Helgoland Bight", kind: "sea", sc: false, home: null, x: 340, y: 300 },
  { id: "bal", name: "Baltic Sea", kind: "sea", sc: false, home: null, x: 490, y: 280 },
  { id: "bot", name: "Gulf of Bothnia", kind: "sea", sc: false, home: null, x: 520, y: 170 },
  { id: "iri", name: "Irish Sea", kind: "sea", sc: false, home: null, x: 120, y: 360 },
  { id: "eng", name: "English Channel", kind: "sea", sc: false, home: null, x: 200, y: 390 },
  { id: "mao", name: "Mid-Atlantic", kind: "sea", sc: false, home: null, x: 70, y: 500 },
  { id: "wes", name: "Western Med.", kind: "sea", sc: false, home: null, x: 230, y: 680 },
  { id: "gol", name: "Gulf of Lyon", kind: "sea", sc: false, home: null, x: 300, y: 620 },
  { id: "tyn", name: "Tyrrhenian Sea", kind: "sea", sc: false, home: null, x: 390, y: 690 },
  { id: "ion", name: "Ionian Sea", kind: "sea", sc: false, home: null, x: 500, y: 760 },
  { id: "adr", name: "Adriatic Sea", kind: "sea", sc: false, home: null, x: 480, y: 640 },
  { id: "aeg", name: "Aegean Sea", kind: "sea", sc: false, home: null, x: 640, y: 720 },
  { id: "eas", name: "Eastern Med.", kind: "sea", sc: false, home: null, x: 760, y: 780 },
  { id: "bla", name: "Black Sea", kind: "sea", sc: false, home: null, x: 720, y: 540 },
  { id: "cly", name: "Clyde", kind: "coast", sc: false, home: null, x: 175, y: 175 },
  { id: "edi", name: "Edinburgh", kind: "coast", sc: true, home: "England", x: 230, y: 190 },
  { id: "lvp", name: "Liverpool", kind: "coast", sc: true, home: "England", x: 190, y: 250 },
  { id: "yor", name: "Yorkshire", kind: "coast", sc: false, home: null, x: 250, y: 260 },
  { id: "lon", name: "London", kind: "coast", sc: true, home: "England", x: 250, y: 330 },
  { id: "wal", name: "Wales", kind: "coast", sc: false, home: null, x: 190, y: 330 },
  { id: "bre", name: "Brest", kind: "coast", sc: true, home: "France", x: 190, y: 450 },
  { id: "pic", name: "Picardy", kind: "coast", sc: false, home: null, x: 260, y: 420 },
  { id: "par", name: "Paris", kind: "inland", sc: true, home: "France", x: 250, y: 480 },
  { id: "bur", name: "Burgundy", kind: "inland", sc: false, home: null, x: 320, y: 470 },
  { id: "gas", name: "Gascony", kind: "coast", sc: false, home: null, x: 220, y: 540 },
  { id: "mar", name: "Marseilles", kind: "coast", sc: true, home: "France", x: 300, y: 560 },
  { id: "spa", name: "Spain", kind: "coast", sc: true, home: null, x: 150, y: 600 },
  { id: "por", name: "Portugal", kind: "coast", sc: true, home: null, x: 70, y: 600 },
  { id: "naf", name: "North Africa", kind: "coast", sc: false, home: null, x: 180, y: 760 },
  { id: "tun", name: "Tunis", kind: "coast", sc: true, home: null, x: 360, y: 800 },
  { id: "bel", name: "Belgium", kind: "coast", sc: true, home: null, x: 300, y: 380 },
  { id: "hol", name: "Holland", kind: "coast", sc: true, home: null, x: 340, y: 360 },
  { id: "ruh", name: "Ruhr", kind: "inland", sc: false, home: null, x: 370, y: 410 },
  { id: "kie", name: "Kiel", kind: "coast", sc: true, home: "Germany", x: 390, y: 350 },
  { id: "den", name: "Denmark", kind: "coast", sc: true, home: null, x: 400, y: 270 },
  { id: "ber", name: "Berlin", kind: "coast", sc: true, home: "Germany", x: 450, y: 360 },
  { id: "mun", name: "Munich", kind: "inland", sc: true, home: "Germany", x: 400, y: 460 },
  { id: "sil", name: "Silesia", kind: "inland", sc: false, home: null, x: 500, y: 400 },
  { id: "pru", name: "Prussia", kind: "coast", sc: false, home: null, x: 510, y: 330 },
  { id: "boh", name: "Bohemia", kind: "inland", sc: false, home: null, x: 470, y: 460 },
  { id: "vie", name: "Vienna", kind: "inland", sc: true, home: "Austria", x: 500, y: 510 },
  { id: "tyr", name: "Tyrolia", kind: "inland", sc: false, home: null, x: 420, y: 530 },
  { id: "tri", name: "Trieste", kind: "coast", sc: true, home: "Austria", x: 490, y: 570 },
  { id: "bud", name: "Budapest", kind: "inland", sc: true, home: "Austria", x: 560, y: 520 },
  { id: "gal", name: "Galicia", kind: "inland", sc: false, home: null, x: 580, y: 440 },
  { id: "pie", name: "Piedmont", kind: "coast", sc: false, home: null, x: 360, y: 570 },
  { id: "ven", name: "Venice", kind: "coast", sc: true, home: "Italy", x: 430, y: 590 },
  { id: "tus", name: "Tuscany", kind: "coast", sc: false, home: null, x: 400, y: 630 },
  { id: "rom", name: "Rome", kind: "coast", sc: true, home: "Italy", x: 430, y: 670 },
  { id: "nap", name: "Naples", kind: "coast", sc: true, home: "Italy", x: 480, y: 710 },
  { id: "apu", name: "Apulia", kind: "coast", sc: false, home: null, x: 500, y: 670 },
  { id: "nwy", name: "Norway", kind: "coast", sc: true, home: null, x: 380, y: 130 },
  { id: "swe", name: "Sweden", kind: "coast", sc: true, home: null, x: 460, y: 160 },
  { id: "fin", name: "Finland", kind: "coast", sc: false, home: null, x: 540, y: 110 },
  { id: "stp", name: "St. Petersburg", kind: "coast", sc: true, home: "Russia", x: 620, y: 120 },
  { id: "lvn", name: "Livonia", kind: "coast", sc: false, home: null, x: 580, y: 230 },
  { id: "mos", name: "Moscow", kind: "inland", sc: true, home: "Russia", x: 700, y: 220 },
  { id: "war", name: "Warsaw", kind: "inland", sc: true, home: "Russia", x: 590, y: 330 },
  { id: "ukr", name: "Ukraine", kind: "inland", sc: false, home: null, x: 660, y: 380 },
  { id: "sev", name: "Sevastopol", kind: "coast", sc: true, home: "Russia", x: 760, y: 420 },
  { id: "ser", name: "Serbia", kind: "inland", sc: true, home: null, x: 580, y: 590 },
  { id: "alb", name: "Albania", kind: "coast", sc: false, home: null, x: 550, y: 650 },
  { id: "gre", name: "Greece", kind: "coast", sc: true, home: null, x: 590, y: 700 },
  { id: "bul", name: "Bulgaria", kind: "coast", sc: true, home: null, x: 650, y: 620 },
  { id: "rum", name: "Rumania", kind: "coast", sc: true, home: null, x: 660, y: 540 },
  { id: "con", name: "Constantinople", kind: "coast", sc: true, home: "Turkey", x: 720, y: 640 },
  { id: "ank", name: "Ankara", kind: "coast", sc: true, home: "Turkey", x: 820, y: 600 },
  { id: "smy", name: "Smyrna", kind: "coast", sc: true, home: "Turkey", x: 780, y: 700 },
  { id: "arm", name: "Armenia", kind: "coast", sc: false, home: null, x: 880, y: 540 },
  { id: "syr", name: "Syria", kind: "coast", sc: false, home: null, x: 880, y: 680 },
];

export const ARMY: Record<string, string[]> = {
  cly: ["edi", "lvp"],
  edi: ["cly", "lvp", "yor"],
  lvp: ["cly", "edi", "yor", "wal"],
  yor: ["edi", "lvp", "wal", "lon"],
  lon: ["yor", "wal"],
  wal: ["lvp", "yor", "lon"],
  bre: ["pic", "par", "gas"],
  pic: ["bre", "par", "bur", "bel"],
  par: ["bre", "pic", "bur", "gas"],
  bur: ["par", "pic", "bel", "ruh", "mun", "mar", "gas"],
  gas: ["bre", "par", "bur", "mar", "spa"],
  mar: ["bur", "gas", "spa", "pie"],
  spa: ["gas", "mar", "por"],
  por: ["spa"],
  naf: ["tun"],
  tun: ["naf"],
  bel: ["pic", "bur", "ruh", "hol"],
  hol: ["bel", "ruh", "kie"],
  ruh: ["bel", "hol", "kie", "mun", "bur"],
  kie: ["hol", "ruh", "mun", "ber", "den"],
  den: ["kie", "swe"],
  ber: ["kie", "mun", "sil", "pru"],
  mun: ["bur", "ruh", "kie", "ber", "sil", "boh", "tyr"],
  sil: ["ber", "mun", "boh", "gal", "war", "pru"],
  pru: ["ber", "sil", "war", "lvn"],
  boh: ["mun", "sil", "gal", "vie", "tyr"],
  vie: ["boh", "gal", "bud", "tri", "tyr"],
  tyr: ["mun", "boh", "vie", "tri", "ven", "pie"],
  tri: ["vie", "bud", "ser", "alb", "tyr", "ven"],
  bud: ["vie", "gal", "rum", "ser", "tri"],
  gal: ["sil", "boh", "vie", "bud", "rum", "ukr", "war"],
  pie: ["mar", "tyr", "ven", "tus"],
  ven: ["pie", "tyr", "tri", "tus", "apu"],
  tus: ["pie", "ven", "rom"],
  rom: ["tus", "apu", "nap"],
  nap: ["rom", "apu"],
  apu: ["ven", "rom", "nap"],
  nwy: ["swe", "fin", "stp"],
  swe: ["nwy", "fin", "den"],
  fin: ["nwy", "swe", "stp"],
  stp: ["nwy", "fin", "lvn", "mos"],
  lvn: ["stp", "pru", "war", "mos"],
  mos: ["stp", "lvn", "war", "ukr", "sev"],
  war: ["pru", "sil", "gal", "ukr", "mos", "lvn"],
  ukr: ["war", "mos", "sev", "rum", "gal"],
  sev: ["mos", "ukr", "rum", "arm"],
  ser: ["bud", "rum", "bul", "gre", "alb", "tri"],
  alb: ["tri", "ser", "gre"],
  gre: ["alb", "ser", "bul"],
  bul: ["rum", "ser", "gre", "con"],
  rum: ["bud", "gal", "ukr", "sev", "bul", "ser"],
  con: ["bul", "ank", "smy"],
  ank: ["con", "arm", "smy"],
  smy: ["con", "ank", "arm", "syr"],
  arm: ["ank", "smy", "syr", "sev"],
  syr: ["smy", "arm"],
};

export const FLEET: Record<string, string[]> = {
  nao: ["nwg", "cly", "lvp", "iri", "mao"],
  nwg: ["nao", "bar", "nwy", "nth", "edi", "cly"],
  bar: ["nwg", "nwy", "stp/nc"],
  nth: ["nwg", "nwy", "ska", "den", "hel", "hol", "bel", "eng", "lon", "yor", "edi"],
  ska: ["nth", "nwy", "den", "swe"],
  hel: ["nth", "den", "kie", "hol"],
  bal: ["den", "swe", "bot", "lvn", "pru", "ber", "kie"],
  bot: ["swe", "fin", "stp/sc", "lvn", "bal"],
  iri: ["nao", "lvp", "wal", "eng", "mao"],
  eng: ["iri", "wal", "lon", "nth", "bel", "pic", "bre", "mao"],
  mao: ["nao", "iri", "eng", "bre", "gas", "spa/nc", "por", "naf", "wes"],
  wes: ["mao", "spa/sc", "gol", "tyn", "tun", "naf"],
  gol: ["wes", "spa/sc", "mar", "pie", "tus", "tyn"],
  tyn: ["wes", "gol", "tus", "rom", "nap", "ion", "tun"],
  ion: ["tun", "tyn", "nap", "apu", "adr", "alb", "gre", "aeg", "eas"],
  adr: ["apu", "ven", "tri", "alb", "ion"],
  aeg: ["ion", "gre", "bul/sc", "con", "smy", "eas"],
  eas: ["ion", "aeg", "smy", "syr"],
  bla: ["rum", "sev", "arm", "ank", "con", "bul/ec"],
  cly: ["nao", "nwg", "edi", "lvp"],
  edi: ["cly", "nwg", "nth", "yor", "lvp"],
  lvp: ["cly", "edi", "yor", "wal", "iri", "nao"],
  yor: ["edi", "nth", "lon", "wal", "lvp"],
  lon: ["yor", "nth", "eng", "wal"],
  wal: ["lvp", "yor", "lon", "eng", "iri"],
  bre: ["eng", "pic", "gas", "mao"],
  pic: ["bre", "eng", "bel"],
  bel: ["pic", "eng", "nth", "hol"],
  hol: ["bel", "nth", "hel", "kie"],
  kie: ["hol", "hel", "den", "bal", "ber"],
  den: ["kie", "hel", "nth", "ska", "swe", "bal"],
  ber: ["kie", "bal", "pru"],
  pru: ["ber", "bal", "lvn"],
  nwy: ["nwg", "bar", "stp/nc", "swe", "ska", "nth"],
  swe: ["nwy", "fin", "bot", "bal", "den", "ska"],
  fin: ["swe", "stp/sc", "bot"],
  "stp/nc": ["bar", "nwy"],
  "stp/sc": ["bot", "fin", "lvn"],
  lvn: ["bot", "bal", "pru", "stp/sc"],
  gas: ["bre", "mao", "spa/nc"],
  "spa/nc": ["gas", "mao", "por"],
  "spa/sc": ["mar", "gol", "wes", "por"],
  por: ["mao", "spa/nc", "spa/sc"],
  mar: ["spa/sc", "gol", "pie"],
  pie: ["mar", "gol", "tus"],
  tus: ["pie", "gol", "tyn", "rom"],
  rom: ["tus", "tyn", "nap"],
  nap: ["rom", "tyn", "ion", "apu"],
  apu: ["nap", "ion", "adr", "ven"],
  ven: ["apu", "adr", "tri"],
  tri: ["ven", "adr", "alb"],
  alb: ["tri", "adr", "ion", "gre"],
  gre: ["alb", "ion", "aeg", "bul/sc"],
  "bul/sc": ["gre", "aeg", "con"],
  "bul/ec": ["rum", "bla", "con"],
  rum: ["bul/ec", "bla", "sev"],
  sev: ["rum", "bla", "arm"],
  arm: ["sev", "bla", "ank"],
  ank: ["arm", "bla", "con"],
  con: ["ank", "bla", "bul/ec", "bul/sc", "aeg", "smy"],
  smy: ["con", "aeg", "eas", "syr"],
  syr: ["smy", "eas"],
  naf: ["mao", "wes", "tun"],
  tun: ["naf", "wes", "tyn", "ion"],
};

export const SEAS = new Set(PROVINCES.filter((p) => p.kind === "sea").map((p) => p.id));
export const SPLIT = new Set(["spa", "stp", "bul"]);

export function provOf(loc: string) {
  return loc.split("/")[0];
}

export function coastsOf(prov: string): string[] {
  if (prov === "spa") return ["spa/nc", "spa/sc"];
  if (prov === "stp") return ["stp/nc", "stp/sc"];
  if (prov === "bul") return ["bul/ec", "bul/sc"];
  return [prov];
}

export type UnitType = "A" | "F";
export type Unit = { power: Power; type: UnitType; loc: string };
export type Order =
  | { power: Power; type: UnitType; loc: string; action: "hold" }
  | { power: Power; type: UnitType; loc: string; action: "move"; to: string; via?: "convoy" }
  | { power: Power; type: UnitType; loc: string; action: "support"; ally: string; to: string }
  | { power: Power; type: UnitType; loc: string; action: "convoy"; ally: string; to: string };

export function startUnits(active: Power[]): Unit[] {
  const all: Unit[] = [
    { power: "Austria", type: "A", loc: "vie" },
    { power: "Austria", type: "A", loc: "bud" },
    { power: "Austria", type: "F", loc: "tri" },
    { power: "England", type: "F", loc: "edi" },
    { power: "England", type: "A", loc: "lvp" },
    { power: "England", type: "F", loc: "lon" },
    { power: "France", type: "A", loc: "par" },
    { power: "France", type: "A", loc: "mar" },
    { power: "France", type: "F", loc: "bre" },
    { power: "Germany", type: "A", loc: "ber" },
    { power: "Germany", type: "A", loc: "mun" },
    { power: "Germany", type: "F", loc: "kie" },
    { power: "Italy", type: "A", loc: "ven" },
    { power: "Italy", type: "A", loc: "rom" },
    { power: "Italy", type: "F", loc: "nap" },
    { power: "Russia", type: "A", loc: "mos" },
    { power: "Russia", type: "A", loc: "war" },
    { power: "Russia", type: "F", loc: "sev" },
    { power: "Russia", type: "F", loc: "stp/sc" },
    { power: "Turkey", type: "A", loc: "con" },
    { power: "Turkey", type: "A", loc: "smy" },
    { power: "Turkey", type: "F", loc: "ank" },
  ];
  return all.filter((u) => active.includes(u.power));
}

export function homeCenters(): Record<string, Power> {
  const own: Record<string, Power> = {};
  for (const p of PROVINCES) if (p.home) own[p.id] = p.home;
  return own;
}

export function supplyCenters() {
  return PROVINCES.filter((p) => p.sc).map((p) => p.id);
}

function armyStep(from: string, to: string) {
  return (ARMY[provOf(from)] ?? []).includes(provOf(to));
}
function fleetStep(from: string, to: string) {
  return (FLEET[from] ?? []).includes(to);
}

function seasTouching(prov: string) {
  const seas = new Set<string>();
  for (const loc of coastsOf(prov)) {
    for (const n of FLEET[loc] ?? []) if (SEAS.has(provOf(n))) seas.add(provOf(n));
  }
  return [...seas];
}

function convoyPath(from: string, to: string, fleets: Set<string>) {
  const start = seasTouching(from).filter((s) => fleets.has(s));
  const goal = new Set(seasTouching(to));
  const seen = new Set<string>();
  const q = [...start];
  while (q.length) {
    const s = q.shift()!;
    if (seen.has(s)) continue;
    seen.add(s);
    if (goal.has(s)) return true;
    for (const n of FLEET[s] ?? []) if (fleets.has(n) && SEAS.has(n)) q.push(n);
  }
  return false;
}

type MoveState = "pending" | "moved" | "bounce" | "stay";

export type AdjResult = {
  units: Unit[];
  dislodged: { unit: Unit; from: string; ban: string }[];
  standoffs: string[];
  report: string[];
};

export function adjudicate(units: Unit[], orders: Order[]): AdjResult {
  let disrupted = new Set<string>();
  let last = "";
  let result = onePass(units, orders, disrupted, false);
  for (let i = 0; i < 8; i++) {
    const next = new Set(result.dislodged.filter((d) => d.unit.type === "F" && SEAS.has(provOf(d.unit.loc))).map((d) => d.unit.loc));
    const key = [...next].sort().join(",");
    if (key === last) break;
    if (i > 0 && key === "") {
      disrupted = next;
      result = onePass(units, orders, disrupted, true);
      break;
    }
    last = [...disrupted].sort().join(",");
    if (eq(next, disrupted)) break;
    disrupted = next;
    result = onePass(units, orders, disrupted, false);
  }
  return result;
}

function eq(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function onePass(units: Unit[], orders: Order[], disrupted: Set<string>, failConvoys: boolean): AdjResult {
  const orderOf = new Map<string, Order>();
  for (const u of units) {
    orderOf.set(
      u.loc,
      orders.find((o) => o.loc === u.loc && o.power === u.power) ?? { power: u.power, type: u.type, loc: u.loc, action: "hold" },
    );
  }
  const convoyFleets = new Set<string>();
  for (const u of units) {
    const o = orderOf.get(u.loc)!;
    if (o.action === "convoy" && u.type === "F" && SEAS.has(provOf(u.loc)) && !disrupted.has(u.loc)) {
      const army = units.find((a) => a.loc === o.ally || provOf(a.loc) === provOf(o.ally));
      const armyOrder = army ? orderOf.get(army.loc) : undefined;
      if (army && armyOrder?.action === "move" && provOf(armyOrder.to) === provOf(o.to) && armyOrder.via === "convoy") {
        convoyFleets.add(provOf(u.loc));
      }
    }
  }

  function convoyed(u: Unit) {
    const o = orderOf.get(u.loc)!;
    return o.action === "move" && o.via === "convoy";
  }
  function pathOk(u: Unit) {
    const o = orderOf.get(u.loc)!;
    if (o.action !== "move") return false;
    return convoyPath(provOf(u.loc), provOf(o.to), convoyFleets);
  }
  function moveLegal(u: Unit) {
    const o = orderOf.get(u.loc)!;
    if (o.action !== "move") return false;
    if (failConvoys && convoyed(u)) return false;
    if (convoyed(u)) return pathOk(u);
    if (u.type === "A") return armyStep(u.loc, o.to);
    return fleetStep(u.loc, o.to);
  }

  const cuts = new Set<string>();
  for (const u of units) {
    const o = orderOf.get(u.loc)!;
    if (o.action !== "support") continue;
    for (const atk of units) {
      if (!moveLegal(atk)) continue;
      const dest = provOf(orderOf.get(atk.loc)!.action === "move" ? (orderOf.get(atk.loc) as { to: string }).to : "");
      if (dest !== provOf(u.loc)) continue;
      if (provOf(atk.loc) === provOf(o.to)) continue;
      cuts.add(u.loc);
    }
  }

  function supportCount(targetLoc: string, toProv: string) {
    let n = 0;
    for (const u of units) {
      const o = orderOf.get(u.loc)!;
      if (o.action !== "support" || cuts.has(u.loc)) continue;
      if (provOf(o.ally) !== provOf(targetLoc) || provOf(o.to) !== toProv) continue;
      const can = u.type === "A" ? armyStep(u.loc, o.to) : fleetStep(u.loc, coastForSupport(u.loc, o.to));
      if (!can) continue;
      const ally = units.find((x) => provOf(x.loc) === provOf(o.ally));
      if (!ally) continue;
      const ao = orderOf.get(ally.loc)!;
      if (provOf(o.ally) === toProv) {
        if (ao.action === "move") continue;
      } else if (!(ao.action === "move" && provOf(ao.to) === toProv)) continue;
      n++;
    }
    return n;
  }

  function atkStr(u: Unit) {
    if (!moveLegal(u)) return 0;
    const o = orderOf.get(u.loc)!;
    if (o.action !== "move") return 0;
    return 1 + supportCount(u.loc, provOf(o.to));
  }
  function holdStr(u: Unit) {
    return 1 + supportCount(u.loc, provOf(u.loc));
  }

  const state = new Map<string, MoveState>();
  for (const u of units) state.set(u.loc, moveLegal(u) ? "pending" : "stay");

  const destProv = (u: Unit) => {
    const o = orderOf.get(u.loc)!;
    return o.action === "move" ? provOf(o.to) : "";
  };
  const unitAt = (prov: string) => units.find((u) => provOf(u.loc) === prov);

  function isH2H(a: Unit, b: Unit) {
    const oa = orderOf.get(a.loc)!;
    const ob = orderOf.get(b.loc)!;
    if (oa.action !== "move" || ob.action !== "move") return false;
    if (oa.via === "convoy" || ob.via === "convoy") return false;
    return provOf(oa.to) === provOf(b.loc) && provOf(ob.to) === provOf(a.loc);
  }
  function unique(u: Unit) {
    const s = atkStr(u);
    return !units.some((o) => {
      if (o.loc === u.loc) return false;
      if (destProv(o) !== destProv(u)) return false;
      const st = state.get(o.loc);
      if (st !== "pending" && st !== "moved") return false;
      return atkStr(o) >= s;
    });
  }

  let guard = 0;
  let progress = true;
  while (progress && guard++ < 60) {
    progress = false;
    const dests = new Set(units.filter((u) => state.get(u.loc) === "pending").map(destProv));
    for (const dest of dests) {
      const incoming = units.filter((u) => state.get(u.loc) === "pending" && destProv(u) === dest);
      if (incoming.length < 2) continue;
      const max = Math.max(...incoming.map(atkStr));
      const tops = incoming.filter((u) => atkStr(u) === max);
      if (tops.length >= 2) {
        for (const u of incoming) state.set(u.loc, "bounce");
        progress = true;
      }
    }
    for (const u of units) {
      if (state.get(u.loc) !== "pending") continue;
      const occ = unitAt(destProv(u));
      const h2h = !!(occ && isH2H(u, occ));
      if (occ && h2h) {
        if (atkStr(u) <= atkStr(occ)) {
          state.set(u.loc, "bounce");
          progress = true;
        } else if (unique(u)) {
          state.set(u.loc, "moved");
          progress = true;
        }
        continue;
      }
      if (occ && occ.loc !== u.loc) {
        const st = state.get(occ.loc)!;
        if (occ.power === orderOf.get(u.loc)!.power && st !== "moved") {
          if (st !== "pending") {
            state.set(u.loc, "bounce");
            progress = true;
          }
          continue;
        }
        if (st === "moved") {
          if (unique(u)) {
            state.set(u.loc, "moved");
            progress = true;
          }
          continue;
        }
        if (st === "stay" || st === "bounce") {
          if (atkStr(u) <= holdStr(occ)) {
            state.set(u.loc, "bounce");
            progress = true;
          } else if (unique(u)) {
            state.set(u.loc, "moved");
            progress = true;
          }
          continue;
        }
        continue;
      }
      if (unique(u)) {
        state.set(u.loc, "moved");
        progress = true;
      }
    }
  }

  const pending = units.filter((u) => state.get(u.loc) === "pending");
  if (pending.length) {
    const cycle = pending.every((u) => {
      if (!unique(u)) return false;
      const occ = unitAt(destProv(u));
      if (!occ) return true;
      if (state.get(occ.loc) !== "pending") return false;
      if (isH2H(u, occ)) return false;
      return true;
    });
    for (const u of pending) state.set(u.loc, cycle ? "moved" : "bounce");
  }

  const report: string[] = [];
  const dislodged: AdjResult["dislodged"] = [];
  const next: Unit[] = [];
  const entered = new Map<string, Unit>();
  for (const u of units) {
    const o = orderOf.get(u.loc)!;
    const st = state.get(u.loc)!;
    if (st === "moved" && o.action === "move") {
      const loc = o.via === "convoy" ? provOf(o.to) : o.to;
      const moved = { ...u, loc: fleetLoc(u, loc) };
      next.push(moved);
      entered.set(provOf(loc), u);
      report.push(`${u.power} ${u.type} ${u.loc.toUpperCase()} → ${moved.loc.toUpperCase()}`);
    }
  }
  for (const u of units) {
    if (state.get(u.loc) === "moved") continue;
    const attacker = [...entered.entries()].find(([prov]) => prov === provOf(u.loc));
    if (attacker) {
      dislodged.push({ unit: u, from: u.loc, ban: provOf(attacker[1].loc) });
      report.push(`${u.power} ${u.type} ${u.loc.toUpperCase()} dislodged`);
    } else {
      next.push(u);
      const o = orderOf.get(u.loc)!;
      if (o.action === "move") report.push(`${u.power} ${u.type} ${u.loc.toUpperCase()} bounce`);
      else if (o.action === "support" && cuts.has(u.loc)) report.push(`${u.power} ${u.type} ${u.loc.toUpperCase()} support cut`);
    }
  }
  const standoffs = new Set<string>();
  for (const u of units) {
    if (state.get(u.loc) !== "bounce") continue;
    const dest = destProv(u);
    if (!next.some((n) => provOf(n.loc) === dest) && !dislodged.some((d) => provOf(d.unit.loc) === dest)) standoffs.add(dest);
  }
  return { units: next, dislodged, standoffs: [...standoffs], report };
}

function fleetLoc(u: Unit, to: string) {
  if (u.type === "A") return provOf(to);
  if (to.includes("/")) return to;
  if (SPLIT.has(to)) return to;
  return to;
}

function coastForSupport(from: string, toProv: string) {
  if (!SPLIT.has(toProv)) return toProv;
  const options = (FLEET[from] ?? []).filter((n) => provOf(n) === toProv);
  return options[0] ?? toProv;
}

export function mustChooseCoast(type: UnitType, from: string, to: string) {
  if (type !== "F") return false;
  if (!SPLIT.has(provOf(to))) return false;
  if (to.includes("/")) return false;
  const options = (FLEET[from] ?? []).filter((n) => provOf(n) === provOf(to));
  return options.length > 1;
}

export function coastChoices(from: string, toProv: string) {
  return (FLEET[from] ?? []).filter((n) => provOf(n) === toProv);
}

export function holdOrders(units: Unit[]): Order[] {
  return units.map((u) => ({ power: u.power, type: u.type, loc: u.loc, action: "hold" as const }));
}
