export type AccuracyBadge = { label: string; emoji: string };

export function getAccuracyBadge(won: boolean, guessCount: number): AccuracyBadge {
  if (!won) return { label: "Golden Duck", emoji: "🦆" };
  switch (guessCount) {
    case 1: return { label: "Century Club", emoji: "💯" };
    case 2: return { label: "Half-Century", emoji: "🏏" };
    case 3: return { label: "Kohli Cover Drive", emoji: "👑" };
    case 4: return { label: "Rohit Pull Shot", emoji: "🎆" };
    default: return { label: "The Dhoni Finish", emoji: "🚁" };
  }
}

export function getGodmodeBadge(guessCount: number): AccuracyBadge {
  switch (guessCount) {
    case 1: return { label: "Impossible Read", emoji: "🔱" };
    case 2: return { label: "No-Hints Masterclass", emoji: "🔱" };
    case 3: return { label: "Godmode Hero", emoji: "💪" };
    case 4: return { label: "Gritty Chase", emoji: "🔥" };
    default: return { label: "Survival Specialist", emoji: "🛡️" };
  }
}
