"use client";
import { useMemo } from "react";
import type { GuessEntry } from "../../services/challenge-api";

const STATUS_COLOR: Record<string, string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent: "#787c7e",
};

type Props = {
  winner: "creator" | "opponent" | "draw";
  myRole: "creator" | "opponent";
  answer: string;
  fullName: string;
  creatorName: string;
  opponentName: string;
  creatorBoard: GuessEntry[];
  opponentBoard: GuessEntry[];
  onRematch: () => void;
  onShare: () => void;
  onHome: () => void;
};

export default function ChallengeResult({
  winner, myRole, answer, fullName,
  creatorName, opponentName,
  creatorBoard, opponentBoard,
  onRematch, onShare, onHome,
}: Props) {
  const iWon = winner === myRole;
  const isDraw = winner === "draw";

  const headingText = useMemo(() => {
    if (isDraw) return "It's a Draw!";
    return iWon ? "You Won!" : "You Lost";
  }, [isDraw, iWon]);

  const headingEmoji = useMemo(() => {
    if (isDraw) return "🤝";
    return iWon ? "🏆" : "😢";
  }, [isDraw, iWon]);

  return (
    <div className="ch-result">
      <div className={`ch-result__banner${iWon ? " ch-result__banner--won" : isDraw ? " ch-result__banner--draw" : " ch-result__banner--lost"}`}>
        <span className="ch-result__emoji">{headingEmoji}</span>
        <h2 className="ch-result__heading">{headingText}</h2>
        <p className="ch-result__answer">
          The answer was <strong>{fullName}</strong> ({answer.toUpperCase()})
        </p>
      </div>

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

      <div className="ch-result__actions">
        <button type="button" className="ch-result__rematch" onClick={onRematch}>
          Rematch
        </button>
        <button type="button" className="ch-result__share" onClick={onShare}>
          Share Result
        </button>
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
