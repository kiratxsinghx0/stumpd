import { isLoggedIn, postGodmodeActivation } from "../services/auth-api";

const LS_GODMODE_TS = "stumpdpuzzle_hmChampionTs";
const GODMODE_DURATION_MS = 24 * 60 * 60 * 1000;

/** Fast synchronous check using localStorage cache. */
export function isGodmodeActive(): boolean {
  if (typeof window === "undefined") return false;
  if (!isLoggedIn()) return false;
  try {
    const ts = localStorage.getItem(LS_GODMODE_TS);
    if (!ts) return false;
    return Date.now() - Number(ts) < GODMODE_DURATION_MS;
  } catch {
    return false;
  }
}

/** Ask the server to activate godmode. Only writes localStorage on server confirmation. */
export async function activateGodmode(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const result = await postGodmodeActivation();
  return result.success;
}

export function getGodmodeHoursRemaining(): number {
  if (typeof window === "undefined") return 0;
  try {
    const ts = Number(localStorage.getItem(LS_GODMODE_TS) ?? 0);
    const remaining = GODMODE_DURATION_MS - (Date.now() - ts);
    return Math.max(0, Math.ceil(remaining / (60 * 60 * 1000)));
  } catch {
    return 0;
  }
}
