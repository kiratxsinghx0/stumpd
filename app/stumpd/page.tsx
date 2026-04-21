import { Suspense } from "react";
import Game from "./stumpd-game";

export default function StumpdPage() {
  return (
    <main className="game-page">
      <Suspense>
        <Game />
      </Suspense>
    </main>
  );
}
