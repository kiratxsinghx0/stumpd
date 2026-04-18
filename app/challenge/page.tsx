"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createRoom,
  getSavedPlayerName,
  savePlayerName,
  getChallengeHistory,
  type ChallengeHistoryEntry,
} from "../services/challenge-api";
import PageHeader, { OPEN_SETTINGS_EVENT, OPEN_HOW_TO_PLAY_EVENT, OPEN_LEADERBOARD_EVENT, dispatchLeaderboardState } from "../components/page-header";
import SettingsModal from "../components/settings-modal";
import HowToPlayModal from "../components/how-to-play-modal";
import LeaderboardModal from "../components/leaderboard-modal";
import StumpdHowToPlay from "../stumpd/stumpd-how-to-play";
import { fetchPuzzleToday, fetchHardModePuzzleToday } from "../services/ipl-api";
import { isLoggedIn, getStoredUser } from "../services/auth-api";

export default function ChallengePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [puzzleDay, setPuzzleDay] = useState<number | undefined>(undefined);
  const [hardModePuzzleDay, setHardModePuzzleDay] = useState<number | undefined>(undefined);

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
    setHistory(getChallengeHistory());
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

  const handleCreate = useCallback(async () => {
    const name = playerName.trim();
    if (!name) {
      setError("Enter your name to create a room");
      return;
    }
    setError("");
    setCreating(true);
    savePlayerName(name);
    const result = await createRoom(name);
    setCreating(false);
    if (!result) {
      setError("Failed to create room. Try again.");
      return;
    }
    router.push(`/challenge/${result.roomCode}`);
  }, [playerName, router]);

  const handleJoin = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a room code to join");
      return;
    }
    const name = playerName.trim();
    if (!name) {
      setError("Enter your name first");
      return;
    }
    savePlayerName(name);
    setError("");
    router.push(`/challenge/${code}`);
  }, [joinCode, playerName, router]);

  return (
    <main className="hub-page challenge-hub">
      <PageHeader showHowToPlay={false} />

      <div className="challenge-hub__hero" style={{ animation: "hubCardIn 0.4s ease both" }}>
        <h1 className="challenge-hub__title">⚔️ Challenge a Friend</h1>
        <p className="challenge-hub__subtitle">
          Same cricketer. Two guessers. Who cracks it first?
        </p>
      </div>

      <div className="challenge-hub__cards-grid">
        <div className="challenge-hub__card" style={{ animation: "hubCardIn 0.4s ease 0.06s both" }}>
          <div className="challenge-hub__card-header">
            <span className="challenge-hub__card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <h2 className="challenge-hub__card-title">Create a Room</h2>
          </div>
          <p className="challenge-hub__card-desc">Start a new match and share the code with your opponent.</p>

          <label className="challenge-hub__label" htmlFor="ch-name">Your Display Name</label>
          <input
            id="ch-name"
            className="challenge-hub__input"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={30}
            autoComplete="off"
          />

          <button
            type="button"
            className="challenge-hub__create-btn"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <span className="challenge-hub__spinner" />
            ) : (
              "Create Room"
            )}
          </button>
        </div>

        <div className="challenge-hub__card" style={{ animation: "hubCardIn 0.4s ease 0.12s both" }}>
          <div className="challenge-hub__card-header">
            <span className="challenge-hub__card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="challenge-hub__card-title">Join a Room</h2>
          </div>
          <p className="challenge-hub__card-desc">Got a code from a friend? Jump into their match.</p>

          <label className="challenge-hub__label" htmlFor="ch-code">Room Code</label>
          <div className="challenge-hub__join-row">
            <input
              id="ch-code"
              className="challenge-hub__input challenge-hub__input--code"
              type="text"
              placeholder="E.g. K9X2MP"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              maxLength={6}
              autoComplete="off"
            />
            <button
              type="button"
              className="challenge-hub__join-btn"
              onClick={handleJoin}
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {error && <p className="challenge-hub__error" style={{ animation: "hubCardIn 0.25s ease both" }}>{error}</p>}

      {history.length > 0 && (
        <div className="challenge-hub__history" style={{ animation: "hubCardIn 0.4s ease 0.18s both" }}>
          <h2 className="challenge-hub__history-title">Recent Challenges</h2>
          <div className="challenge-hub__history-list">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="challenge-hub__history-item" data-result={h.result}>
                <span className="challenge-hub__history-result" data-result={h.result}>
                  {h.result === "won" ? "W" : h.result === "lost" ? "L" : "D"}
                </span>
                <span className="challenge-hub__history-name">vs {h.opponentName}</span>
                <span className="challenge-hub__history-date">
                  {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/" className="challenge-hub__back-home">
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
