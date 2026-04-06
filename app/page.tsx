import { Suspense } from "react";
import { StumpdSeoSection } from "./components/stumpd-seo-section";
import Game from "./stumpd/stumpd-game";

function GameSkeleton() {
  return (
    <div className="game-page__content">
      <div className="game-skeleton">
        <div className="game-skeleton__logo" />
        <div className="game-skeleton__subtitle" />
        <div className="game-skeleton__grid">
          {Array.from({ length: 6 }).map((_, r) => (
            <div key={r} className="game-skeleton__row">
              {Array.from({ length: 5 }).map((_, c) => (
                <div key={c} className="game-skeleton__tile" />
              ))}
            </div>
          ))}
        </div>
        <div className="game-skeleton__keyboard">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="game-skeleton__kb-row" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="game-page">
      <Suspense fallback={<GameSkeleton />}>
        <Game />
      </Suspense>
      <StumpdSeoSection />
    </main>
  );
}
