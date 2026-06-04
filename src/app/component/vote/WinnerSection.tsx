interface Winner {
  title: string;
  voteCount: number;
}

interface WinnersSectionProps {
  winners: Winner[];
  totalVotes: number;
}

export function WinnersSection({ winners, totalVotes }: WinnersSectionProps) {
  if (winners.length === 0) return null;

  const isTie = winners.length > 1;

  // Tie — no single winner card; a soft sun panel listing the deadlocked options.
  if (isTie) {
    return (
      <div className="rounded-4xl bg-sun-tint p-6 text-center">
        <p className="type-eyebrow text-ink">It&apos;s a tie</p>
        <p className="type-heading mt-2 text-ink">
          {winners.map((w) => w.title).join(" · ")}
        </p>
        <p className="type-caption mt-2 text-ink/70">
          {winners[0].voteCount} vote{winners[0].voteCount !== 1 ? "s" : ""} each — run it back to break it
        </p>
      </div>
    );
  }

  const winner = winners[0];
  const pct = totalVotes > 0 ? Math.round((winner.voteCount / totalVotes) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-4xl bg-brand-gradient p-7 text-center text-white shadow-glow-coral">
      {/* floating translucent circles */}
      <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15" />
      <span className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />

      <div className="relative">
        <p className="type-eyebrow text-white/80">The deal is</p>
        <h2 className="type-display mt-3 break-words">{winner.title}</h2>
        <p className="type-numeral mt-4">{winner.voteCount}</p>
        <p className="type-caption mt-1 text-white/85">
          out of {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · {pct}%
        </p>
      </div>
    </div>
  );
}
