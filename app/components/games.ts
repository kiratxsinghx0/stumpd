export type GameStats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
};

export type LiveStats = {
  puzzleDay: number | null;
  totalPlayed: number;
  totalWon: number;
  distribution: number[];
};
