// components/vote/VoteResultsList.tsx
import { VoteResultItem } from "./VoteResultItem";

interface VoteResult {
  title: string;
  voteCount: number;
  percentage: number;
}

interface VoteResultsListProps {
  results: VoteResult[];
  winners: { title: string; voteCount: number }[];
}

export function VoteResultsList({ results, winners }: VoteResultsListProps) {
  const winnerTitles = new Set(winners.map(w => w.title));

  return (
    <div className="space-y-4">
      {results.map((item, index) => (
        <VoteResultItem
          key={index}
          title={item.title}
          voteCount={item.voteCount}
          percentage={item.percentage}
          isWinner={winnerTitles.has(item.title)}
        />
      ))}
    </div>
  );
}