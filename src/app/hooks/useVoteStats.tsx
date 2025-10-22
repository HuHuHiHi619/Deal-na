import { useMemo } from "react"

interface UseVoteStatsProps{
    votes : any[]
    mockUserId : string
    maxVotes : number
}

export const useVoteStats = ({
    votes,
    mockUserId,
    maxVotes = 3
} : UseVoteStatsProps) => {
    return useMemo(() => {
        const votesArr = Array.isArray(votes) ? votes : []
        const myVotes = votesArr.filter((v) => v.user_id === mockUserId)
        const remainingVotes = maxVotes - myVotes.length

        return { 
            myVotes, 
            remainingVotes,
            totalVotes: votesArr.length,
            hasMaxVotes : remainingVotes <= 0 
        } 
    },[votes , mockUserId , maxVotes])
}