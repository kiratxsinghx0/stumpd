import { StumpdSeoSection } from "./components/stumpd-seo-section";
import Game from "./stumpd/stumpd-game";

export default function Home() {
  return (
    <main className="game-page">
      <Game />
      <StumpdSeoSection />
    </main>
  );
}
