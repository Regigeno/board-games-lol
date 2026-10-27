import { Component, type ReactNode, useState } from "react";
import { GAMES, type GameId, type Player } from "./types";
import { Setup } from "./components/ui";
import { ChessGame } from "./games/chess";
import { CheckersGame } from "./games/checkers";
import { BackgammonGame } from "./games/backgammon";
import { MonopolyGame } from "./games/monopoly";
import { BlackjackGame } from "./games/blackjack";
import { UnoGame } from "./games/uno";
import { PlagueGame } from "./games/plague";
import { ClueGame } from "./games/clue";
import { ShitheadGame } from "./games/shithead";
import { SolitaireGame } from "./games/solitaire";
import { CatanGame } from "./games/catan";
import { SorryGame } from "./games/sorry";
import { ChutesGame } from "./games/chutes";
import { LifeGame } from "./games/life";
import { DiplomacyGame } from "./games/diplomacy";

const VIEWS: Record<GameId, (props: { players: Player[]; onExit: () => void }) => ReactNode> = {
  chess: (p) => <ChessGame {...p} />,
  checkers: (p) => <CheckersGame {...p} />,
  backgammon: (p) => <BackgammonGame {...p} />,
  monopoly: (p) => <MonopolyGame {...p} />,
  blackjack: (p) => <BlackjackGame {...p} />,
  uno: (p) => <UnoGame {...p} />,
  plague: (p) => <PlagueGame {...p} />,
  clue: (p) => <ClueGame {...p} />,
  shithead: (p) => <ShitheadGame {...p} />,
  solitaire: (p) => <SolitaireGame {...p} />,
  catan: (p) => <CatanGame {...p} />,
  sorry: (p) => <SorryGame {...p} />,
  chutes: (p) => <ChutesGame {...p} />,
  life: (p) => <LifeGame {...p} />,
  diplomacy: (p) => <DiplomacyGame {...p} />,
};

export function App() {
  const [game, setGame] = useState<GameId | null>(null);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const meta = GAMES.find((g) => g.id === game) ?? null;

  if (!meta) {
    return (
      <div className="lobby">
        <header className="lobby-head">
          <div>
            <p className="eyebrow">One screen · pass it around</p>
            <h1>Parlor</h1>
            <p className="lede">
              Fifteen table games. When a hand is secret, the next seat gets a covered screen that waits for
              “It is now Player’s turn.”
            </p>
          </div>
          <dl className="lobby-facts">
            <div>
              <dt>Games</dt>
              <dd>15</dd>
            </div>
            <div>
              <dt>Online</dt>
              <dd>None</dd>
            </div>
            <div>
              <dt>Hidden hands</dt>
              <dd>Confirmed</dd>
            </div>
          </dl>
        </header>
        <div className="shelf">
          {GAMES.map((g, index) => (
            <button
              key={g.id}
              className="box"
              style={{ background: g.accent, color: g.ink }}
              onClick={() => {
                setGame(g.id);
                setPlayers(null);
              }}
            >
              <span className="box-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="box-title">{g.title}</span>
              <span className="box-meta">
                <span>{g.players}</span>
                <span>{g.secret ? "Private hands" : "Open board"}</span>
              </span>
              <span className="box-blurb">{g.blurb}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!players) {
    return (
      <Setup
        meta={meta}
        onBack={() => setGame(null)}
        onStart={(p) => setPlayers(p)}
      />
    );
  }

  return (
    <Boundary
      onExit={() => {
        setGame(null);
        setPlayers(null);
      }}
    >
      {VIEWS[meta.id]({
        players,
        onExit: () => {
          setGame(null);
          setPlayers(null);
        },
      })}
    </Boundary>
  );
}

class Boundary extends Component<{ children: ReactNode; onExit: () => void }, { error: string | null }> {
  state = { error: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="setup">
          <div className="setup-card">
            <h1>This table hit a snag</h1>
            <p className="lede">{this.state.error}</p>
            <button className="btn solid" onClick={this.props.onExit}>
              Back to the shelf
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
