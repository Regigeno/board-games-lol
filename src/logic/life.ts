export type LifeKind = "payday" | "baby" | "marriage" | "house" | "tax" | "career" | "lawsuit" | "life" | "stop" | "plain";

export type LifeSpace = { kind: LifeKind; label: string };

export const LIFE_TRACK: LifeSpace[] = [
  { kind: "plain", label: "First job" },
  { kind: "payday", label: "Payday" },
  { kind: "life", label: "Life" },
  { kind: "plain", label: "Night school" },
  { kind: "baby", label: "Baby" },
  { kind: "payday", label: "Payday" },
  { kind: "house", label: "House" },
  { kind: "tax", label: "Taxes" },
  { kind: "marriage", label: "Wedding" },
  { kind: "life", label: "Life" },
  { kind: "payday", label: "Payday" },
  { kind: "career", label: "New job" },
  { kind: "plain", label: "Vacation" },
  { kind: "baby", label: "Baby" },
  { kind: "lawsuit", label: "Lawsuit" },
  { kind: "payday", label: "Payday" },
  { kind: "life", label: "Life" },
  { kind: "house", label: "Bigger house" },
  { kind: "plain", label: "Family reunion" },
  { kind: "tax", label: "Taxes" },
  { kind: "payday", label: "Payday" },
  { kind: "baby", label: "Twins?" },
  { kind: "career", label: "Promotion" },
  { kind: "life", label: "Life" },
  { kind: "plain", label: "Sabbatical" },
  { kind: "payday", label: "Payday" },
  { kind: "lawsuit", label: "Fender bender" },
  { kind: "house", label: "Summer cabin" },
  { kind: "baby", label: "Baby" },
  { kind: "life", label: "Life" },
  { kind: "payday", label: "Payday" },
  { kind: "tax", label: "Taxes" },
  { kind: "plain", label: "Empty nest" },
  { kind: "career", label: "Last raise" },
  { kind: "payday", label: "Payday" },
  { kind: "stop", label: "Retirement" },
];

export const LIFE_CARDS = [
  { text: "A relative remembers you in a will.", money: 50000 },
  { text: "The car needs a new transmission.", money: -20000 },
  { text: "A stock you forgot you owned pays out.", money: 40000 },
  { text: "Medical bill.", money: -30000 },
  { text: "You teach a night class.", money: 15000 },
  { text: "The roof leaks.", money: -25000 },
  { text: "Garage-sale gold. Someone pays for your old records.", money: 10000 },
  { text: "You host the whole family.", money: -15000 },
  { text: "Bonus for a project that actually shipped.", money: 35000 },
  { text: "Parking tickets finally catch up.", money: -5000 },
];

export const HOUSES = [
  { name: "Starter bungalow", cost: 80000, value: 100000 },
  { name: "Two-story on a corner", cost: 140000, value: 180000 },
  { name: "Cabin with a dock", cost: 100000, value: 120000 },
];

export function retireScore(cash: number, kids: number, houses: { value: number }[]) {
  return cash + kids * 100000 + houses.reduce((s, h) => s + h.value, 0);
}
