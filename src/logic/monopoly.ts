export type Group =
  | "brown"
  | "light"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "blue"
  | "rr"
  | "util";

export type Space =
  | { i: number; kind: "go" | "jail" | "parking" | "goto" | "tax" | "chance" | "chest"; name: string; tax?: number }
  | {
      i: number;
      kind: "prop";
      name: string;
      group: Group;
      price: number;
      rent: number[];
      house: number;
      mortgage: number;
    };

const prop = (
  i: number,
  name: string,
  group: Group,
  price: number,
  rent: number[],
  house: number,
): Space => ({
  i,
  kind: "prop",
  name,
  group,
  price,
  rent,
  house,
  mortgage: price / 2,
});

export const BOARD: Space[] = [
  { i: 0, kind: "go", name: "Go" },
  prop(1, "Mediterranean Avenue", "brown", 60, [2, 10, 30, 90, 160, 250], 50),
  { i: 2, kind: "chest", name: "Community Chest" },
  prop(3, "Baltic Avenue", "brown", 60, [4, 20, 60, 180, 320, 450], 50),
  { i: 4, kind: "tax", name: "Income Tax", tax: 200 },
  prop(5, "Reading Railroad", "rr", 200, [25, 50, 100, 200], 0),
  prop(6, "Oriental Avenue", "light", 100, [6, 30, 90, 270, 400, 550], 50),
  { i: 7, kind: "chance", name: "Chance" },
  prop(8, "Vermont Avenue", "light", 100, [6, 30, 90, 270, 400, 550], 50),
  prop(9, "Connecticut Avenue", "light", 120, [8, 40, 100, 300, 450, 600], 50),
  { i: 10, kind: "jail", name: "Jail" },
  prop(11, "St. Charles Place", "pink", 140, [10, 50, 150, 450, 625, 750], 100),
  prop(12, "Electric Company", "util", 150, [0], 0),
  prop(13, "States Avenue", "pink", 140, [10, 50, 150, 450, 625, 750], 100),
  prop(14, "Virginia Avenue", "pink", 160, [12, 60, 180, 500, 700, 900], 100),
  prop(15, "Pennsylvania Railroad", "rr", 200, [25, 50, 100, 200], 0),
  prop(16, "St. James Place", "orange", 180, [14, 70, 200, 550, 750, 950], 100),
  { i: 17, kind: "chest", name: "Community Chest" },
  prop(18, "Tennessee Avenue", "orange", 180, [14, 70, 200, 550, 750, 950], 100),
  prop(19, "New York Avenue", "orange", 200, [16, 80, 220, 600, 800, 1000], 100),
  { i: 20, kind: "parking", name: "Free Parking" },
  prop(21, "Kentucky Avenue", "red", 220, [18, 90, 250, 700, 875, 1050], 150),
  { i: 22, kind: "chance", name: "Chance" },
  prop(23, "Indiana Avenue", "red", 220, [18, 90, 250, 700, 875, 1050], 150),
  prop(24, "Illinois Avenue", "red", 240, [20, 100, 300, 750, 925, 1100], 150),
  prop(25, "B. & O. Railroad", "rr", 200, [25, 50, 100, 200], 0),
  prop(26, "Atlantic Avenue", "yellow", 260, [22, 110, 330, 800, 975, 1150], 150),
  prop(27, "Ventnor Avenue", "yellow", 260, [22, 110, 330, 800, 975, 1150], 150),
  prop(28, "Water Works", "util", 150, [0], 0),
  prop(29, "Marvin Gardens", "yellow", 280, [24, 120, 360, 850, 1025, 1200], 150),
  { i: 30, kind: "goto", name: "Go to Jail" },
  prop(31, "Pacific Avenue", "green", 300, [26, 130, 390, 900, 1100, 1275], 200),
  prop(32, "North Carolina Avenue", "green", 300, [26, 130, 390, 900, 1100, 1275], 200),
  { i: 33, kind: "chest", name: "Community Chest" },
  prop(34, "Pennsylvania Avenue", "green", 320, [28, 150, 450, 1000, 1200, 1400], 200),
  prop(35, "Short Line", "rr", 200, [25, 50, 100, 200], 0),
  { i: 36, kind: "chance", name: "Chance" },
  prop(37, "Park Place", "blue", 350, [35, 175, 500, 1100, 1300, 1500], 200),
  { i: 38, kind: "tax", name: "Luxury Tax", tax: 100 },
  prop(39, "Boardwalk", "blue", 400, [50, 200, 600, 1400, 1700, 2000], 200),
];

export const GROUP_COLOR: Record<Group, string> = {
  brown: "#8b5a3c",
  light: "#aae0f2",
  pink: "#d95aa6",
  orange: "#f7941d",
  red: "#ed1c24",
  yellow: "#fff200",
  green: "#1fb25a",
  blue: "#0072bc",
  rr: "#444",
  util: "#d0d0d0",
};

export const GROUP_SIZE: Record<string, number> = {
  brown: 2,
  light: 3,
  pink: 3,
  orange: 3,
  red: 3,
  yellow: 3,
  green: 3,
  blue: 2,
  rr: 4,
  util: 2,
};

