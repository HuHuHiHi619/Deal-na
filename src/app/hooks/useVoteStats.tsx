'use client';
import { useMemo } from "react";
import type { Vote } from "@/app/types";

interface VoteStatsParams {
  votes: Vote[] | undefined;
  userId: string;
  maxVotes?: number;
}

export const useVoteStats = ({ votes, userId, maxVotes = 3 }: VoteStatsParams) => {
  return useMemo(() => {
    const votesArr = Array.isArray(votes) ? votes : [];
    const myVotes = votesArr.filter((v) => v.user_id === userId);
    const remainingVotes = maxVotes - myVotes.length;

    return {
      myVotes,
      remainingVotes,
      totalVotes: votesArr.length,
      hasMaxVotes: remainingVotes <= 0,
    };
  }, [votes, userId, maxVotes]);
};
