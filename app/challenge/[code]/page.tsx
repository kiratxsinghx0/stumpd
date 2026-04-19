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
  type GameStartData,
  type GameOverData,
  type SeriesOverData,
  type RoundOverData,
  type SeriesAcceptedData,
  type GuessEntry,
} from "../../services/challenge-api";
import PageHeader, { OPEN_HOW_TO_PLAY_EVENT, OPEN_LEADERBOARD_EVENT, dispatchLeaderboardState } from "../../components/page-header";
import ChallengeLobby from "../../components/challenge/challenge-lobby";
import CountdownOverlay from "../../components/challenge/countdown-overlay";
import ChallengeGame from "../../components/challenge/challenge-game";
import ChallengeResult from "../../components/challenge/challenge-result";
import HowToPlayModal from "../../components/how-to-play-modal";
import LeaderboardModal from "../../components/leaderboard-modal";
import StumpdHowToPlay from "../../stumpd/stumpd-how-to-play";
import { fetchPuzzleToday, fetchHardModePuzzleToday } from "../../services/ipl-api";
import { isLoggedIn, getStoredUser } from "../../services/auth-api";

type Phase = "loading" | "name-prompt" | "lobby" | "countdown" | "game" | "round-result" | "result" | "error";

export default function ChallengeRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [nameInput, setNameInput] = useState("");

  const [myRole, setMyRole] = useState<"creator" | "opponent">("creator");
  const myRoleRef = useRef<"creator" | "opponent">("creator");
  const [opponentName, setOpponentName] = useState("");
  const [answer, setAnswer] = useState("");
  const [fullName, setFullName] = useState("");
  const [hints, setHints] = useState<Record<string, unknown>[]>([]);
  const [disconnected, setDisconnected] = useState(false);
  const [previousGuesses, setPreviousGuesses] = useState<{ guess: string; statuses: string[]; isCorrect: boolean }[]>([]);
  const [initialOpponentGuessCount, setInitialOpponentGuessCount] = useState(0);

  // Series state
  const [seriesLength, setSeriesLength] = useState(1);
  const [roundNumber, setRoundNumber] = useState(1);
  const [creatorScore, setCreatorScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  // Round-over state
  const [roundOverData, setRoundOverData] = useState<RoundOverData | null>(null);
  const [iReady, setIReady] = useState(false);
  const [oppReady, setOppReady] = useState(false);

  // Standalone game-over state (for single game result + proposal UI)
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const gameOverDataRef = useRef<GameOverData | null>(null);

  // Series-over / final result state
  const [seriesOverData, setSeriesOverData] = useState<SeriesOverData | null>(null);

  // Signals ChallengeGame that the server ended the round (opponent may have won first)
  const [serverGameOver, setServerGameOver] = useState(false);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [puzzleDay, setPuzzleDay] = useState<number | undefined>(undefined);
  const [hardModePuzzleDay, setHardModePuzzleDay] = useState<number | undefined>(undefined);

  const socketRef = useRef(getSocket());
  const joinedRef = useRef(false);
  const phaseRef = useRef<Phase>("loading");
  const pendingTransitionRef = useRef<Phase | null>(null);
  const gameAnimationsDoneRef = useRef(false);

  const setPhaseTracked = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const handleGameAnimationsComplete = useCallback(() => {
    gameAnimationsDoneRef.current = true;
    const target = pendingTransitionRef.current;
    if (target) {
      pendingTransitionRef.current = null;
      setPhaseTracked(target);
    }
  }, [setPhaseTracked]);

  useEffect(() => {
    document.body.classList.remove("body--godmode");
    document.documentElement.classList.remove("godmode-early");
    document.documentElement.style.removeProperty("background-color");
    document.documentElement.style.removeProperty("color-scheme");
  }, []);

  useEffect(() => {
    fetchPuzzleToday().then((p) => setPuzzleDay(p.day)).catch(() => {});
    fetchHardModePuzzleToday().then((p) => setHardModePuzzleDay(p.day)).catch(() => {});
  }, []);

  useEffect(() => {
    const onOpenHtp = () => setShowHowToPlay(true);
    window.addEventListener(OPEN_HOW_TO_PLAY_EVENT, onOpenHtp);
    return () => window.removeEventListener(OPEN_HOW_TO_PLAY_EVENT, onOpenHtp);
  }, []);

  useEffect(() => {
    const onOpenLb = () => setShowLeaderboard(true);
    window.addEventListener(OPEN_LEADERBOARD_EVENT, onOpenLb);
    return () => window.removeEventListener(OPEN_LEADERBOARD_EVENT, onOpenLb);
  }, []);

  useEffect(() => {
    dispatchLeaderboardState(showLeaderboard);
  }, [showLeaderboard]);

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

      setSeriesLength(info.seriesLength || 1);
      setCreatorScore(info.creatorScore || 0);
      setOpponentScore(info.opponentScore || 0);
      setRoundNumber(info.currentRound || 1);

      const saved = getSavedPlayerName();
      if (saved) {
        setPlayerName(saved);
        setNameInput(saved);
        setPhaseTracked("lobby");
        connectSocket(saved);
      } else {
        let defaultName = "Guest";
        if (isLoggedIn()) {
          const user = getStoredUser();
          if (user?.email) {
            defaultName = user.email.split("@")[0];
          }
        }
        setNameInput(defaultName);
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
      myRoleRef.current = data.yourRole as "creator" | "opponent";
      setPhaseTracked("lobby");
    });

    socket.on("player-joined", (data: { opponentName: string }) => {
      setOpponentName(data.opponentName);
    });

    socket.on("game-start", (data: GameStartData) => {
      setMyRole(data.yourRole);
      myRoleRef.current = data.yourRole;
      setOpponentName(data.opponentName);
      setAnswer(decodeAnswer(data.encoded));
      setFullName(decodeFullName(data.fullName));
      setRoundNumber(data.roundNumber || 1);
      setSeriesLength(data.seriesLength || 1);
      setCreatorScore(data.creatorScore || 0);
      setOpponentScore(data.opponentScore || 0);
      setIReady(false);
      setOppReady(false);
      gameAnimationsDoneRef.current = false;
      pendingTransitionRef.current = null;
      setServerGameOver(false);

      if (data.previousGuesses?.length) {
        setPreviousGuesses(data.previousGuesses);
      } else {
        setPreviousGuesses([]);
      }
      if (data.opponentGuessCount != null) {
        setInitialOpponentGuessCount(data.opponentGuessCount);
      } else {
        setInitialOpponentGuessCount(0);
      }

      const raw = data.hints;
      if (Array.isArray(raw)) {
        setHints(raw);
      } else if (raw && typeof raw === "object") {
        setHints(Object.entries(raw).map(([k, v]) => ({ [k]: v })));
      } else {
        setHints([]);
      }
      if (data.countdown > 0) {
        setPhaseTracked("countdown");
      } else {
        setPhaseTracked("game");
      }
    });

    // Standalone game over (series_length=1) — store data, transition when animations done
    socket.on("game-over", (data: GameOverData) => {
      gameOverDataRef.current = data;
      setGameOverData(data);
      setServerGameOver(true);

      const role = myRoleRef.current;
      saveChallengeToHistory({
        roomCode: code,
        opponentName: role === "creator" ? data.opponentName : data.creatorName,
        result: data.winner === "draw" ? "draw" : data.winner === role ? "won" : "lost",
        date: new Date().toISOString(),
      });

      if (gameAnimationsDoneRef.current) {
        setPhaseTracked("result");
      } else {
        pendingTransitionRef.current = "result";
      }
    });

    // Mid-series round over — store data, transition when animations done
    socket.on("round-over", (data: RoundOverData) => {
      setRoundOverData(data);
      setCreatorScore(data.creatorScore);
      setOpponentScore(data.opponentScore);
      setRoundNumber(data.roundNumber);
      setIReady(false);
      setOppReady(false);
      setServerGameOver(true);

      if (gameAnimationsDoneRef.current) {
        setPhaseTracked("round-result");
      } else {
        pendingTransitionRef.current = "round-result";
      }
    });

    // Final series over — store data, transition when animations done
    socket.on("series-over", (data: SeriesOverData) => {
      setSeriesOverData(data);
      setGameOverData(null);
      setCreatorScore(data.creatorScore);
      setOpponentScore(data.opponentScore);
      setSeriesLength(data.seriesLength);
      setServerGameOver(true);

      const role = myRoleRef.current;
      saveChallengeToHistory({
        roomCode: code,
        opponentName: role === "creator" ? data.opponentName : data.creatorName,
        result: data.seriesWinner === "draw" ? "draw" : data.seriesWinner === role ? "won" : "lost",
        date: new Date().toISOString(),
      });

      if (gameAnimationsDoneRef.current) {
        setPhaseTracked("result");
      } else {
        pendingTransitionRef.current = "result";
      }
    });

    // Series accepted — transition to round-result (scoreboard + ready)
    socket.on("series-accepted", (data: SeriesAcceptedData) => {
      setSeriesLength(data.seriesLength);
      setCreatorScore(data.creatorScore);
      setOpponentScore(data.opponentScore);
      setRoundNumber(data.currentRound);
      setIReady(false);
      setOppReady(false);

      let r1Winner: "creator" | "opponent" | "draw" = "draw";
      if (data.creatorScore > data.opponentScore) r1Winner = "creator";
      else if (data.opponentScore > data.creatorScore) r1Winner = "opponent";

      const prev = gameOverDataRef.current;
      setRoundOverData({
        roundWinner: r1Winner,
        roundNumber: 1,
        seriesLength: data.seriesLength,
        creatorScore: data.creatorScore,
        opponentScore: data.opponentScore,
        answer: prev?.answer || "",
        fullName: prev?.fullName || "",
        creatorName: prev?.creatorName || "",
        opponentName: prev?.opponentName || "",
        creatorBoard: prev?.creatorBoard || [],
        opponentBoard: prev?.opponentBoard || [],
      });

      setPhaseTracked("round-result");
    });

    socket.on("opponent-ready", () => {
      setOppReady(true);
    });

    socket.on("between-rounds", (data: {
      roomCode: string; yourRole: string; opponentName: string;
      roundNumber: number; seriesLength: number;
      creatorScore: number; opponentScore: number;
      youReady: boolean; opponentReady: boolean;
    }) => {
      setMyRole(data.yourRole as "creator" | "opponent");
      myRoleRef.current = data.yourRole as "creator" | "opponent";
      setOpponentName(data.opponentName);
      setRoundNumber(data.roundNumber);
      setSeriesLength(data.seriesLength);
      setCreatorScore(data.creatorScore);
      setOpponentScore(data.opponentScore);
      setIReady(data.youReady);
      setOppReady(data.opponentReady);
      setPhaseTracked("round-result");
    });

    socket.on("opponent-disconnected", () => {
      setDisconnected(true);
    });

    socket.on("opponent-guessed", () => {
      setDisconnected(false);
    });

    socket.on("room-error", (data: { message: string }) => {
      const current = phaseRef.current;
      if (current === "game" || current === "result" || current === "round-result") return;
      setError(data.message);
      setPhaseTracked("error");
    });

    if (!socket.connected) socket.connect();
    socket.emit("join-room", { roomCode: code, playerName: name });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

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

  const handleReadyNextRound = useCallback(() => {
    setIReady(true);
    socketRef.current.emit("ready-next-round", { roomCode: code });
  }, [code]);

  const handleSeriesAccepted = useCallback(() => {
    // The series-accepted event handler above will move us to round-result
  }, []);

  const handleHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const modals = (
    <>
      <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)}>
        <StumpdHowToPlay />
      </HowToPlayModal>
      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        puzzleDay={puzzleDay}
        hardModePuzzleDay={hardModePuzzleDay}
      />
    </>
  );

  if (phase === "loading") {
    return (
      <main className="ch-room">
        <div className="ch-room__loading">
          <div className="game-loading__spinner" />
          <p>Loading room...</p>
        </div>
        {modals}
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="ch-room">
        <PageHeader showHowToPlay={false} />
        <div className="ch-room__error">
          <span className="ch-room__error-emoji">😕</span>
          <h2>Oops!</h2>
          <p>{error}</p>
          <button type="button" className="ch-room__error-btn" onClick={() => router.push("/challenge")}>
            Create New Room
          </button>
        </div>
        {modals}
      </main>
    );
  }

  if (phase === "name-prompt") {
    return (
      <main className="ch-room">
        <PageHeader showHowToPlay={false} />
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
        {modals}
      </main>
    );
  }

  if (phase === "lobby") {
    return (
      <main className="ch-room">
        <PageHeader showHowToPlay={false} />
        <ChallengeLobby roomCode={code} creatorName={playerName} />
        {modals}
      </main>
    );
  }

  if (phase === "countdown") {
    return (
      <main className="ch-room">
        <CountdownOverlay seconds={3} onComplete={handleCountdownComplete} />
        {modals}
      </main>
    );
  }

  if (phase === "game") {
    return (
      <main className="game-page ch-room ch-room--game">
        <ChallengeGame
          socket={socketRef.current}
          roomCode={code}
          answer={answer}
          fullName={fullName}
          hints={hints}
          opponentName={opponentName}
          myRole={myRole}
          disconnected={disconnected}
          previousGuesses={previousGuesses}
          initialOpponentGuessCount={initialOpponentGuessCount}
          roundNumber={roundNumber}
          seriesLength={seriesLength}
          onAnimationsComplete={handleGameAnimationsComplete}
          serverGameOver={serverGameOver}
        />
        {modals}
      </main>
    );
  }

  if (phase === "round-result" && roundOverData) {
    const myName = myRole === "creator" ? roundOverData.creatorName : roundOverData.opponentName;
    const theirName = myRole === "creator" ? roundOverData.opponentName : roundOverData.creatorName;
    const iWonRound = roundOverData.roundWinner === myRole;
    const roundDraw = roundOverData.roundWinner === "draw";

    return (
      <main className="ch-room">
        <PageHeader showHowToPlay={false} />
        <div className="ch-round-result">
          <div className={`ch-round-result__banner${iWonRound ? " ch-round-result__banner--won" : roundDraw ? " ch-round-result__banner--draw" : " ch-round-result__banner--lost"}`}>
            <span className="ch-round-result__emoji">{iWonRound ? "✅" : roundDraw ? "🤝" : "❌"}</span>
            <h2 className="ch-round-result__heading">
              Round {roundOverData.roundNumber} — {iWonRound ? "You won!" : roundDraw ? "Draw!" : `${theirName} won`}
            </h2>
            <p className="ch-round-result__answer">
              The answer was <strong>{roundOverData.fullName}</strong>
            </p>
            {roundOverData.aliasWord && (
              <p className="ch-round-result__alias">
                Guessed from hints! The word was <strong>{roundOverData.aliasWord}</strong>
              </p>
            )}
          </div>

          <div className="ch-round-result__scoreboard">
            <div className="ch-round-result__score-side">
              <span className="ch-round-result__score-name">{theirName}</span>
              <span className="ch-round-result__score-num">{myRole === "creator" ? opponentScore : creatorScore}</span>
            </div>
            <span className="ch-round-result__score-dash">—</span>
            <div className="ch-round-result__score-side">
              <span className="ch-round-result__score-name">YOU</span>
              <span className="ch-round-result__score-num">{myRole === "creator" ? creatorScore : opponentScore}</span>
            </div>
          </div>

          <div className="ch-result__boards-card">
            <div className="ch-result__boards">
              <RoundBoardColumn
                label={myRole === "creator" ? "You" : roundOverData.creatorName}
                board={roundOverData.creatorBoard}
                isWinner={roundOverData.roundWinner === "creator"}
              />
              <div className="ch-result__vs">VS</div>
              <RoundBoardColumn
                label={myRole === "opponent" ? "You" : roundOverData.opponentName}
                board={roundOverData.opponentBoard}
                isWinner={roundOverData.roundWinner === "opponent"}
              />
            </div>
          </div>

          <div className="ch-round-result__ready-wrap">
            {iReady ? (
              <div className="ch-round-result__waiting-opp">
                <div className="ch-lobby__pulse" />
                <p>{oppReady ? "Starting..." : `Waiting for ${theirName}...`}</p>
              </div>
            ) : (
              <button
                type="button"
                className="ch-round-result__ready-btn"
                onClick={handleReadyNextRound}
              >
                Ready for Round {roundOverData.roundNumber + 1}
              </button>
            )}
            {oppReady && !iReady && (
              <p className="ch-round-result__opp-ready">{theirName} is ready!</p>
            )}
          </div>
        </div>
        {modals}
      </main>
    );
  }

  // Result phase — either standalone game-over or series-over
  if (phase === "result") {
    // Series finished
    if (seriesOverData) {
      return (
        <main className="ch-room">
          <PageHeader showHowToPlay={false} />
          <ChallengeResult
            winner={seriesOverData.seriesWinner}
            myRole={myRole}
            creatorName={seriesOverData.creatorName}
            opponentName={seriesOverData.opponentName}
            creatorBoard={seriesOverData.creatorBoard}
            opponentBoard={seriesOverData.opponentBoard}
            creatorScore={seriesOverData.creatorScore}
            opponentScore={seriesOverData.opponentScore}
            seriesLength={seriesOverData.seriesLength}
            onHome={handleHome}
            aliasWord={seriesOverData.aliasWord}
            answerFullName={seriesOverData.fullName}
            answerWord={seriesOverData.answer}
          />
          {modals}
        </main>
      );
    }

    // Standalone game-over — show proposal UI
    if (gameOverData) {
      return (
        <main className="ch-room">
          <PageHeader showHowToPlay={false} />
          <ChallengeResult
            winner={gameOverData.winner}
            myRole={myRole}
            creatorName={gameOverData.creatorName}
            opponentName={gameOverData.opponentName}
            creatorBoard={gameOverData.creatorBoard}
            opponentBoard={gameOverData.opponentBoard}
            onHome={handleHome}
            socket={socketRef.current}
            roomCode={code}
            onSeriesAccepted={handleSeriesAccepted}
            aliasWord={gameOverData.aliasWord}
            answerFullName={gameOverData.fullName}
            answerWord={gameOverData.answer}
          />
          {modals}
        </main>
      );
    }
  }

  return null;
}

