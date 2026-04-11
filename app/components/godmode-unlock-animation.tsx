"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

type Props = {
  show: boolean;
  colorFlood: boolean;
  onComplete: () => void;
  /** Fires midway through flood — apply the dark theme here so dissolve reveals it seamlessly. */
  onFloodPeak?: () => void;
  /** "unlock" = full card slam + flood; "reentry" = shorter flood-only transition. */
  variant?: "unlock" | "reentry";
};

interface Spark {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface Ring {
  id: number;
  delay: number;
  hue: number;
}

interface Mote {
  id: number;
  left: number;
  bottom: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
}

function generateSparks(count: number): Spark[] {
  const sparks: Spark[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const dist = 120 + Math.random() * 200;
    sparks.push({
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 0.3,
      duration: 0.6 + Math.random() * 0.6,
    });
  }
  return sparks;
}

function generateRings(count: number): Ring[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: i * 0.18,
    hue: 38 + i * 6,
  }));
}

function generateMotes(count: number): Mote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    bottom: Math.random() * 40,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 1.6,
    duration: 1.8 + Math.random() * 1.4,
    drift: (Math.random() - 0.5) * 60,
  }));
}

const PHASE1_DURATION = 1800;
const PHASE_PAUSE = 800;
const PHASE2_DURATION = 2000;
const FLOOD_PEAK_AT = 900;
const PHASE3_DURATION = 800;

const RE_SLAM_DURATION = 600;
const RE_HOLD_DURATION = 400;
const RE_FLOOD_DURATION = 1000;
const RE_FLOOD_PEAK_AT = 500;
const RE_DISSOLVE_DURATION = 500;

