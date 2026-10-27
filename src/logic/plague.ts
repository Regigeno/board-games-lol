export type Climate = "neutral" | "hot" | "cold";
export type Continent = "North America" | "South America" | "Europe" | "Africa" | "Asia" | "Oceania";

export type CountryDef = {
  id: string;
  name: string;
  continent: Continent;
  cities: Climate[];
  airport: boolean;
  seaport: boolean;
  start?: boolean;
};

export type TraitDef = {
  id: string;
  name: string;
  cost: number;
  infect: number;
  lethal: number;
  heat?: boolean;
  cold?: boolean;
  air?: boolean;
  water?: boolean;
};

const C = (
  id: string,
  name: string,
  continent: Continent,
  cities: Climate[],
  airport: boolean,
  seaport: boolean,
  start = false,
): CountryDef => ({ id, name, continent, cities, airport, seaport, start });

export const COUNTRIES: CountryDef[] = [
  C("can", "Canada", "North America", ["cold", "neutral"], true, true, true),
  C("usa", "United States", "North America", ["neutral", "neutral", "hot"], true, true),
  C("mex", "Mexico", "North America", ["hot", "neutral"], true, true),
  C("cub", "Cuba", "North America", ["hot", "neutral"], true, true),
  C("grn", "Greenland", "North America", ["cold", "cold"], false, true),
  C("gua", "Guatemala", "North America", ["hot", "hot"], true, true),
  C("bra", "Brazil", "South America", ["hot", "neutral", "hot"], true, true, true),
  C("arg", "Argentina", "South America", ["neutral", "cold"], true, true),
  C("per", "Peru", "South America", ["hot", "neutral"], true, true),
  C("col", "Colombia", "South America", ["hot", "hot"], true, true),
  C("chi", "Chile", "South America", ["neutral", "cold"], true, true),
  C("bol", "Bolivia", "South America", ["hot", "neutral"], true, false),
  C("uk", "United Kingdom", "Europe", ["neutral", "neutral"], true, true, true),
  C("fra", "France", "Europe", ["neutral", "neutral"], true, true),
  C("deu", "Germany", "Europe", ["neutral", "cold"], true, true),
  C("esp", "Spain", "Europe", ["hot", "neutral"], true, true),
  C("ita", "Italy", "Europe", ["neutral", "hot"], true, true),
  C("swe", "Sweden", "Europe", ["cold", "cold"], true, true),
  C("pol", "Poland", "Europe", ["cold", "neutral"], true, false),
  C("egy", "Egypt", "Africa", ["hot", "hot", "neutral"], true, true, true),
  C("zaf", "South Africa", "Africa", ["neutral", "hot"], true, true),
  C("nga", "Nigeria", "Africa", ["hot", "hot"], true, true),
  C("mar", "Morocco", "Africa", ["hot", "neutral"], true, true),
  C("ken", "Kenya", "Africa", ["hot", "neutral"], true, true),
  C("eth", "Ethiopia", "Africa", ["hot", "hot"], true, false),
  C("chn", "China", "Asia", ["neutral", "cold", "hot"], true, true),
  C("ind", "India", "Asia", ["hot", "hot", "neutral"], true, true, true),
  C("jpn", "Japan", "Asia", ["neutral", "cold"], true, true),
  C("rus", "Russia", "Asia", ["cold", "cold", "neutral"], true, true),
  C("idn", "Indonesia", "Asia", ["hot", "hot"], true, true),
  C("sau", "Saudi Arabia", "Asia", ["hot", "hot"], true, true),
  C("tha", "Thailand", "Asia", ["hot", "neutral"], true, true),
  C("aus", "Australia", "Oceania", ["hot", "neutral"], true, true, true),
  C("nzl", "New Zealand", "Oceania", ["neutral", "cold"], true, true),
  C("png", "Papua New Guinea", "Oceania", ["hot", "hot"], true, true),
  C("fij", "Fiji", "Oceania", ["hot", "neutral"], true, true),
  C("mad", "Madagascar", "Africa", ["hot", "neutral"], true, true),
  C("kor", "Korea", "Asia", ["cold", "neutral"], true, true),
  C("tur", "Turkey", "Europe", ["neutral", "hot"], true, true),
  C("nor", "Norway", "Europe", ["cold", "neutral"], true, true),
  C("irl", "Ireland", "Europe", ["neutral", "neutral"], true, true),
  C("vie", "Vietnam", "Asia", ["hot", "hot"], true, true),
];

