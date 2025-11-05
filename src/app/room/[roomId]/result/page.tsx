"use client";
import ExitRoomButton from "@/app/component/button/ExitRoomButton";
import LogoutButton from "@/app/component/button/LogoutButton";
import { VoteResultsList } from "@/app/component/vote/VoteResultList";
import { WinnersSection } from "@/app/component/vote/WinnerSection";
import { useVoteResult } from "@/app/hooks/useVoteResult";
import { useUiStore } from "@/app/store/useUiStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import React, { useEffect } from "react";

function page() {
  const { voteResults, fetchVote } = useVoteStore();
  const { setLoading } = useUiStore()
  
  useEffect(() => {
    setLoading('resultLoading', false);
    console.log('resultloading false');
  }, [setLoading]);
  
  useEffect(() => { 
    fetchVote();
  }, [fetchVote]);
  
  const { winners , results , totalVotes } = useVoteResult({voteResults})

  return (
    <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/30 border border-white/30 shadow-md hover:shadow-lg transition-all duration-500">
      {/* Winners Section */}
      <WinnersSection winners={winners} />

      {/* Results List */}
      <VoteResultsList results={results} winners={winners} />

      {/* Total Votes Display (Optional) */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          Total Votes: <span className="font-medium text-indigo-600">{totalVotes}</span>
        </p>
      </div>

      {/* Exit Button */}
      <div className="mt-10 pt-6 border-t border-white/30">
        <ExitRoomButton />
        <LogoutButton />
      </div>
    </div>
  );
}

export default page;
