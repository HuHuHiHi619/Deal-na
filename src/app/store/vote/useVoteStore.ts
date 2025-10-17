import { createVote, deleteVote } from "@/app/services/votes";
import { actionWrapper } from "@/app/utils/actionWrapper";
import { create } from "zustand";
import { getVoteAPI } from "@/app/lib/voteAPI";

export interface Vote {
  id: string;
  option_id: string;
  room_id: string;
  user_id: string;
  createdBy: string;
}

export interface VoteResults {
  option_id : string;
  title : string;
  voteCount: number
}

export interface VoteState {
  votes: Vote[];
  voteResults : VoteResults[]
  setVotes: (votes: Vote[]) => void;
  
  addVote: (vote: Vote) => void;
  removeVote: (voteId: string) => void;
  clearVotes : () => void

  fetchVote: () => Promise<void>;
  createVote: (optionId : string) => Promise<void>;
  deleteVote: (voteId: string , optionid : string) => Promise<void>;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  votes: [],
  voteResults : [],
  setVotes: (votes) => set({ votes: votes }),
  
  addVote: (vote) => {
    const exist = get().votes.some((v) => v.id === vote.id);
    if (!exist) {
      set({ votes: [...get().votes, vote] });
    }
  },
  removeVote: (voteId) => {
    console.log('remove vote in store received voteId' , voteId);
    set({ votes: get().votes.filter((v) => v.id !== voteId) });
  },
  clearVotes: () => set({ votes: [] }), 

  // API
  fetchVote: async () => {
    try {
      const votes = await actionWrapper("fetchVoteLoading", {
        action: async ({ roomId }) => await getVoteAPI(roomId),
      });
      console.log('fetch vote in store sent votes' , votes);
      set({ voteResults : votes });
    } catch (error) {
      console.error(error);
    }
  },

  createVote: async (optionId) => {
    try {
      const newVote = await actionWrapper("createVoteLoading", {
        action: async ({ roomId, userId }) =>
          await createVote({ roomId, optionId, userId }),
      });
      if (newVote) get().addVote(newVote);
    } catch (error) {
      console.error(error);
    }
  },

  deleteVote: async (voteId , optionId) => {
    try{
      const success = await actionWrapper("deleteVoteLoading", {
        action: async ({ roomId, userId }) =>
          await deleteVote({ roomId, optionId, userId }),
      });
      console.log('delete vote in store sent voteId' , voteId);
      if(success) get().removeVote(voteId);
    }catch(error){
      console.error(error)
    }
  },
}));
