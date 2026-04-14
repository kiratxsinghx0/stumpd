"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createRoom,
  getSavedPlayerName,
  savePlayerName,
  getChallengeHistory,
  type ChallengeHistoryEntry,
} from "../services/challenge-api";

export default function ChallengePage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([]);

  useEffect(() => {
    setPlayerName(getSavedPlayerName());
    setHistory(getChallengeHistory());
  }, []);

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
    <main className="challenge-hub">
      <div className="challenge-hub__header">
        <a href="/" className="challenge-hub__back" aria-label="Back to Stumpd">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </a>
        <img src="/stumpd-logo.png" alt="Stumpd" className="challenge-hub__logo" />
      </div>

      <div className="challenge-hub__hero">
        <div className="challenge-hub__hero-icon">
          <span className="challenge-hub__bat">🏏</span>
          <span className="challenge-hub__vs">VS</span>
          <span className="challenge-hub__bat challenge-hub__bat--flip">🏏</span>
        </div>
        <h1 className="challenge-hub__title">Challenge a Friend</h1>
        <p className="challenge-hub__subtitle">
          Race to guess the same cricketer. First to crack it wins!
        </p>
      </div>

      <div className="challenge-hub__card">
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

        <div className="challenge-hub__divider">
          <span className="challenge-hub__divider-text">OR</span>
        </div>

        <label className="challenge-hub__label" htmlFor="ch-code">Join with Code</label>
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

        {error && <p className="challenge-hub__error">{error}</p>}
      </div>

      {history.length > 0 && (
        <div className="challenge-hub__history">
          <h2 className="challenge-hub__history-title">Recent Challenges</h2>
          <div className="challenge-hub__history-list">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="challenge-hub__history-item">
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
    </main>
  );
}