export type Deed = { owner: number | null; houses: number; mortgaged: boolean };

export function rentFor(
  space: Extract<Space, { kind: "prop" }>,
  deed: Deed,
  deeds: Deed[],
  dice: number,
  doubleRr = false,
) {
  if (deed.owner === null || deed.mortgaged) return 0;
  if (space.group === "util") {
    const owned = deeds.filter((d, i) => {
      const s = BOARD[i];
      return s.kind === "prop" && s.group === "util" && d.owner === deed.owner && !d.mortgaged;
    }).length;
    return dice * (owned >= 2 ? 10 : 4);
  }
  if (space.group === "rr") {
    const owned = deeds.filter((d, i) => {
      const s = BOARD[i];
      return s.kind === "prop" && s.group === "rr" && d.owner === deed.owner && !d.mortgaged;
    }).length;
    const base = space.rent[Math.max(0, owned - 1)] ?? 25;
    return doubleRr ? base * 2 : base;
  }
  if (deed.houses > 0) return space.rent[deed.houses];
  const set = ownsSet(deed.owner, space.group, deeds);
  return set ? space.rent[0] * 2 : space.rent[0];
}

export function ownsSet(owner: number, group: Group, deeds: Deed[]) {
  const members = BOARD.filter((s): s is Extract<Space, { kind: "prop" }> => s.kind === "prop" && s.group === group);
  return members.every((s) => deeds[s.i].owner === owner && !deeds[s.i].mortgaged);
}

export type CardFx =
  | { type: "cash"; n: number; text: string }
  | { type: "move"; to: number; text: string }
  | { type: "jail"; text: string }
  | { type: "back"; n: number; text: string }
  | { type: "repair"; house: number; hotel: number; text: string }
  | { type: "each"; n: number; text: string }
  | { type: "nearest"; what: "rr" | "util"; text: string }
  | { type: "out"; text: string };

export const CHANCE: CardFx[] = [
  { type: "move", to: 0, text: "A clear stretch of road. Advance to Go and collect $200." },
  { type: "move", to: 24, text: "The fair is in town. Advance to Illinois Avenue." },
  { type: "move", to: 11, text: "You are needed on the pink row. Advance to St. Charles Place." },
  { type: "move", to: 39, text: "The boardwalk lights are on. Advance to Boardwalk." },
  { type: "move", to: 5, text: "Catch the next train. Advance to Reading Railroad." },
  { type: "nearest", what: "rr", text: "Track work ahead. Ride the next railroad and pay the owner double rent if it is owned." },
  { type: "nearest", what: "util", text: "The power flickers. Go to the next utility. If it is owned, roll and pay ten times the roll." },
  { type: "cash", n: 150, text: "A building fund you forgot about matures. Collect $150." },
  { type: "cash", n: 50, text: "A dusty dividend check arrives. Collect $50." },
  { type: "each", n: -50, text: "You chair the block party. Pay each other player $50." },
  { type: "jail", text: "A shortcut through an alley was a bad idea. Go to jail." },
  { type: "repair", house: 25, hotel: 100, text: "Street repairs are assessed. Pay $25 per house and $100 per hotel." },
  { type: "back", n: 3, text: "You missed the turn. Go back three spaces." },
  { type: "cash", n: -15, text: "Speeding fine. Pay $15." },
  { type: "out", text: "A friend on the force hands you a release. Keep this until you need it." },
  { type: "nearest", what: "rr", text: "Another platform, another train. Advance to the next railroad." },
];

export const CHEST: CardFx[] = [
  { type: "move", to: 0, text: "The bank opens the books. Advance to Go and collect $200." },
  { type: "cash", n: 200, text: "An old deposit turns up under your name. Collect $200." },
  { type: "cash", n: 100, text: "You sell a stack of unused tickets. Collect $100." },
  { type: "cash", n: 50, text: "From sale of stock. Collect $50." },
  { type: "cash", n: 25, text: "A consultancy fee. Collect $25." },
  { type: "cash", n: 20, text: "You found a bill in last year's coat. Collect $20." },
  { type: "cash", n: 10, text: "You won second prize in a pie contest. Collect $10." },
  { type: "cash", n: -50, text: "Doctor's bill. Pay $50." },
  { type: "cash", n: -50, text: "School fees. Pay $50." },
  { type: "cash", n: -100, text: "Hospital stay. Pay $100." },
  { type: "each", n: 50, text: "It is your birthday. Collect $50 from each player." },
  { type: "each", n: 10, text: "You opened a lemonade stand. Collect $10 from each player." },
  { type: "jail", text: "Go directly to jail." },
  { type: "out", text: "A get-out-of-jail card. Keep it until you need it." },
  { type: "repair", house: 40, hotel: 115, text: "You are assessed for street repairs. $40 a house, $115 a hotel." },
  { type: "cash", n: 100, text: "Life insurance matures. Collect $100." },
];

export function spacePos(i: number) {
  if (i <= 10) return { gridColumn: 11 - i, gridRow: 11 };
  if (i <= 20) return { gridColumn: 1, gridRow: 21 - i };
  if (i <= 30) return { gridColumn: i - 19, gridRow: 1 };
  return { gridColumn: 11, gridRow: i - 29 };
}
