import { StumpdSeoSection } from "../components/stumpd-seo-section";
import Game from "./stumpd-game";

export default function StumpdPage() {
  return (
    <main className="game-page">
      <Game />
      <StumpdSeoSection />
    </main>
  );
}
