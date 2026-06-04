import { VoteResultItem } from "./VoteResultItem";
import { optionColorAt, type OptionColor } from "@/app/lib/optionColors";

interface VoteResult {
  optionId: string;
  title: string;
  voteCount: number;
  percentage: number;
}

interface VoteResultsListProps {
  results: VoteResult[];
  /** option id → slot color, so a row keeps its color from Create → Vote → Results */
  colorByOptionId: Record<string, OptionColor>;
}

export function VoteResultsList({ results, colorByOptionId }: VoteResultsListProps) {
  return (
    <section className="flex flex-col gap-2.5">
      <p className="type-eyebrow px-1 text-muted">Full breakdown</p>
      {results.map((item, index) => (
        <VoteResultItem
          key={item.optionId ?? index}
          title={item.title}
          voteCount={item.voteCount}
          percentage={item.percentage}
          color={colorByOptionId[item.optionId] ?? optionColorAt(index)}
        />
      ))}
    </section>
  );
}
