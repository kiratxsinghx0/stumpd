import { io, Socket } from "socket.io-client";

export type {
  RoomInfo,
  GuessEntry,
  RoomResult,
  RoundResultData,
  GameStartData,
  GuessResultData,
  OpponentGuessedData,
  RoundOverData,
  SeriesOverData,
  GameOverData,
  SeriesProposedData,
  SeriesAcceptedData,
} from "./challenge-api";

export type QueuedData = {
  position: number;
  queueSize: number;
};

export type MatchFoundData = {
  roomCode: string;
  yourRole: "creator" | "opponent";
  opponentName: string;
  playerName: string;
};

const SOCKET_BASE_URL =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_SOCKET_URL
    ? process.env.NEXT_PUBLIC_SOCKET_URL
    : typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:4010"
      : "https://fifabackend-production-2dd4.up.railway.app";

const RANDOM_NAMESPACE_URL = `${SOCKET_BASE_URL.replace(/\/$/, "")}/random`;

let randomSocketInstance: Socket | null = null;

export function getRandomSocket(): Socket {
  if (!randomSocketInstance) {
    randomSocketInstance = io(RANDOM_NAMESPACE_URL, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return randomSocketInstance;
}

export function disconnectRandomSocket(): void {
  if (randomSocketInstance) {
    randomSocketInstance.disconnect();
    randomSocketInstance = null;
  }
}

export async function getRandomRoomInfo(code: string) {
  try {
    const res = await fetch(`/api/random/${code}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function getRandomRoomResult(code: string) {
  try {
    const res = await fetch(`/api/random/${code}/result`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}
