// components/vote/VoteResultItem.tsx
interface VoteResultItemProps {
  title: string;
  voteCount: number;
  percentage: number;
  isWinner?: boolean;
}

export function VoteResultItem({ 
  title, 
  voteCount, 
  percentage, 
  isWinner = false 
}: VoteResultItemProps) {
  return (
    <div className="backdrop-blur-md bg-gradient-to-br from-white/60 to-lavender-50/50 border border-white/40 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-gray-800 text-lg">{title}</p>
        <div className="flex items-center space-x-3">
          <span className="bg-rose-100/60 text-rose-600 px-2.5 py-1 rounded-lg text-sm font-medium shadow-inner">
            {voteCount} votes
          </span>
          <span className="bg-lavender-100/60 text-indigo-600 px-2.5 py-1 rounded-lg text-sm font-medium shadow-inner">
            {percentage.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/30 backdrop-blur-sm rounded-full h-2.5 overflow-hidden border border-white/30 shadow-inner">
        <div
          className="bg-gradient-to-r from-rose-400 to-pink-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage.toFixed(2)}%` }}
        ></div>
      </div>
    </div>
  );
}