export const CONTINENTS: Continent[] = ["North America", "South America", "Europe", "Africa", "Asia", "Oceania"];
export const ZONE = 7;

let traitSeq = 1;
function trait(name: string, cost: number, extra: Partial<TraitDef>): TraitDef {
  return { id: `t${traitSeq++}`, name, cost, infect: 0, lethal: 0, ...extra };
}

export function traitDeck(): TraitDef[] {
  const one = (name: string, extra: Partial<TraitDef>, n = 2) => Array.from({ length: n }, () => trait(name, 1, extra));
  return [
    ...one("Cough", { infect: 1 }, 4),
    ...one("Fever", { lethal: 1 }, 3),
    ...one("Sweats", { heat: true }, 3),
    ...one("Chills", { cold: true }, 3),
    ...one("Sneezing", { air: true }, 3),
    ...one("Nausea", { water: true }, 3),
    ...Array.from({ length: 3 }, () => trait("Rash", 2, { infect: 1, lethal: 1 })),
    ...Array.from({ length: 2 }, () => trait("Pneumonia", 2, { cold: true, lethal: 1 })),
    ...Array.from({ length: 2 }, () => trait("Insects", 2, { heat: true, infect: 1 })),
    ...Array.from({ length: 2 }, () => trait("Livestock", 2, { water: true, infect: 1 })),
    ...Array.from({ length: 2 }, () => trait("Birds", 2, { air: true, infect: 1 })),
    ...Array.from({ length: 2 }, () => trait("Abscess", 3, { lethal: 2 })),
    ...Array.from({ length: 2 }, () => trait("Organ Failure", 3, { lethal: 1, infect: 1 })),
    trait("Hemorrhage", 4, { lethal: 2, infect: 1 }),
    trait("Spores", 3, { air: true, water: true }),
  ];
}

export type EventId = "aid" | "bomb" | "olympics" | "draw" | "cold" | "heat" | "evac" | "dna";
export type EventCard = { id: string; kind: EventId; name: string; text: string };

export function eventDeck(): EventCard[] {
  const items: Omit<EventCard, "id">[] = [
    { kind: "aid", name: "Aid shipment", text: "Gain 2 DNA." },
    { kind: "bomb", name: "City bombing", text: "Remove up to 2 rival tokens from one country." },
    { kind: "olympics", name: "Olympics", text: "Move one of your tokens onto any airport country." },
    { kind: "draw", name: "Mutation", text: "Draw 2 trait cards." },
    { kind: "cold", name: "Cold snap", text: "Place 1 token in a connected cold city, ignoring resistance." },
    { kind: "heat", name: "Heat wave", text: "Place 1 token in a connected hot city, ignoring resistance." },
    { kind: "evac", name: "Evacuation", text: "Return up to 3 of one rival's tokens in a country to their supply." },
    { kind: "dna", name: "Black market", text: "Gain 3 DNA." },
  ];
  const deck: EventCard[] = [];
  let n = 1;
  for (let copy = 0; copy < 3; copy++) for (const item of items) deck.push({ ...item, id: `e${n++}` });
  return deck;
}

export function describeTrait(t: TraitDef) {
  const bits = [];
  if (t.infect) bits.push(`Infectivity +${t.infect}`);
  if (t.lethal) bits.push(`Lethality +${t.lethal}`);
  if (t.heat) bits.push("Heat");
  if (t.cold) bits.push("Cold");
  if (t.air) bits.push("Airborne");
  if (t.water) bits.push("Waterborne");
  return bits.join(" · ");
}
