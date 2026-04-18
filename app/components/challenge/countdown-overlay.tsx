"use client";
import { useState, useEffect } from "react";

type Props = {
  seconds: number;
  onComplete: () => void;
};

export default function CountdownOverlay({ seconds, onComplete }: Props) {
  const [count, setCount] = useState(seconds);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (count <= 0) {
      setExiting(true);
      const t = setTimeout(onComplete, 400);
      return () => clearTimeout(t);
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, onComplete]);

  return (
    <div className={`ch-countdown${exiting ? " ch-countdown--exit" : ""}`}>
      <div className="ch-countdown__circle">
        <span className="ch-countdown__number" key={count}>
          {count > 0 ? count : "GO!"}
        </span>
      </div>
      <p className="ch-countdown__label">
        {count > 0 ? "Get Ready..." : ""}
      </p>
    </div>
  );
}
