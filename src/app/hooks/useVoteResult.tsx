'use client';
import { useMemo } from "react";
import type { VoteResult } from "@/app/types";

export type { VoteResult };

interface VoteResultParams {
  voteResults: VoteResult[];
}

export const useVoteResult = ({ voteResults }: VoteResultParams) => {
  return useMemo(() => {
    const total = voteResults.reduce((acc, r) => acc + r.voteCount, 0);
    const maxVote = Math.max(...voteResults.map((v) => v.voteCount), 0);
    const winners = voteResults.filter((v) => v.voteCount === maxVote);
    const results = voteResults.map((v) => ({
      ...v,
      percentage: total > 0 ? (v.voteCount / total) * 100 : 0,
    }));

    return { results, winners, totalVotes: total };
  }, [voteResults]);
};
