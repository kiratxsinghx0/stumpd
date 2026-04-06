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

/**
 * Returns the locally cached player list immediately (if available),
 * then fetches from the API only when the count has changed.
 * The full list is stored in localStorage so subsequent visits
 * don't need to re-download 261 kB over slow connections.
 */
export async function fetchIplPlayersFromAPI(): Promise<IplPlayerRow[] | null> {
  const cached = readCachedPlayers();

  const apiCount = await fetchPlayerCount();

  let storedCount: number | null = null;
  try {
    const raw = localStorage.getItem(LS_PLAYER_COUNT_KEY);
    if (raw != null) storedCount = parseInt(raw, 10);
  } catch { /* SSR / private mode */ }

  if (storedCount === apiCount && cached) return cached;

  const res = await fetchPlayers();
  if (!res.ok) throw new Error(`Failed to fetch IPL players: ${res.status}`);
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

/**
 * Synchronously returns the best available player list:
 * localStorage cache (from a previous API fetch) > hardcoded fallback.
 */
export function getInitialPlayerList(): IplPlayerRow[] {
  const cached = readCachedPlayers();
  return cached ?? iplPlayers;
}

/** Minimal fallback — the full list is fetched from the API and cached in localStorage. */
export const iplPlayers: IplPlayerRow[] = [
  { "name": "MS", "meta": { "shortened": false, "fullName": "MS Dhoni" } },
  { "name": "DHONI", "meta": { "shortened": false, "fullName": "MS Dhoni" } },
  { "name": "SACHI", "meta": { "shortened": true, "fullName": "Sachin Tendulkar" } },
  { "name": "TENDU", "meta": { "shortened": true, "fullName": "Sachin Tendulkar" } },
  { "name": "SOURA", "meta": { "shortened": true, "fullName": "Sourav Ganguly" } },
  { "name": "GANGU", "meta": { "shortened": true, "fullName": "Sourav Ganguly" } },
  { "name": "RAHUL", "meta": { "shortened": false, "fullName": "Rahul Dravid" } },
  { "name": "DRAVI", "meta": { "shortened": true, "fullName": "Rahul Dravid" } },
  { "name": "JASPR", "meta": { "shortened": true, "fullName": "Jasprit Bumrah" } },
  { "name": "BUMRA", "meta": { "shortened": true, "fullName": "Jasprit Bumrah" } },
  { "name": "RAVIN", "meta": { "shortened": true, "fullName": "Ravindra Jadeja" } },
  { "name": "JADEJ", "meta": { "shortened": true, "fullName": "Ravindra Jadeja" } },
  { "name": "YUZVE", "meta": { "shortened": true, "fullName": "Yuzvendra Chahal" } },
  { "name": "CHAHA", "meta": { "shortened": true, "fullName": "Yuzvendra Chahal" } },
  { "name": "RISHA", "meta": { "shortened": true, "fullName": "Rishabh Pant" } },
  { "name": "PANT", "meta": { "shortened": false, "fullName": "Rishabh Pant" } },
  { "name": "ROHIT", "meta": { "shortened": false, "fullName": "Rohit Sharma" } },
  { "name": "SHARM", "meta": { "shortened": true, "fullName": "Rohit Sharma" } },
  { "name": "VIREN", "meta": { "shortened": true, "fullName": "Virender Sehwag" } },
  { "name": "SEHWA", "meta": { "shortened": true, "fullName": "Virender Sehwag" } },
  { "name": "YUVRA", "meta": { "shortened": true, "fullName": "Yuvraj Singh" } },
  { "name": "SINGH", "meta": { "shortened": false, "fullName": "Yuvraj Singh" } },
  { "name": "SURES", "meta": { "shortened": true, "fullName": "Suresh Raina" } },
  { "name": "RAINA", "meta": { "shortened": false, "fullName": "Suresh Raina" } },
  { "name": "GAUTA", "meta": { "shortened": true, "fullName": "Gautam Gambhir" } },
  { "name": "GAMBH", "meta": { "shortened": true, "fullName": "Gautam Gambhir" } },
  { "name": "SHIKH", "meta": { "shortened": true, "fullName": "Shikhar Dhawan" } },
  { "name": "DHAWA", "meta": { "shortened": true, "fullName": "Shikhar Dhawan" } },
  { "name": "KL", "meta": { "shortened": false, "fullName": "KL Rahul" } },
  { "name": "RAHUL", "meta": { "shortened": false, "fullName": "KL Rahul" } },
  { "name": "AJINK", "meta": { "shortened": true, "fullName": "Ajinkya Rahane" } },
  { "name": "RAHAN", "meta": { "shortened": true, "fullName": "Ajinkya Rahane" } },
  { "name": "CHETE", "meta": { "shortened": true, "fullName": "Cheteshwar Pujara" } },
  { "name": "PUJAR", "meta": { "shortened": true, "fullName": "Cheteshwar Pujara" } },
  { "name": "HARDI", "meta": { "shortened": true, "fullName": "Hardik Pandya" } },
  { "name": "PANDY", "meta": { "shortened": true, "fullName": "Hardik Pandya" } },
  { "name": "SURYA", "meta": { "shortened": true, "fullName": "Suryakumar Yadav" } },
  { "name": "YADAV", "meta": { "shortened": false, "fullName": "Suryakumar Yadav" } },
  { "name": "MOHAM", "meta": { "shortened": true, "fullName": "Mohammed Shami" } },
  { "name": "SHAMI", "meta": { "shortened": false, "fullName": "Mohammed Shami" } },
  { "name": "RAVIC", "meta": { "shortened": true, "fullName": "Ravichandran Ashwin" } },
  { "name": "ASHWI", "meta": { "shortened": true, "fullName": "Ravichandran Ashwin" } },
  { "name": "ISHAN", "meta": { "shortened": false, "fullName": "Ishan Kishan" } },
  { "name": "KISHA", "meta": { "shortened": true, "fullName": "Ishan Kishan" } },
  { "name": "SANJU", "meta": { "shortened": false, "fullName": "Sanju Samson" } },
  { "name": "SAMSO", "meta": { "shortened": true, "fullName": "Sanju Samson" } },
  { "name": "RINKU", "meta": { "shortened": false, "fullName": "Rinku Singh" } },
  { "name": "TILAK", "meta": { "shortened": false, "fullName": "Tilak Varma" } },
  { "name": "VARMA", "meta": { "shortened": false, "fullName": "Tilak Varma" } },
  { "name": "YASHA", "meta": { "shortened": true, "fullName": "Yashasvi Jaiswal" } },
  { "name": "JAISW", "meta": { "shortened": true, "fullName": "Yashasvi Jaiswal" } },
  { "name": "SHUBM", "meta": { "shortened": true, "fullName": "Shubman Gill" } },
  { "name": "GILL", "meta": { "shortened": false, "fullName": "Shubman Gill" } },
  { "name": "KULDE", "meta": { "shortened": true, "fullName": "Kuldeep Yadav" } },
  { "name": "ARSHD", "meta": { "shortened": true, "fullName": "Arshdeep Singh" } },
  { "name": "SIRAJ", "meta": { "shortened": false, "fullName": "Mohammed Siraj" } },
  { "name": "AXAR", "meta": { "shortened": false, "fullName": "Axar Patel" } },
  { "name": "PATEL", "meta": { "shortened": false, "fullName": "Axar Patel" } },
  { "name": "RUTUR", "meta": { "shortened": true, "fullName": "Ruturaj Gaikwad" } },
  { "name": "GAIKW", "meta": { "shortened": true, "fullName": "Ruturaj Gaikwad" } },
  { "name": "DINES", "meta": { "shortened": true, "fullName": "Dinesh Karthik" } },
  { "name": "KARTH", "meta": { "shortened": true, "fullName": "Dinesh Karthik" } },
  { "name": "VIRAT", "meta": { "shortened": false, "fullName": "Virat Kohli" } },
  { "name": "KOHLI", "meta": { "shortened": false, "fullName": "Virat Kohli" } },
  { "name": "ANIL", "meta": { "shortened": false, "fullName": "Anil Kumble" } },
  { "name": "KUMBL", "meta": { "shortened": true, "fullName": "Anil Kumble" } },
  { "name": "ZAHEE", "meta": { "shortened": true, "fullName": "Zaheer Khan" } },
  { "name": "KHAN", "meta": { "shortened": false, "fullName": "Zaheer Khan" } },
  { "name": "HARBH", "meta": { "shortened": true, "fullName": "Harbhajan Singh" } },
  { "name": "KAPIL", "meta": { "shortened": false, "fullName": "Kapil Dev" } },
  { "name": "DEV", "meta": { "shortened": false, "fullName": "Kapil Dev" } },
  { "name": "DAVID", "meta": { "shortened": false, "fullName": "David Warner" } },
  { "name": "WARNE", "meta": { "shortened": true, "fullName": "David Warner" } },
  { "name": "PAT", "meta": { "shortened": false, "fullName": "Pat Cummins" } },
  { "name": "CUMMI", "meta": { "shortened": true, "fullName": "Pat Cummins" } },
  { "name": "STARC", "meta": { "shortened": false, "fullName": "Mitchell Starc" } },
  { "name": "HEAD", "meta": { "shortened": false, "fullName": "Travis Head" } },
];
