import { fetchPlayers, fetchPlayerCount } from "../services/ipl-api";

export type IplPlayerRow = {
  name: string;
  meta: { shortened: boolean; fullName: string };
};

const LS_PLAYER_COUNT_KEY = "stumpd-ipl-puzzle-count";
const LS_PLAYER_CACHE_KEY = "stumpd-ipl-players-cache";

function readCachedPlayers(): IplPlayerRow[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_PLAYER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IplPlayerRow[];
  } catch {
    return null;
  }
}

function cachePlayers(players: IplPlayerRow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PLAYER_CACHE_KEY, JSON.stringify(players));
  } catch { /* quota / private mode */ }
}

async function fetchWithRetry(
  fn: () => Promise<Response>,
  retries = 3,
  delayMs = 1000,
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fn();
      if (res.ok) return res;
    } catch {
      if (attempt === retries - 1) throw new Error("Network request failed after retries");
    }
    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw new Error("Network request failed after retries");
}

/**
 * Returns the locally cached player list immediately (if available),
 * then fetches from the API only when the count has changed.
 * The full list is stored in localStorage so subsequent visits
 * don't need to re-download 261 kB over slow connections.
 * Retries transient network failures up to 3 times.
 */
export async function fetchIplPlayersFromAPI(): Promise<IplPlayerRow[] | null> {
  const cached = readCachedPlayers();

  let apiCount: number;
  try {
    apiCount = await fetchPlayerCount();
  } catch {
    return cached;
  }

  let storedCount: number | null = null;
  try {
    const raw = localStorage.getItem(LS_PLAYER_COUNT_KEY);
    if (raw != null) storedCount = parseInt(raw, 10);
  } catch { /* SSR / private mode */ }

  if (storedCount === apiCount && cached) return cached;

  let res: Response;
  try {
    res = await fetchWithRetry(() => fetchPlayers());
  } catch {
    return cached;
  }

  const json = await res.json();
  const rows: unknown[] = json.data ?? [];

  const players = rows.map((r: any) => ({
    name: r.name,
    meta: {
      shortened: Boolean(r.is_shortened),
      fullName: r.full_name,
    },
  }));

  try {
    localStorage.setItem(LS_PLAYER_COUNT_KEY, String(apiCount));
  } catch { /* quota / private mode */ }
  cachePlayers(players);

  return players;
}

let fallbackPromise: Promise<IplPlayerRow[]> | null = null;

/** Lazy-load the static fallback list from /public (only fetched once, cached in memory). */
async function loadFallbackPlayers(): Promise<IplPlayerRow[]> {
  if (!fallbackPromise) {
    fallbackPromise = fetch("/ipl-players-fallback.json")
      .then((r) => r.json())
      .catch(() => []);
  }
  return fallbackPromise;
}

/**
 * Synchronously returns the best available player list:
 * localStorage cache (from a previous API fetch) first, otherwise empty.
 * The static fallback JSON is loaded lazily via loadFallbackPlayers().
 */
export function getInitialPlayerList(): IplPlayerRow[] {
  return readCachedPlayers() ?? [];
}

export { loadFallbackPlayers };
