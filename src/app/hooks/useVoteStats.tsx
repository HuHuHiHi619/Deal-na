'use client';
import { useMemo } from "react"
import { Vote } from "../store/vote/useVoteStore";

interface UseVoteStatsProps{
    votes : Vote[]
    userId : string
    maxVotes : number
}

export const useVoteStats = ({
    votes,
    userId,
    maxVotes = 3
} : UseVoteStatsProps) => {
    return useMemo(() => {
        const votesArr = Array.isArray(votes) ? votes : []
        const myVotes = votesArr.filter((v) => v.user_id === userId)
        const remainingVotes = maxVotes - myVotes.length

        return { 
            myVotes, 
            remainingVotes,
            totalVotes: votesArr.length,
            hasMaxVotes : remainingVotes <= 0 
        } 
    },[votes , userId , maxVotes])
}