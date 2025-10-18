"use client";
import ExitRoomButton from "@/app/component/ExitRoomButton";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import React, { useEffect, useMemo } from "react";

function page() {
  const { voteResults, fetchVote } = useVoteStore();
  useEffect(() => {
    fetchVote();
  }, [fetchVote]);
  {
    /* รอแก้ user 2 ไม่ไปหน้า result  */
  }
  const { results, winners, totalVotes } = useMemo(() => {
    const total = voteResults.reduce((acc, sum) => acc + sum.voteCount, 0);
    const maxVote = Math.max(...voteResults.map((r) => r.voteCount), 0);
    const winnersList = voteResults.filter((v) => v.voteCount === maxVote);
    const resultsPercentage = voteResults.map((v) => {
      return {
        ...v,
        percentage: (v.voteCount / total) * 100,
      };
    });

    return {
      results: resultsPercentage,
      winners: winnersList,
      totalVotes: total,
    };
  }, [voteResults]);

  return (
    <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/30 border border-white/30 shadow-md hover:shadow-lg transition-all duration-500">
      {/* Winners Section */}
      {winners.length > 0 && (
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-3">
            <h3 className="text-lg font-semibold text-rose-500 tracking-wide">
              🎉 Congratulations!
            </h3>
          </div>
          <p className="text-xl font-light text-gray-800">
            WINNER{winners.length > 1 ? "S" : ""}:{" "}
            <span className="font-medium text-rose-600/90">
              {winners.map((w, index) => (
                <span key={index}>
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
        {results.map((item, index) => (
          <div
            key={index}
            className="backdrop-blur-md bg-gradient-to-br from-white/60 to-lavender-50/50 border border-white/40 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-gray-800 text-lg">{item.title}</p>
              <div className="flex items-center space-x-3">
                <span className="bg-rose-100/60 text-rose-600 px-2.5 py-1 rounded-lg text-sm font-medium shadow-inner">
                  {item.voteCount} votes
                </span>
                <span className="bg-lavender-100/60 text-indigo-600 px-2.5 py-1 rounded-lg text-sm font-medium shadow-inner">
                  {item.percentage.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/30 backdrop-blur-sm rounded-full h-2.5 overflow-hidden border border-white/30 shadow-inner">
              <div
                className="bg-gradient-to-r from-rose-400 to-pink-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${item.percentage.toFixed(2)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Exit Button */}
      <div className="mt-10 pt-6 border-t border-white/30">
        <ExitRoomButton />
      </div>
    </div>
  );
}

export default page;
