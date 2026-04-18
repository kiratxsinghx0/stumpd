"use client";
import { useState, useCallback } from "react";

type Props = {
  roomCode: string;
  creatorName: string;
};

export default function ChallengeLobby({ roomCode, creatorName }: Props) {
  const [copied, setCopied] = useState(false);

  const challengeUrl = typeof window !== "undefined"
    ? `${window.location.origin}/challenge/${roomCode}`
    : `/challenge/${roomCode}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = challengeUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [challengeUrl]);

  const handleWhatsApp = useCallback(() => {
    const text = `I challenge you to a game of Stumpd! Can you guess the cricketer before me? 🏏\n\nJoin here: ${challengeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [challengeUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Stumpd Challenge",
          text: `I challenge you to guess the cricketer first! Join my room: ${roomCode}`,
          url: challengeUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  }, [challengeUrl, roomCode, handleCopy]);

  return (
    <div className="ch-lobby">
      <div className="ch-lobby__header">
        <div className="ch-lobby__avatar">{creatorName.charAt(0).toUpperCase()}</div>
        <p className="ch-lobby__creator">{creatorName}</p>
      </div>

      <div className="ch-lobby__code-wrap">
        <p className="ch-lobby__code-label">Room Code</p>
        <div className="ch-lobby__code-tiles">
          {roomCode.split("").map((ch, i) => (
            <span key={i} className="ch-lobby__code-tile">{ch}</span>
          ))}
        </div>
      </div>

      <div className="ch-lobby__waiting">
        <div className="ch-lobby__pulse" />
        <p className="ch-lobby__waiting-text">Waiting for your friend to join...</p>
      </div>

      <div className="ch-lobby__actions">
        <button type="button" className="ch-lobby__copy-btn" onClick={handleCopy}>
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              Copy Link
            </>
          )}
        </button>

        <button type="button" className="ch-lobby__whatsapp-btn" onClick={handleWhatsApp}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 0 0 .613.613l4.458-1.495A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.22 0-4.312-.614-6.098-1.681l-.427-.262-3.294 1.103 1.103-3.294-.262-.427A9.935 9.935 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
          WhatsApp
        </button>

        <button type="button" className="ch-lobby__share-btn" onClick={handleShare}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
          Share
        </button>
      </div>
    </div>
  );
}
