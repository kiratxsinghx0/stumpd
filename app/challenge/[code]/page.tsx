"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getRoomInfo,
  getSocket,
  disconnectSocket,
  decodeAnswer,
  decodeFullName,
  getSavedPlayerName,
  savePlayerName,
  saveChallengeToHistory,
  createRoom,
  type GameStartData,
  type GameOverData,
} from "../../services/challenge-api";
import ChallengeLobby from "../../components/challenge/challenge-lobby";
import CountdownOverlay from "../../components/challenge/countdown-overlay";
import ChallengeGame from "../../components/challenge/challenge-game";
import ChallengeResult from "../../components/challenge/challenge-result";

type Phase = "loading" | "name-prompt" | "lobby" | "countdown" | "game" | "result" | "error";

export default function ChallengeRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Game state
  const [myRole, setMyRole] = useState<"creator" | "opponent">("creator");
  const [opponentName, setOpponentName] = useState("");
  const [answer, setAnswer] = useState("");
  const [fullName, setFullName] = useState("");
  const [hints, setHints] = useState<Record<string, unknown>[]>([]);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [disconnected, setDisconnected] = useState(false);

  const socketRef = useRef(getSocket());
  const joinedRef = useRef(false);
  const phaseRef = useRef<Phase>("loading");

  const setPhaseTracked = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // Load room info and determine initial phase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const info = await getRoomInfo(code);
      if (cancelled) return;

      if (!info) {
        setError("Room not found. Check the code and try again.");
        setPhaseTracked("error");
        return;
      }

      if (info.status === "expired") {
        setError("This room has expired. Create a new one!");
        setPhaseTracked("error");
        return;
      }

      if (info.status === "completed") {
        setError("This game is already finished.");
        setPhaseTracked("error");
        return;
      }

      const saved = getSavedPlayerName();
      if (saved) {
        setPlayerName(saved);
        setNameInput(saved);
        setPhaseTracked("lobby");
        connectSocket(saved);
      } else {
        setPhaseTracked("name-prompt");
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const connectSocket = useCallback((name: string) => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    const socket = socketRef.current;

    socket.removeAllListeners();

    socket.on("waiting", (data: { roomCode: string; creatorName: string; yourRole: string }) => {
      setMyRole(data.yourRole as "creator" | "opponent");
      setPhaseTracked("lobby");
    });

    socket.on("player-joined", (data: { opponentName: string }) => {
      setOpponentName(data.opponentName);
    });

    socket.on("game-start", (data: GameStartData) => {
      // #region agent log
      fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'65fd5a'},body:JSON.stringify({sessionId:'65fd5a',location:'[code]/page.tsx:game-start',message:'game-start received',data:{hasHints:!!data.hints,hintsType:typeof data.hints,isArray:Array.isArray(data.hints),preview:JSON.stringify(data.hints).slice(0,300),countdown:data.countdown,yourRole:data.yourRole},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
      // #endregion
      setMyRole(data.yourRole);
      setOpponentName(data.opponentName);
      setAnswer(decodeAnswer(data.encoded));
      setFullName(decodeFullName(data.fullName));

      // Normalize hints: backend sends a flat object, game expects an array of single-key objects
      const raw = data.hints;
      if (Array.isArray(raw)) {
        setHints(raw);
      } else if (raw && typeof raw === "object") {
        setHints(Object.entries(raw).map(([k, v]) => ({ [k]: v })));
      } else {
        setHints([]);
      }
      // #region agent log
      fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'65fd5a'},body:JSON.stringify({sessionId:'65fd5a',location:'[code]/page.tsx:hints-normalized',message:'hints after normalization',data:{rawType:typeof raw,isArrayRaw:Array.isArray(raw),isObjectRaw:raw&&typeof raw==='object',branchTaken:Array.isArray(raw)?'array':raw&&typeof raw==='object'?'object':'else'},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      if (data.countdown > 0) {
        setPhaseTracked("countdown");
      } else {
        setPhaseTracked("game");
      }
    });

    socket.on("game-over", (data: GameOverData) => {
      setGameOverData(data);
      setPhaseTracked("result");

      saveChallengeToHistory({
        roomCode: code,
        opponentName: data.creatorName,
        result: data.winner === "draw" ? "draw" : data.winner === myRole ? "won" : "lost",
        date: new Date().toISOString(),
      });
    });

    socket.on("opponent-disconnected", () => {
      setDisconnected(true);
    });

    socket.on("room-error", (data: { message: string }) => {
      // #region agent log
      fetch('http://127.0.0.1:7615/ingest/c641f394-8238-49b5-9ef6-2a0c0c5d4763',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'65fd5a'},body:JSON.stringify({sessionId:'65fd5a',location:'[code]/page.tsx:room-error',message:'room-error received',data:{errorMsg:data.message,currentPhase:phaseRef.current},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      const current = phaseRef.current;
      if (current === "game" || current === "result") return;
      setError(data.message);
      setPhaseTracked("error");
    });

    if (!socket.connected) socket.connect();
    socket.emit("join-room", { roomCode: code, playerName: name });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
      joinedRef.current = false;
    };
  }, []);

  const handleNameSubmit = useCallback(() => {
    const name = nameInput.trim();
    if (!name) return;
    setPlayerName(name);
    savePlayerName(name);
    setPhase("lobby");
    connectSocket(name);
  }, [nameInput, connectSocket]);

  const handleCountdownComplete = useCallback(() => {
    setPhase("game");
  }, []);

  const handleRematch = useCallback(async () => {
    disconnectSocket();
    joinedRef.current = false;
    const result = await createRoom(playerName);
    if (result) {
      router.push(`/challenge/${result.roomCode}`);
    }
  }, [playerName, router]);

  const handleShare = useCallback(() => {
    if (!gameOverData) return;
    const iWon = gameOverData.winner === myRole;
    const isDraw = gameOverData.winner === "draw";
    const emoji = iWon ? "🏆" : isDraw ? "🤝" : "😤";
    const resultText = iWon ? "won" : isDraw ? "drew" : "lost";
    const text = `${emoji} I ${resultText} a Stumpd Challenge!\n\nThe answer was ${gameOverData.fullName}\nChallenge your friends: ${window.location.origin}/challenge`;

    if (navigator.share) {
      navigator.share({ title: "Stumpd Challenge", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, [gameOverData, myRole]);

  const handleHome = useCallback(() => {
    router.push("/");
  }, [router]);

  // Render
  if (phase === "loading") {
    return (
      <main className="ch-room">
        <div className="ch-room__loading">
          <div className="game-loading__spinner" />
          <p>Loading room...</p>
        </div>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="ch-room">
        <div className="ch-room__error">
          <span className="ch-room__error-emoji">😕</span>
          <h2>Oops!</h2>
          <p>{error}</p>
          <button type="button" className="ch-room__error-btn" onClick={() => router.push("/challenge")}>
            Create New Room
          </button>
        </div>
      </main>
    );
  }

  if (phase === "name-prompt") {
    return (
      <main className="ch-room">
        <div className="ch-room__name-prompt">
          <h2 className="ch-room__name-title">Enter Your Name</h2>
          <p className="ch-room__name-subtitle">So your opponent knows who they&apos;re playing against</p>
          <input
            className="challenge-hub__input"
            type="text"
            placeholder="Your display name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={30}
            autoComplete="off"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
          />
          <button type="button" className="challenge-hub__create-btn" onClick={handleNameSubmit}>
            Join Game
          </button>
        </div>
      </main>
    );
  }

  if (phase === "lobby") {
    return (
      <main className="ch-room">
        <div className="ch-room__header">
          <a href="/challenge" className="challenge-hub__back" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </a>
          <img src="/stumpd-logo.png" alt="Stumpd" className="challenge-hub__logo" />
        </div>
        <ChallengeLobby roomCode={code} creatorName={playerName} />
      </main>
    );
  }

  if (phase === "countdown") {
    return (
      <main className="ch-room">
        <CountdownOverlay seconds={3} onComplete={handleCountdownComplete} />
      </main>
    );
  }

  if (phase === "game") {
    return (
      <main className="ch-room ch-room--game">
        <div className="ch-room__game-header">
          <img src="/stumpd-logo.png" alt="Stumpd" className="ch-room__game-logo" />
          <span className="ch-room__game-badge">CHALLENGE</span>
        </div>
        {disconnected && (
          <div className="ch-room__disconnect-banner">
            Your opponent disconnected. You can keep playing!
          </div>
        )}
        <ChallengeGame
          socket={socketRef.current}
          roomCode={code}
          answer={answer}
          fullName={fullName}
          hints={hints}
          opponentName={opponentName}
          myRole={myRole}
        />
      </main>
    );
  }

  if (phase === "result" && gameOverData) {
    return (
      <main className="ch-room">
        <div className="ch-room__header">
          <img src="/stumpd-logo.png" alt="Stumpd" className="challenge-hub__logo" />
        </div>
        <ChallengeResult
          winner={gameOverData.winner}
          myRole={myRole}
          answer={gameOverData.answer}
          fullName={gameOverData.fullName}
          creatorName={gameOverData.creatorName}
          opponentName={gameOverData.opponentName}
          creatorBoard={gameOverData.creatorBoard}
          opponentBoard={gameOverData.opponentBoard}
          onRematch={handleRematch}
          onShare={handleShare}
          onHome={handleHome}
        />
      </main>
    );
  }

  return null;
}
