'use client'
import ExitRoomButton from "@/app/component/ExitRoomButton";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import React, { useEffect, useMemo } from "react";

function page() {
  const { fetchOption, options } = useOptionStore();
  const { fetchVote, votes } = useVoteStore();

  const totalVotes = votes.length;

  const result = useMemo(() => {
    return options.map((option) => {
      const count = votes.filter((v) => v.option_id === option.id).length;
      const percentage = totalVotes === 0 ? 0 : (count / totalVotes) * 100;
      return { ...option, count, percentage };
    });
  }, [options, votes]);

  const maxVote = Math.max(...result.map((r) => r.count));
  const winners = result.filter((r) => r.count === maxVote);
  useEffect(() => {
    console.log(winners)
  },[])
  return (
   <div className="p-6 bg-gradient-to-br from-rose-50 to-lavender-50 rounded-2xl shadow-sm">
  {/* Winners Section */}
  {winners.length > 0 && (
    <div className="mb-8 text-center">
      <div className="inline-flex items-center justify-center mb-3">
        <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse mr-2"></div>
        <h3 className="text-lg font-medium text-rose-700">Congratulations!</h3>
        <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse ml-2"></div>
      </div>
      <p className="text-xl font-light text-gray-700">
        WINNER{winners.length > 1 ? 'S' : ''}:{" "}
        <span className="font-medium text-rose-600">
          {winners.map((w, index) => (
            <span key={w.id}>
              {w.title}
              {index < winners.length - 1 ? ", " : ""}
            </span>
          ))}
        </span>
      </p>
    </div>
  )}

  {/* Results List */}
  <div className="space-y-4">
    {result.map((item) => (
      <div 
        key={item.id} 
        className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-gray-700 text-lg">{item.title}</p>
          <div className="flex items-center space-x-3">
            <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded-lg text-sm font-medium">
              {item.count} votes
            </span>
            <span className="bg-lavender-100 text-lavender-700 px-2 py-1 rounded-lg text-sm font-medium">
              {item.percentage}%
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-rose-400 to-pink-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${item.percentage}%` }}
          ></div>
        </div>
      </div>
    ))}
  </div>

  {/* Exit Button */}
  <div className="mt-8 pt-6 border-t border-gray-200/50">
    <ExitRoomButton />
  </div>
</div>
  );
}

export default page;
