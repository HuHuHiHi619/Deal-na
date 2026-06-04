import { cn } from "@/app/lib/cn";
import { optionBg, optionText, type OptionColor } from "@/app/lib/optionColors";

interface VoteResultItemProps {
  title: string;
  voteCount: number;
  percentage: number;
  color: OptionColor;
}

export function VoteResultItem({
  title,
  voteCount,
  percentage,
  color,
}: VoteResultItemProps) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", optionBg[color])} />
        <p className="type-body min-w-0 flex-1 truncate font-semibold text-ink">{title}</p>
        <span className="type-caption text-muted">{percentage.toFixed(0)}%</span>
        <span className={cn("type-body font-bold tabular-nums", optionText[color])}>{voteCount}</span>
      </div>

      {/* Progress bar — h10 / r6 per spec */}
      <div className="h-2.5 w-full overflow-hidden rounded-md bg-line">
        <div
          className={cn("h-full rounded-md transition-all duration-700 ease-out", optionBg[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
