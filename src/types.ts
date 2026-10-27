export type Player = {
  id: number;
  name: string;
  color: string;
};

export type GameProps = {
  players: Player[];
  onExit: () => void;
};

export type GameId =
  | "chess"
  | "checkers"
  | "backgammon"
  | "monopoly"
  | "blackjack"
  | "uno"
  | "plague"
  | "clue"
  | "shithead"
  | "solitaire"
  | "catan"
  | "sorry"
  | "chutes"
  | "life"
  | "diplomacy";

export type GameMeta = {
  id: GameId;
  title: string;
  players: string;
  min: number;
  max: number;
  secret: boolean;
  blurb: string;
  accent: string;
  ink: string;
  rules: string[];
};

export const PALETTE = [
  "#d64545",
  "#2f6fed",
  "#e2a325",
  "#1f9d62",
  "#8d4fd6",
  "#e07a32",
  "#1497a6",
  "#d35d8a",
];

export const GAMES: GameMeta[] = [
  {
    id: "chess",
    title: "Chess",
    players: "2",
    min: 2,
    max: 2,
    secret: false,
    blurb: "Full laws, including castling, en passant, and promotion.",
    accent: "#f2efe6",
    ink: "#1a1814",
    rules: [
      "White moves first. Click a piece, then a highlighted square.",
      "Castling, en passant, and underpromotion are all in.",
      "The game ends at checkmate, stalemate, fifty moves without a capture or pawn move, threefold repetition, or insufficient material.",
    ],
  },
  {
    id: "checkers",
    title: "Checkers",
    players: "2",
    min: 2,
    max: 2,
    secret: false,
    blurb: "American checkers. Jumps are mandatory. Kings move one square.",
    accent: "#c4493a",
    ink: "#fff7ef",
    rules: [
      "Red moves first, on the dark squares, toward Black.",
      "A capture is mandatory. If several jumps exist, the player chooses, then continues with the same piece.",
      "A man that reaches the back rank becomes a king and stops for the turn. Kings are not flying kings.",
      "You win by capturing every opposing piece or leaving the opponent with no legal move.",
    ],
  },
  {
    id: "backgammon",
    title: "Backgammon",
    players: "2",
    min: 2,
    max: 2,
    secret: false,
    blurb: "Hits, the bar, bearing off, and a doubling cube.",
    accent: "#8c3d2f",
    ink: "#fff6ea",
    rules: [
      "White moves toward the lower numbers, Black toward the higher numbers.",
      "Checkers on the bar must enter before anything else. A blot is sent to the bar.",
      "You must use as many dice as possible, and the larger die when only one can be played.",
      "Bear off only when every checker is in your home board. An exact pip bears off; a higher die works when no checker sits on a higher point.",
      "Either player may offer the cube before rolling. Refusal concedes the current stake. A gammon pays double and a backgammon triple, before the cube.",
    ],
  },
  {
    id: "monopoly",
    title: "Monopoly",
    players: "2–6",
    min: 2,
    max: 6,
    secret: false,
    blurb: "The classic circuit: rents, houses, jail, trades, and auctions.",
    accent: "#d8efe0",
    ink: "#163226",
    rules: [
      "Each player starts with $1,500. Roll, move, and resolve the space.",
      "If you decline a purchase, the property is auctioned. Bidding starts at $1 and passes around the table.",
      "A color set with no buildings collects double the printed rent. Houses must be built and sold evenly. Mortgaged deeds collect no rent.",
      "Three doubles in one turn sends you to jail. Escape by rolling doubles, paying $50, or using a release card. After three failed turns you pay and leave.",
      "Trades can include cash, deeds, and release cards. Buildings stay on the board until sold back at half price.",
      "If you cannot cover a debt after selling buildings and mortgaging, you are bankrupt. Debts to a player hand them your remaining assets.",
    ],
  },
  {
    id: "blackjack",
    title: "Blackjack",
    players: "1–4",
    min: 1,
    max: 4,
    secret: false,
    blurb: "Against the dealer. The hole card stays down until the table stands.",
    accent: "#1b6b45",
    ink: "#f3fff6",
    rules: [
      "Blackjack pays 3 to 2. Dealer stands on every 17, including soft 17.",
      "You may double on any two-card hand, and split once. Split aces receive one card each and cannot be hit again.",
      "Insurance is offered when the dealer shows an ace.",
      "Hands are face up, the way a casino table plays, so the screen does not lock between seats. The dealer’s hole card is the only hidden card.",
    ],
  },
  {
    id: "uno",
    title: "UNO!",
    players: "2–6",
    min: 2,
    max: 6,
    secret: true,
    blurb: "Match color or rank. Call UNO on the way to one card.",
    accent: "#e23b3b",
    ink: "#fff6f4",
    rules: [
      "Play a card that matches the discard’s color or rank. Wilds go on anything.",
      "A Wild Draw Four can be played only when you have no card of the current color.",
      "Draw cards are not stacked. Skip, reverse, and draw-two behave in the usual way. With two players, reverse acts as skip.",
      "With two cards left, press Call UNO before you play. The next player can catch a missed call and make you draw two.",
      "Hands are private. The table locks until the player whose turn it is confirms.",
    ],
  },
  {
    id: "plague",
    title: "Plague Inc: The Board Game",
    players: "2–4",
    min: 2,
    max: 4,
    secret: true,
    blurb: "Spread, evolve, and outscore the other diseases.",
    accent: "#6ea15a",
    ink: "#10210d",
    rules: [
      "Each plague has 16 tokens and a private hand of trait cards. The turn is DNA, Country, Evolution, Infection, then Death.",
      "DNA: score 1 for every country you control (most tokens, ties included), plus 1 if Bonus DNA is still uncovered.",
      "Country: take a face-up country or the top of the deck. Place it in its continent, or discard it to dump your traits and draw five new ones.",
      "Evolution: pay the DNA cost to play one trait onto an empty slot. Covering Bonus DNA or Outbreak hides that ability. You may devolve for free.",
      "Infection: place tokens equal to your infectivity. A city must match your climate resistance and be connected by continent, seaport, or airport.",
      "Death: if you control a full country, roll the death die. Equal or under your lethality kills it. Everyone scores 1 DNA per token they had there and draws an event if they hold fewer than three.",
      "When the country deck runs out, sudden death begins: you may try to kill any full country you have tokens in. The game ends after a turn in which any plague has no tokens left.",
      "Final score adds back the cost of traits still on your slide, plus bonuses for tokens left, continents cleared, and the largest country killed.",
    ],
  },
  {
    id: "clue",
    title: "Clue",
    players: "3–6",
    min: 3,
    max: 6,
    secret: true,
    blurb: "One suspect, one weapon, one room. Everyone else holds the rest.",
    accent: "#f0d48a",
    ink: "#2a2112",
    rules: [
      "Roll one die and move through hallways. Occupied squares cannot be passed. Doorways drop you into the room.",
      "Secret passages between the Study and Kitchen, and the Lounge and Conservatory, replace your move.",
      "In a room you may suggest that room, any suspect, and any weapon. Those tokens are brought in. Each player clockwise either cannot disprove or privately shows you one matching card.",
      "An accusation names all three. A wrong accusation removes you from moving; you still show cards. A right one wins.",
      "Hands and the card being shown stay behind the confirm screen.",
    ],
  },
  {
    id: "shithead",
    title: "Shithead",
    players: "2–5",
    min: 2,
    max: 5,
    secret: true,
    blurb: "Three down, three up, three in hand. Do not be last.",
    accent: "#3e2a22",
    ink: "#f6efe6",
    rules: [
      "Deal nine cards: three face down, three face up, three in hand. Draw back to three while the deck lasts.",
      "Play equal or higher than the top of the pile. Twos reset the pile. Tens burn it, and so do four of a kind on top. You play again after a burn.",
      "You may lay several cards of the same rank. If you cannot play, pick up the pile.",
      "After the hand and deck are gone, play the face-up cards, then the face-down cards blind. An illegal blind card is picked up with the pile.",
      "First player with nothing left is out. Last player holding cards is the shithead.",
    ],
  },
  {
    id: "solitaire",
    title: "Solitaire",
    players: "1",
    min: 1,
    max: 1,
    secret: false,
    blurb: "Klondike. Draw one or three, build down, finish on aces.",
    accent: "#2a6b4a",
    ink: "#f4fff8",
    rules: [
      "Build the tableau down in alternating colors. Only a king fills an empty column.",
      "Foundations start with aces and climb in suit to kings.",
      "Click the stock to turn cards. An empty stock recycles the waste.",
      "Click a card to pick it up, then click where it should land. Double-click sends a card to a foundation when it fits.",
    ],
  },
  {
    id: "catan",
    title: "Catan",
    players: "3–4",
    min: 3,
    max: 4,
    secret: true,
    blurb: "Settlements, roads, the robber, and a race to ten.",
    accent: "#e6b15a",
    ink: "#2a2013",
    rules: [
      "Place two settlements and two roads, draft order then reverse. The second settlement pays its starting resources.",
      "Roll before you trade or build. A seven makes anyone over seven cards discard half, then you move the robber and steal one random card.",
      "Trade with the bank at 4:1, or better at your ports. Domestic offers are answered in private by the other player.",
      "Development cards stay hidden. You cannot play a card the turn you buy it, except that victory-point cards simply count.",
      "Longest road (5+) and largest army (3+) are worth two each. You win on your turn at ten points.",
    ],
  },
  {
    id: "sorry",
    title: "Sorry!",
    players: "2–4",
    min: 2,
    max: 4,
    secret: false,
    blurb: "Draw a card, ride the slides, and bump anyone in the way.",
    accent: "#f0c419",
    ink: "#2b2410",
    rules: [
      "Pawns leave Start on a 1, a 2, or a Sorry card. A 2 from the track also draws again.",
      "A 4 moves backward. A 10 is ten ahead or one back. A 7 may be split. An 11 moves eleven or swaps with an opponent who is not safe.",
      "Landing on an opponent sends them back to Start. Forward moves onto another color’s slide carry you to the end and clear the slide.",
      "The safety zone needs an exact count. First player to get all four pawns home wins.",
    ],
  },
  {
    id: "chutes",
    title: "Chutes & Ladders",
    players: "2–4",
    min: 2,
    max: 4,
    secret: false,
    blurb: "Spin, climb, and try not to ride a chute back down.",
    accent: "#5b8def",
    ink: "#f4f7ff",
    rules: [
      "Spin 1 through 6 and move that many squares.",
      "A ladder carries you up. A chute slides you down. Chains resolve immediately.",
      "You need an exact spin to land on 100. First there wins.",
    ],
  },
  {
    id: "life",
    title: "The Game of Life",
    players: "2–4",
    min: 2,
    max: 4,
    secret: false,
    blurb: "College or a job, a family, and a pile of cash at retirement.",
    accent: "#f2a3c2",
    ink: "#2c1420",
    rules: [
      "Start in college (a loan, then a higher salary) or go straight to work.",
      "Spin 1 through 10. Payday adds your salary. Stop for marriage, children, houses, and life cards when you land on them.",
      "At retirement your score is cash, plus $100,000 for each child, plus the value of houses you still own.",
      "Everyone finishes the path. The richest retirement wins.",
    ],
  },
  {
    id: "diplomacy",
    title: "Diplomacy",
    players: "2–7",
    min: 2,
    max: 7,
    secret: true,
    blurb: "Orders are written in private, then resolved together.",
    accent: "#d7d3c8",
    ink: "#1b1a17",
    rules: [
      "Each player takes a power. Powers left out of the game have empty home centers.",
      "Spring and Fall: every power confirms, enters orders, and locks them. The table then sees every order at once.",
      "Armies move on land. Fleets move along coasts. Support adds strength. A convoy carries an army across the sea.",
      "A bounce leaves both units in place. A dislodged unit retreats or disbands. You cannot dislodge your own unit.",
      "Support is cut by any attack from outside the province being supported into.",
      "After Fall retreats, adjust supply centers. Build in empty home centers you still own, or disband down to your count.",
      "Eighteen centers wins.",
    ],
  },
];
