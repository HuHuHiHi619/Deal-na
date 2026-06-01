export interface Room {
  id: string
  room_code: string
  title: string
  status: string | null
  created_at: string
  expired_at: string | null
  created_by: string
  started_at: string | null
  url?: string
}

export interface Option {
  id: string
  title: string
  user_id: string
}

export interface Vote {
  id: string
  option_id: string
  room_id: string
  user_id: string
}

export interface VoteResult {
  optionId: string
  title: string
  voteCount: number
}

export interface VotesQueryData {
  votes: Vote[]
  formattedResult: VoteResult[]
}
