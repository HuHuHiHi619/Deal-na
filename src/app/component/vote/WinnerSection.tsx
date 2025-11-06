
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
    <div className="mb-8   text-center">
      <div className="inline-flex items-center justify-center mb-4 pb-4 ">
        <h3 className="text-2xl  text-rose-500 tracking-wide">
          🎉 HERE WE GO !!!
        </h3>
      </div>
      <p className="text-xl font-light text-gray-800">
       
        <span className="text-xl font-bold text-rose-400 line-clamp-2">
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