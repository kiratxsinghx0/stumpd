"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSavedPlayerName,
  savePlayerName,
} from "../../services/challenge-api";
import {
  getRandomSocket,
  disconnectRandomSocket,
  type QueuedData,
  type MatchFoundData,
} from "../../services/random-api";
import PageHeader, {
  OPEN_SETTINGS_EVENT,
  OPEN_HOW_TO_PLAY_EVENT,
  OPEN_LEADERBOARD_EVENT,
  dispatchLeaderboardState,
} from "../../components/page-header";
import SettingsModal from "../../components/settings-modal";
import HowToPlayModal from "../../components/how-to-play-modal";
import LeaderboardModal from "../../components/leaderboard-modal";
import StumpdHowToPlay from "../../stumpd/stumpd-how-to-play";
import { fetchPuzzleToday, fetchHardModePuzzleToday } from "../../services/ipl-api";
import { isLoggedIn, getStoredUser } from "../../services/auth-api";
import { getDeviceId } from "../../utils/device-id";

export default function ChallengeRandomPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [queueSize, setQueueSize] = useState<number | null>(null);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [puzzleDay, setPuzzleDay] = useState<number | undefined>(undefined);
  const [hardModePuzzleDay, setHardModePuzzleDay] = useState<number | undefined>(undefined);

  const navigatingRef = useRef(false);

  useEffect(() => {
    fetchPuzzleToday().then((p) => setPuzzleDay(p.day)).catch(() => {});
    fetchHardModePuzzleToday().then((p) => setHardModePuzzleDay(p.day)).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.classList.remove("body--godmode");
    document.documentElement.classList.remove("godmode-early");
    document.documentElement.style.removeProperty("background-color");
    document.documentElement.style.removeProperty("color-scheme");
    const saved = getSavedPlayerName();
    if (saved) {
      setPlayerName(saved);
    } else if (isLoggedIn()) {
      const user = getStoredUser();
      if (user?.email) {
        setPlayerName(user.email.split("@")[0]);
      }
    } else {
      setPlayerName("Guest");
    }
  }, []);

  useEffect(() => {
    const onOpenSettings = () => setShowSettings(true);
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, onOpenSettings);
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
    if (!searching) {
      setSearchSeconds(0);
      return;
    }
    const t = setInterval(() => setSearchSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [searching]);

  const stopSearching = useCallback((emitLeave: boolean) => {
    if (emitLeave) {
      try {
        const socket = getRandomSocket();
        if (socket.connected) socket.emit("leave-queue");
      } catch {
        /* ignore */
      }
    }
    disconnectRandomSocket();
    setSearching(false);
    setQueueSize(null);
  }, []);

  useEffect(() => {
    return () => {
      if (!navigatingRef.current) {
        disconnectRandomSocket();
      }
    };
  }, []);

  const handleFindMatch = useCallback(() => {
    const name = playerName.trim();
    if (!name) {
      setError("Enter your name to find a match");
      return;
    }
    setError("");
    savePlayerName(name);
    setSearching(true);

    const socket = getRandomSocket();
    socket.removeAllListeners();

    socket.on("queued", (data: QueuedData) => {
      setQueueSize(data.queueSize);
    });

    socket.on("match-found", (data: MatchFoundData) => {
      navigatingRef.current = true;
      router.push(`/challenge/random/${data.roomCode}`);
    });

    socket.on("room-error", (data: { message: string }) => {
      setError(data.message || "Matchmaking failed. Try again.");
      stopSearching(false);
    });

    socket.on("disconnect", () => {
      // Server-side disconnect — only react if we were searching (not navigating)
      if (!navigatingRef.current && searching) {
        setError("Disconnected from server. Try again.");
        setSearching(false);
        setQueueSize(null);
      }
    });

    if (!socket.connected) socket.connect();
    socket.emit("enter-queue", {
      playerName: name,
      deviceId: getDeviceId(),
      userId: getStoredUser()?.id,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName, router, stopSearching]);

  const handleCancelSearch = useCallback(() => {
    stopSearching(true);
  }, [stopSearching]);

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  return (
    <main className="hub-page challenge-hub">
      <PageHeader showHowToPlay={false} />

      <div className="challenge-hub__hero" style={{ animation: "hubCardIn 0.4s ease both" }}>
        <h1 className="challenge-hub__title">⚔️ Challenge</h1>
        <p className="challenge-hub__subtitle">
        Same cricketer. Two strangers. First to crack it wins.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 540, marginBottom: 4 }}>
        <Link
          href="/challenge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#64748b",
            fontSize: "0.82rem",
            fontWeight: 600,
            textDecoration: "none",
            padding: "4px 0",
          }}
          onClick={() => stopSearching(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Choose a different mode
        </Link>
      </div>

      <div className="challenge-hub__cards-grid">
        <div className="challenge-hub__card" style={{ animation: "hubCardIn 0.4s ease 0.06s both" }}>
          <div className="challenge-hub__card-header">
            <span className="challenge-hub__card-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="challenge-hub__card-title">Challenge a Random Player</h2>
          </div>
          <p className="challenge-hub__card-desc">
            Enter a display name and we&apos;ll match you with someone online right now.
          </p>

          <label className="challenge-hub__label" htmlFor="ch-random-name">Your Display Name</label>
          <input
            id="ch-random-name"
            className="challenge-hub__input"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={30}
            autoComplete="off"
            disabled={searching}
          />

          {!searching ? (
            <button
              type="button"
              className="challenge-hub__create-btn"
              onClick={handleFindMatch}
            >
              Find a Match
            </button>
          ) : (
            <button
              type="button"
              className="challenge-hub__create-btn"
              onClick={handleCancelSearch}
              style={{ background: "#64748b" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="challenge-hub__spinner" />
                {queueSize != null && queueSize > 1
                  ? `Searching… ${queueSize} in queue · ${formatSecs(searchSeconds)} · Tap to cancel`
                  : `Searching… ${formatSecs(searchSeconds)} · Tap to cancel`}
              </span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="challenge-hub__error" style={{ animation: "hubCardIn 0.25s ease both" }}>
          {error}
        </p>
      )}

      <Link href="/" className="challenge-hub__back-home" onClick={() => stopSearching(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to all modes
      </Link>

      <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)}>
        <StumpdHowToPlay />
      </HowToPlayModal>

      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        puzzleDay={puzzleDay}
        hardModePuzzleDay={hardModePuzzleDay}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        hardMode={false}
        onToggleHardMode={() => {}}
        canEnableHardMode={false}
        canDisableHardMode={false}
        hideHardMode
      />
    </main>
  );
}