export default function GodmodeUnlockAnimation({ show, colorFlood, onComplete, onFloodPeak, variant = "unlock" }: Props) {
  const [phase, setPhase] = useState<"idle" | "slam" | "pause" | "flood" | "dissolve">("idle");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sparks = useMemo(() => generateSparks(36), []);
  const rings = useMemo(() => generateRings(6), []);
  const motes = useMemo(() => generateMotes(20), []);
  const floodPeakFired = useRef(false);

  const onCompleteRef = useRef(onComplete);
  const onFloodPeakRef = useRef(onFloodPeak);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onFloodPeakRef.current = onFloodPeak; }, [onFloodPeak]);

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
    if (!show) {
      setPhase("idle");
      floodPeakFired.current = false;
      return;
    }

    if (variant === "reentry") {
      setPhase("slam");

      schedule(() => {
        setPhase("pause");

        schedule(() => {
          setPhase("flood");

          schedule(() => {
            if (!floodPeakFired.current) {
              floodPeakFired.current = true;
              onFloodPeakRef.current?.();
            }
          }, RE_FLOOD_PEAK_AT);

          schedule(() => {
            setPhase("dissolve");
            schedule(() => {
              onCompleteRef.current();
            }, RE_DISSOLVE_DURATION);
          }, RE_FLOOD_DURATION);
        }, RE_HOLD_DURATION);
      }, RE_SLAM_DURATION);
    } else {
      setPhase("slam");

      schedule(() => {
        setPhase("pause");

        schedule(() => {
          if (colorFlood) {
            setPhase("flood");

            schedule(() => {
              if (!floodPeakFired.current) {
                floodPeakFired.current = true;
                onFloodPeakRef.current?.();
              }
            }, FLOOD_PEAK_AT);

            schedule(() => {
              setPhase("dissolve");
              schedule(() => {
                onCompleteRef.current();
              }, PHASE3_DURATION);
            }, PHASE2_DURATION);
          } else {
            setPhase("dissolve");
            schedule(() => {
              onCompleteRef.current();
            }, PHASE3_DURATION);
          }
        }, PHASE_PAUSE);
      }, PHASE1_DURATION);
    }

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, colorFlood, variant, schedule, clearTimers]);

  if (!show && phase === "idle") return null;

  const isReentry = variant === "reentry";
  const showReentryCard = isReentry && (phase === "slam" || phase === "pause" || phase === "flood");
  const showCard = !isReentry && (phase === "slam" || phase === "pause" || phase === "flood");
  const showSparks = !isReentry && phase === "slam";
  const showFlood = phase === "flood" && (colorFlood || isReentry);
  const showDissolve = phase === "dissolve";

  return (
    <div
      className={`gmu-overlay${isReentry ? " gmu-overlay--reentry" : ""}${showFlood ? " gmu-overlay--flooding" : ""}${showDissolve ? " gmu-overlay--dissolve" : ""}`}
    >
      {/* Cinematic vignette */}
      <div className="gmu-vignette" />

      {/* Screen shake wrapper */}
      <div className={`gmu-shaker${phase === "slam" && !isReentry ? " gmu-shaker--active" : ""}`}>

        {/* Light burst behind card on slam */}
        {showSparks && <div className="gmu-light-burst" />}

        {/* Particle sparks */}
        {showSparks && sparks.map((s) => (
          <div
            key={s.id}
            className="gmu-spark"
            style={{
              "--spark-x": `${s.x}px`,
              "--spark-y": `${s.y}px`,
              "--spark-size": `${s.size}px`,
              "--spark-delay": `${s.delay}s`,
              "--spark-duration": `${s.duration}s`,
            } as React.CSSProperties}
          />
        ))}

        {/* Secondary spark trails */}
        {showSparks && sparks.filter((_, i) => i % 3 === 0).map((s) => (
          <div
            key={`trail-${s.id}`}
            className="gmu-spark gmu-spark--trail"
            style={{
              "--spark-x": `${s.x * 0.6}px`,
              "--spark-y": `${s.y * 0.6}px`,
              "--spark-size": `${s.size * 0.6}px`,
              "--spark-delay": `${s.delay + 0.15}s`,
              "--spark-duration": `${s.duration * 0.8}s`,
            } as React.CSSProperties}
          />
        ))}

        {/* Unlock card (first-time win) */}
        {(showCard || (showDissolve && !isReentry)) && (
          <div className={`gmu-card${phase === "slam" ? " gmu-card--slam" : ""}${phase === "pause" ? " gmu-card--pulse" : ""}${phase === "flood" ? " gmu-card--shrink" : ""}${showDissolve ? " gmu-card--dissolve" : ""}`}>
            <div className="gmu-card__glow" />
            <div className="gmu-card__inner">
              <div className="gmu-card__crown-wrap">
                <span className="gmu-card__crown">&#128081;</span>
              </div>
              <h2 className="gmu-card__title">GODMODE</h2>
              <div className="gmu-card__divider" />
              <p className="gmu-card__subtitle">UNLOCKED</p>
              <div className="gmu-card__stars">
                <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
              </div>
            </div>
            <div className="gmu-card__border-glow" />
          </div>
        )}

        {/* Reentry card (returning to godmode) */}
        {(showReentryCard || (showDissolve && isReentry)) && (
          <div className={`gmu-card gmu-card--re${phase === "slam" ? " gmu-card--re-slam" : ""}${phase === "pause" ? " gmu-card--re-pulse" : ""}${phase === "flood" ? " gmu-card--re-shrink" : ""}${showDissolve ? " gmu-card--re-dissolve" : ""}`}>
            <div className="gmu-card__glow" />
            <div className="gmu-card__inner">
              <p className="gmu-card__re-entering">ENTERING</p>
              <h2 className="gmu-card__title">GODMODE</h2>
              <div className="gmu-card__divider" />
              <div className="gmu-card__re-bolt">&#9889;</div>
            </div>
            <div className="gmu-card__border-glow" />
          </div>
        )}

        {/* Shockwave ring on flood start */}
        {showFlood && <div className="gmu-shockwave" />}

        {/* Color flood rings */}
        {showFlood && rings.map((r) => (
          <div
            key={r.id}
            className="gmu-flood-ring"
            style={{
              "--ring-delay": `${r.delay}s`,
              "--ring-hue": `${r.hue}`,
            } as React.CSSProperties}
          />
        ))}

        {/* Floating motes during flood */}
        {showFlood && motes.map((m) => (
          <div
            key={`mote-${m.id}`}
            className="gmu-mote"
            style={{
              "--mote-left": `${m.left}%`,
              "--mote-bottom": `${m.bottom}%`,
              "--mote-size": `${m.size}px`,
              "--mote-delay": `${m.delay}s`,
              "--mote-duration": `${m.duration}s`,
              "--mote-drift": `${m.drift}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Full-screen color wash */}
        {showFlood && <div className="gmu-color-wash" />}
      </div>
    </div>
  );
}
