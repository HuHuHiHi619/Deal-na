"use client";
import ExitRoomButton from "@/app/component/button/ExitRoomButton";
import LogoutButton from "@/app/component/button/LogoutButton";
import { VoteResultsList } from "@/app/component/vote/VoteResultList";
import { WinnersSection } from "@/app/component/vote/WinnerSection";
import { useVoteResult } from "@/app/hooks/useVoteResult";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useUiStore } from "@/app/store/useUiStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import { AppWindow } from "lucide-react";
import React, { useEffect } from "react";

function Page() {
  const { voteResults, fetchVote } = useVoteStore();
  const { currentRoom } = useRoom();
  const { setLoading } = useUiStore();

  useEffect(() => {
    setLoading("resultLoading", false);
    console.log("resultloading false");
  }, [setLoading]);

  useEffect(() => {
    fetchVote();
  }, [fetchVote]);

  const { winners, results, totalVotes } = useVoteResult({ voteResults });

  return (
    <div className="">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-rose-300 to-rose-800 backdrop-blur-md ring-offset-4 ring-4 ring-rose-400 shadow-sm">
        <div className="max-w-4xl flex items-center gap-4 mx-auto px-4 py-4 text-2xl font-semibold text-white tracking-wide">
          <AppWindow size={30} />
          <h1 className="">Topic : {currentRoom?.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <WinnersSection winners={winners} />

        <VoteResultsList results={results} winners={winners} />

        {/* Total Votes Display (Optional) */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Total Votes:{" "}
            <span className="font-medium text-indigo-600">{totalVotes}</span>
          </p>
        </div>

        {/* Exit Button */}
        <div className="mt-10 pt-6 border-t border-white/30">
          <ExitRoomButton />
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}

export default Page;
