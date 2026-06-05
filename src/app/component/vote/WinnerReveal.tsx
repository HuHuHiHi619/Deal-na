"use client";
import { useEffect, useRef, useState } from "react";

interface Winner {
  title: string;
  voteCount: number;
}

interface WinnerRevealProps {
  winners: Winner[];
  totalVotes: number;
  /** called once the overlay has finished fading out */
  onDone: () => void;
}

const HOLD_MS = 2500;

/**
 * Full-screen "gift" reveal over a dark, blurred backdrop. The dark scrim shows
 * instantly (no fade-in, so the results never peek through) while the card pops;
 * after a hold it fades out to reveal the results page underneath. Tap anywhere
 * to skip to the fade-out. Rendered only when motion is allowed and the gift
 * hasn't shown yet (the parent gates that), so it assumes it should always play.
 */
export default function WinnerReveal({ winners, totalVotes, onDone }: WinnerRevealProps) {
  const [leaving, setLeaving] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    holdTimer.current = setTimeout(() => setLeaving(true), HOLD_MS);
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  const skip = () => {
    if (leaving) return;
    if (holdTimer.current) clearTimeout(holdTimer.current); // don't double-trigger leave
    setLeaving(true);
  };

  const handleTransitionEnd = () => {
    if (leaving) onDone();
  };

  const isTie = winners.length > 1;
  const winner = winners[0];
  const pct =
    !isTie && winner && totalVotes > 0
      ? Math.round((winner.voteCount / totalVotes) * 100)
      : 0;

  return (
    <div
      onClick={skip}
      onTransitionEnd={handleTransitionEnd}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-scrim px-6 backdrop-blur-lg transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {isTie ? (
        <div className="animate-gift-card w-full max-w-sm rounded-4xl bg-sun-tint p-8 text-center">
          <p className="type-eyebrow text-ink">It&apos;s a tie</p>
          <p className="type-heading mt-3 text-ink">
            {winners.map((w) => w.title).join(" · ")}
          </p>
          <p className="type-caption mt-3 text-ink/70">
            {winners[0].voteCount} vote{winners[0].voteCount !== 1 ? "s" : ""} each — run it back to break it
          </p>
        </div>
      ) : (
        <div className="animate-gift-card relative w-full max-w-sm overflow-hidden rounded-4xl bg-brand-gradient p-9 text-center text-white shadow-glow-coral">
          <span className="gift-shine" />
          <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15" />
          <span className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative">
            <p className="type-eyebrow text-white/80">The deal is</p>
            <h2 className="type-display mt-3 break-words">{winner?.title}</h2>
            <p className="type-numeral mt-4 tabular-nums">{winner?.voteCount}</p>
            <p className="type-caption mt-1 text-white/85">
              out of {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · {pct}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
