export const OPEN_LEADERBOARD_EVENT = "stumpd-open-leaderboard";

export function dispatchOpenLeaderboard() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_LEADERBOARD_EVENT));
}
