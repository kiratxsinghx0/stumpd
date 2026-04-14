import { io, Socket } from "socket.io-client";
import { xorDecode, ENCODE_KEY } from "../utils/xor-codec";

export type RoomInfo = {
  roomCode: string;
  status: "waiting" | "active" | "completed" | "expired";
  creatorName: string;
  opponentName: string | null;
  isFull: boolean;
  winner: "creator" | "opponent" | "draw" | null;
  createdAt: string;
};

export type GuessEntry = {
  guess: string;
  statuses: string[];
  isCorrect: boolean;
};

export type RoomResult = {
  roomCode: string;
  winner: "creator" | "opponent" | "draw";
  answer: string;
  fullName: string;
  creatorName: string;
  opponentName: string;
  creatorBoard: GuessEntry[];
  opponentBoard: GuessEntry[];
};

export type GameStartData = {
  encoded: string;
  fullName: string;
  hints: Record<string, unknown>[];
  opponentName: string;
  yourRole: "creator" | "opponent";
  countdown: number;
};

export type GuessResultData = {
  guessNumber: number;
  statuses: string[];
  isCorrect: boolean;
};

export type OpponentGuessedData = {
  guessNumber: number;
  correctCount: number;
  presentCount: number;
  totalGuesses: number;
  isCorrect: boolean;
};

export type GameOverData = {
  winner: "creator" | "opponent" | "draw";
  answer: string;
  fullName: string;
  creatorName: string;
  opponentName: string;
  creatorBoard: GuessEntry[];
  opponentBoard: GuessEntry[];
};

export async function createRoom(playerName: string): Promise<{ roomCode: string } | null> {
  try {
    const res = await fetch("/api/challenge/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function getRoomInfo(code: string): Promise<RoomInfo | null> {
  try {
    const res = await fetch(`/api/challenge/${code}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function getRoomResult(code: string): Promise<RoomResult | null> {
  try {
    const res = await fetch(`/api/challenge/${code}/result`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export function decodeAnswer(encoded: string): string {
  return xorDecode(encoded, ENCODE_KEY);
}

export function decodeFullName(encoded: string): string {
  return xorDecode(encoded, ENCODE_KEY);
}

const SOCKET_URL =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_SOCKET_URL
    ? process.env.NEXT_PUBLIC_SOCKET_URL
    : typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:4010"
      : "https://fifabackend-production-2dd4.up.railway.app";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

const LS_CHALLENGE_HISTORY_KEY = "stumpd_challenge_history";

export type ChallengeHistoryEntry = {
  roomCode: string;
  opponentName: string;
  result: "won" | "lost" | "draw";
  date: string;
};

export function saveChallengeToHistory(entry: ChallengeHistoryEntry): void {
  try {
    const raw = localStorage.getItem(LS_CHALLENGE_HISTORY_KEY);
    const history: ChallengeHistoryEntry[] = raw ? JSON.parse(raw) : [];
    history.unshift(entry);
    if (history.length > 20) history.length = 20;
    localStorage.setItem(LS_CHALLENGE_HISTORY_KEY, JSON.stringify(history));
  } catch { /* quota */ }
}

export function getChallengeHistory(): ChallengeHistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_CHALLENGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const LS_CHALLENGE_NAME_KEY = "stumpd_challenge_name";

export function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(LS_CHALLENGE_NAME_KEY) || "";
  } catch {
    return "";
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(LS_CHALLENGE_NAME_KEY, name);
  } catch { /* quota */ }
}
