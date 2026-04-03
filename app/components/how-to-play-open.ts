export const OPEN_HOW_TO_PLAY_EVENT = "fifa-wordle-open-how-to-play";

export function dispatchOpenHowToPlay() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_HOW_TO_PLAY_EVENT));
}
