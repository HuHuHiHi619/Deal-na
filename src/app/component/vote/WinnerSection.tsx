
interface Winner {
  title: string;
  voteCount: number;
}

interface WinnersSectionProps {
  winners: Winner[];
}

export function WinnersSection({ winners }: WinnersSectionProps) {
  if (winners.length === 0) return null;

  return (
    <div className="mb-8 text-center">
      <div className="inline-flex items-center justify-center mb-3">
        <h3 className="text-lg font-semibold text-rose-500 tracking-wide">
          🎉 Congratulations!
        </h3>
      </div>
      <p className="text-xl font-light text-gray-800">
        WINNER{winners.length > 1 ? "S" : ""}:{" "}
        <span className="font-medium text-rose-600/90 line-clamp-2">
          {winners.map((w, index) => (
            <span key={index} className="line-clamp-2">
              {w.title}
              {index < winners.length - 1 ? ", " : ""}
            </span>
          ))}
        </span>
      </p>
    </div>
  );
}