function RoundBoardColumn({
  label, board, isWinner,
}: {
  label: string;
  board: GuessEntry[];
  isWinner: boolean;
}) {
  const STATUS_COLOR: Record<string, string> = {
    correct: "#6aaa64",
    present: "#c9b458",
    absent: "#787c7e",
  };

  return (
    <div className={`ch-result__col${isWinner ? " ch-result__col--winner" : ""}`}>
      <div className="ch-result__col-header">
        <span className="ch-result__col-avatar">{label.charAt(0).toUpperCase()}</span>
        <span className="ch-result__col-name">{label}</span>
        {isWinner && <span className="ch-result__crown">👑</span>}
      </div>
      <div className="ch-result__mini-grid">
        {board.map((row, ri) => (
          <div key={ri} className="ch-result__mini-row">
            {row.guess.split("").map((letter, ci) => (
              <span
                key={ci}
                className="ch-result__mini-tile"
                style={{
                  backgroundColor: STATUS_COLOR[row.statuses[ci]] || "#d3d6da",
                  color: row.statuses[ci] ? "#fff" : "#000",
                }}
              >
                {letter.toUpperCase()}
              </span>
            ))}
          </div>
        ))}
        {Array.from({ length: 6 - board.length }).map((_, i) => (
          <div key={`empty-${i}`} className="ch-result__mini-row">
            {Array.from({ length: 5 }).map((__, ci) => (
              <span key={ci} className="ch-result__mini-tile ch-result__mini-tile--empty" />
            ))}
          </div>
        ))}
      </div>
      <p className="ch-result__col-stat">{board.length} guess{board.length !== 1 ? "es" : ""}</p>
    </div>
  );
}
