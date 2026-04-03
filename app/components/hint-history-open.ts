export const OPEN_HINT_HISTORY_EVENT = "fifa-wordle-open-hint-history";
export const HINT_COUNT_UPDATE_EVENT = "fifa-wordle-hint-count-update";

export function dispatchOpenHintHistory() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_HINT_HISTORY_EVENT));
}

export function dispatchHintCountUpdate(count: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HINT_COUNT_UPDATE_EVENT, { detail: count }));
}

