const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://fifabackend-production-2dd4.up.railway.app";

export type PuzzleHintEntry = Record<string, unknown>;

export type PuzzleData = {
  day: number;
  encoded: string;
  hash: string;
  previousHash: string | null;
  fullName: string | null;
  isShortened: boolean;
  hints: PuzzleHintEntry[] | null;
  setAt: string;
};

export async function fetchPlayers(): Promise<Response> {
  return fetch(`${API_BASE}/api/ipl/players`, { cache: "no-store" });
}

export async function fetchPlayerCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/ipl/players/count`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error("Unexpected response shape");
  return json.data.count as number;
}

export async function fetchPuzzleToday(): Promise<PuzzleData> {
  const res = await fetch(`${API_BASE}/api/ipl/puzzle/today`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error("Unexpected response shape");
  return json.data as PuzzleData;
}

export async function fetchPuzzleByDay(day: number): Promise<PuzzleData> {
  const res = await fetch(`${API_BASE}/api/ipl/puzzle/day/${day}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error("Unexpected response shape");
  return json.data as PuzzleData;
}
