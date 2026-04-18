"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { GuessEntry, SeriesProposedData } from "../../services/challenge-api";

const STATUS_COLOR: Record<string, string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent: "#787c7e",
};

const STATUS_EMOJI: Record<string, string> = {
  correct: "\u{1F7E9}",
  present: "\u{1F7E8}",
  absent: "\u2B1C",
};

type ProposalState =
  | "idle"
  | "proposing"
  | "waiting"
  | "received"
  | "declined";

type Props = {
  winner: "creator" | "opponent" | "draw";
  myRole: "creator" | "opponent";
  creatorName: string;
  opponentName: string;
  creatorBoard: GuessEntry[];
  opponentBoard: GuessEntry[];
  creatorScore?: number;
  opponentScore?: number;
  seriesLength?: number;
  onHome: () => void;
  socket?: Socket;
  roomCode?: string;
  onSeriesAccepted?: () => void;
};

export default function ChallengeResult({
  winner, myRole,
  creatorName, opponentName,
  creatorBoard, opponentBoard,
  creatorScore = 0, opponentScore = 0,
  seriesLength = 1,
  onHome,
  socket, roomCode,
  onSeriesAccepted,
}: Props) {
  const iWon = winner === myRole;
  const isDraw = winner === "draw";
  const isSeries = seriesLength > 1;
  const canPropose = !isSeries && !!socket && !!roomCode;

  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [proposal, setProposal] = useState<ProposalState>("idle");
  const [proposedLength, setProposedLength] = useState(0);
  const [incomingProposal, setIncomingProposal] = useState<SeriesProposedData | null>(null);

  useEffect(() => () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); }, []);

  useEffect(() => {
    if (!socket || !canPropose) return;

    const onProposalSent = (data: { seriesLength: number }) => {
      setProposal("waiting");
      setProposedLength(data.seriesLength);
    };

    const onSeriesProposed = (data: SeriesProposedData) => {
      setIncomingProposal(data);
      setProposal("received");
    };

    const onSeriesDeclined = () => {
      setProposal("declined");
      setTimeout(() => setProposal("idle"), 3000);
    };

    socket.on("proposal-sent", onProposalSent);
    socket.on("series-proposed", onSeriesProposed);
    socket.on("series-declined", onSeriesDeclined);

    return () => {
      socket.off("proposal-sent", onProposalSent);
      socket.off("series-proposed", onSeriesProposed);
      socket.off("series-declined", onSeriesDeclined);
    };
  }, [socket, canPropose]);

  const handlePropose = useCallback((len: 3 | 5) => {
    if (!socket || !roomCode) return;
    setProposal("proposing");
    setProposedLength(len);
    socket.emit("propose-series", { roomCode, seriesLength: len });
  }, [socket, roomCode]);

  const handleAccept = useCallback(() => {
    if (!socket || !roomCode) return;
    socket.emit("accept-series", { roomCode });
    onSeriesAccepted?.();
  }, [socket, roomCode, onSeriesAccepted]);

  const handleDecline = useCallback(() => {
    if (!socket || !roomCode) return;
    socket.emit("decline-series", { roomCode });
    setProposal("idle");
    setIncomingProposal(null);
  }, [socket, roomCode]);

  const myBoard = myRole === "creator" ? creatorBoard : opponentBoard;
  const theirBoard = myRole === "creator" ? opponentBoard : creatorBoard;
  const theirName = myRole === "creator" ? opponentName : creatorName;
  const myScore = myRole === "creator" ? creatorScore : opponentScore;
  const theirScore = myRole === "creator" ? opponentScore : creatorScore;

  const guessDiff = theirBoard.length - myBoard.length;

  const headingText = useMemo(() => {
    if (isDraw) return "Evenly Matched!";
    return iWon ? "Stumped 'em!" : "Bowled Out!";
  }, [isDraw, iWon]);

  const headingEmoji = useMemo(() => {
    if (isDraw) return "🤝";
    return iWon ? "🏆" : "😤";
  }, [isDraw, iWon]);

  const subText = useMemo(() => {
    if (isSeries) {
      if (isDraw) return `Series tied ${myScore}–${theirScore}`;
      if (iWon) return `You won the series ${myScore}–${theirScore}!`;
      return `${theirName} won the series ${theirScore}–${myScore}`;
    }
    if (isDraw) return "Neither could outscore the other";
    if (iWon) {
      if (guessDiff > 0) return `Won by ${guessDiff} guess${guessDiff !== 1 ? "es" : ""} from ${theirName}`;
      return `Beat ${theirName}!`;
    }
    return `${theirName} got there first`;
  }, [isDraw, iWon, guessDiff, theirName, isSeries, myScore, theirScore]);

  const buildShareText = useCallback(() => {
    const emoji = iWon ? "\u{1F3C6}" : isDraw ? "\u{1F91D}" : "\u{1F624}";
    const resultText = iWon ? "won" : isDraw ? "drew" : "lost";
    const scoreLine = isSeries
      ? `\nSeries: ${myScore}–${theirScore}`
      : iWon && guessDiff > 0
        ? `\nWon by ${guessDiff} guess${guessDiff !== 1 ? "es" : ""} from ${theirName}`
        : "";

    const gridRows = myBoard.map(row =>
      row.statuses.map(s => STATUS_EMOJI[s] ?? "\u2B1C").join("")
    );

    return [
      `${emoji} I ${resultText} a Stumpd Challenge!${scoreLine}`,
      `${myBoard.length}/6 guesses`,
      "",
      ...gridRows,
      "",
      "\u{1F3CF} Challenge your friends:",
      `${typeof window !== "undefined" ? window.location.origin : "https://playstumpd.com"}/challenge`,
    ].join("\n");
  }, [iWon, isDraw, guessDiff, theirName, myBoard, isSeries, myScore, theirScore]);

  const handleWhatsAppShare = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, "_blank", "noopener");
  }, [buildShareText]);

  const markCopied = useCallback(() => {
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2500);
  }, []);

  const handleNativeShare = useCallback(async () => {
    const text = buildShareText();
    navigator.clipboard.writeText(text).catch(() => {});
    markCopied();
    try {
      await navigator.share({ text });
    } catch { /* already copied */ }
  }, [buildShareText, markCopied]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildShareText()).then(markCopied).catch(() => {});
  }, [buildShareText, markCopied]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="ch-result">
      <div className={`ch-result__banner${iWon ? " ch-result__banner--won" : isDraw ? " ch-result__banner--draw" : " ch-result__banner--lost"}`}>
        <span className="ch-result__emoji">{headingEmoji}</span>
        <div className="ch-result__banner-text">
          <h2 className="ch-result__heading">{headingText}</h2>
          <p className="ch-result__sub">{subText}</p>
        </div>
      </div>

      {isSeries && (
        <div className="ch-result__series-score">
          <div className="ch-result__series-score-side">
            <span className="ch-result__series-score-name">{myRole === "creator" ? "You" : creatorName}</span>
            <span className="ch-result__series-score-num">{creatorScore}</span>
          </div>
          <span className="ch-result__series-score-dash">—</span>
          <div className="ch-result__series-score-side">
            <span className="ch-result__series-score-num">{opponentScore}</span>
            <span className="ch-result__series-score-name">{myRole === "opponent" ? "You" : opponentName}</span>
          </div>
        </div>
      )}

      <div className="ch-result__boards-card">
        <div className="ch-result__boards">
          <BoardColumn
            name={creatorName}
            board={creatorBoard}
            isWinner={winner === "creator"}
            isDraw={isDraw}
            label={myRole === "creator" ? "You" : creatorName}
          />
          <div className="ch-result__vs">VS</div>
          <BoardColumn
            name={opponentName}
            board={opponentBoard}
            isWinner={winner === "opponent"}
            isDraw={isDraw}
            label={myRole === "opponent" ? "You" : opponentName}
          />
        </div>
      </div>

      <div className="ch-result__actions">
        <div className="ch-result__share-group">
          <button type="button" className="ch-result__btn ch-result__btn--whatsapp" onClick={handleWhatsAppShare}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>

          {canNativeShare ? (
            <button
              type="button"
              className={`ch-result__btn ch-result__btn--share${copied ? " ch-result__btn--copied" : ""}`}
              onClick={handleNativeShare}
            >
              {copied ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className={`ch-result__btn ch-result__btn--copy${copied ? " ch-result__btn--copied" : ""}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
        </div>

        {canPropose && (
          <div className="ch-result__proposal-area">
            {proposal === "idle" && (
              <div className="ch-result__series-buttons">
                <p className="ch-result__series-prompt">Want to play a series?</p>
                <div className="ch-result__series-btn-row">
                  <button
                    type="button"
                    className="ch-result__series-btn"
                    onClick={() => handlePropose(3)}
                  >
                    Best of 3
                  </button>
                  <button
                    type="button"
                    className="ch-result__series-btn"
                    onClick={() => handlePropose(5)}
                  >
                    Best of 5
                  </button>
                </div>
              </div>
            )}

            {(proposal === "proposing" || proposal === "waiting") && (
              <div className="ch-result__proposal-waiting">
                <div className="ch-lobby__pulse" />
                <p>Waiting for {theirName} to accept Best of {proposedLength}...</p>
              </div>
            )}

            {proposal === "received" && incomingProposal && (
              <div className="ch-result__proposal-received">
                <p className="ch-result__proposal-text">
                  {incomingProposal.proposerName} wants to play <strong>Best of {incomingProposal.seriesLength}</strong>
                </p>
                <div className="ch-result__proposal-btn-row">
                  <button
                    type="button"
                    className="ch-result__proposal-accept"
                    onClick={handleAccept}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="ch-result__proposal-decline"
                    onClick={handleDecline}
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {proposal === "declined" && (
              <div className="ch-result__proposal-declined">
                <p>{theirName} declined the series.</p>
              </div>
            )}
          </div>
        )}

        <button type="button" className="ch-result__home" onClick={onHome}>
          Back to Stumpd
        </button>
      </div>
    </div>
  );
}

function BoardColumn({
  name, board, isWinner, isDraw, label,
}: {
  name: string;
  board: GuessEntry[];
  isWinner: boolean;
  isDraw: boolean;
  label: string;
}) {
  return (
    <div className={`ch-result__col${isWinner && !isDraw ? " ch-result__col--winner" : ""}`}>
      <div className="ch-result__col-header">
        <span className="ch-result__col-avatar">{name.charAt(0).toUpperCase()}</span>
        <span className="ch-result__col-name">{label}</span>
        {isWinner && !isDraw && <span className="ch-result__crown">👑</span>}
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
