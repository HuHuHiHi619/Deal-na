import { useMemo } from "react";
import { VoteResults } from "../store/vote/useVoteStore";

interface VoteResultProps {
    voteResults : VoteResults[]
}

export const useVoteResult = ({ voteResults } : VoteResultProps) => {
    return useMemo(() => {
        const total = voteResults.reduce((acc,sum) => acc + sum.voteCount , 0)
        const maxVote = Math.max(...voteResults.map(v => v.voteCount) , 0)
        const winnersList = voteResults.filter(v => v.voteCount === maxVote)
        const resultsPercentage = voteResults.map(v => ({
            ...v,
            percentage : (v.voteCount / total) * 100
        }))

        return {
            results : resultsPercentage,
            winners : winnersList,
            totalVotes : total
        }
    },[voteResults])
}