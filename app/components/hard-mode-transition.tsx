"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";

type Props = {
  active: boolean;
  originX: number;
  originY: number;
  onMidpoint: () => void;
  onComplete: () => void;
};

interface Ember {
  id: number;
  angle: number;
  dist: number;
  size: number;
  delay: number;
  duration: number;
  hue: number;
}

function generateEmbers(count: number): Ember[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6,
    dist: 60 + Math.random() * 160,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 0.6,
    duration: 0.6 + Math.random() * 0.8,
    hue: 30 + Math.random() * 20,
  }));
}

const EXPAND_DURATION = 1200;
const MIDPOINT_AT = 600;
const HOLD_DURATION = 500;
const DISSOLVE_DURATION = 500;

export default function HardModeTransition({
  active,
  originX,
  originY,
  onMidpoint,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<"idle" | "expanding" | "hold" | "dissolve">("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const midpointFired = useRef(false);
  const embers = useMemo(() => generateEmbers(20), []);

  const onMidpointRef = useRef(onMidpoint);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onMidpointRef.current = onMidpoint; }, [onMidpoint]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      midpointFired.current = false;
      return;
    }

    setPhase("expanding");

    schedule(() => {
      if (!midpointFired.current) {
        midpointFired.current = true;
        onMidpointRef.current();
      }
    }, MIDPOINT_AT);

    schedule(() => {
      setPhase("hold");

      schedule(() => {
        setPhase("dissolve");

        schedule(() => {
          onCompleteRef.current();
        }, DISSOLVE_DURATION);
      }, HOLD_DURATION);
    }, EXPAND_DURATION);

    return clearTimers;
  }, [active, schedule, clearTimers]);

  if (!active && phase === "idle") return null;

  const isExpanding = phase === "expanding";
  const isHold = phase === "hold";
  const isDissolve = phase === "dissolve";
  const embersVisible = isExpanding;

  return (
    <div
      className={`hmt-overlay${isDissolve ? " hmt-overlay--dissolve" : ""}`}
    >
      {/* Dark ink wash — uses clip-path for GPU-accelerated expansion */}
      <div
        className={`hmt-ink${isExpanding ? " hmt-ink--expanding" : ""}${isHold ? " hmt-ink--full" : ""}${isDissolve ? " hmt-ink--full" : ""}`}
        style={{
          "--hmt-ox": `${originX}px`,
          "--hmt-oy": `${originY}px`,
        } as React.CSSProperties}
      />

      {/* Soft amber glow at the expanding edge */}
      {isExpanding && (
        <div
          className="hmt-edge-glow"
          style={{
            "--hmt-ox": `${originX}px`,
            "--hmt-oy": `${originY}px`,
          } as React.CSSProperties}
        />
      )}

      {/* Flash burst at origin */}
      {isExpanding && (
        <div
          className="hmt-flash"
          style={{ left: `${originX}px`, top: `${originY}px` }}
        />
      )}

      {/* Ember particles — always mounted, visibility controlled via CSS */}
      {embers.map((e) => (
        <div
          key={e.id}
          className={`hmt-ember${embersVisible ? " hmt-ember--active" : ""}`}
          style={{
            "--e-x": `${Math.cos(e.angle) * e.dist}px`,
            "--e-y": `${Math.sin(e.angle) * e.dist}px`,
            "--e-sz": `${e.size}px`,
            "--e-del": `${e.delay}s`,
            "--e-dur": `${e.duration}s`,
            "--e-hue": `${e.hue}`,
            left: `${originX}px`,
            top: `${originY}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* "HARD MODE" text */}
      <div className={`hmt-text${isHold ? " hmt-text--visible" : ""}`}>
        <span className="hmt-text__icon">&#9876;</span>
        <span className="hmt-text__label">HARD MODE</span>
      </div>
    </div>
  );
}
