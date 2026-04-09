import { xorDecode, ENCODE_KEY } from "../utils/xor-codec";

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

function decodePuzzle(data: PuzzleData): PuzzleData {
  if (typeof data.fullName === "string") {
    return { ...data, fullName: xorDecode(data.fullName, ENCODE_KEY) };
  }
  return data;
}

export async function fetchPlayers(): Promise<Response> {
  return fetch("/api/ipl/players", { cache: "no-store" });
}

export async function fetchPlayerCount(): Promise<number> {
  const res = await fetch("/api/ipl/players/count", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error("Unexpected response shape");
  return json.data.count as number;
}

export async function fetchPuzzleToday(): Promise<PuzzleData> {
  const res = await fetch("/api/ipl/puzzle/today", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error("Unexpected response shape");
  return decodePuzzle(json.data as PuzzleData);
}

export async function fetchPuzzleByDay(day: number): Promise<PuzzleData> {
  const res = await fetch(`/api/ipl/puzzle/day/${day}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const json = await res.json();
  if (!json.success || !json.data) throw new Error("Unexpected response shape");
  return decodePuzzle(json.data as PuzzleData);
}
