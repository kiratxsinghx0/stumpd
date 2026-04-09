export const OPEN_LEADERBOARD_EVENT = "stumpd-open-leaderboard";
export const LEADERBOARD_STATE_EVENT = "stumpd-leaderboard-state";

export function dispatchOpenLeaderboard() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_LEADERBOARD_EVENT));
}

export function dispatchLeaderboardState(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LEADERBOARD_STATE_EVENT, { detail: open }));
}
