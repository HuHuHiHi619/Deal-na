import { actionWrapper } from "@/app/utils/actionWrapper";
import { create } from "zustand";
import { getVoteAPI } from "@/app/lib/voteAPI";
import { useUiStore } from "../useUiStore";

export interface Vote {
  id: string;
  option_id: string;
  room_id: string;
  user_id: string;
  createdBy: string;
}

export interface VoteResults {
  option_id: string;
  title: string;
  voteCount: number;
}

export interface VoteState {
  votes: Vote[];
  voteResults: VoteResults[];
  setVotes: (votes: Vote[]) => void;

  addVote: (vote: Vote) => void;
  removeVote: (voteId: string) => void;
  clearVotes: () => void;

  fetchVote: () => Promise<void>;
  createVote: (optionId: string) => Promise<void>;
  deleteVote: (voteId: string, optionid: string) => Promise<void>;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  votes: [],
  voteResults: [],
  setVotes: (votes) => set({ votes }),

  addVote: (vote) => {
    const exist = get().votes.some((v) => v.id === vote.id);
    if (!exist) {
      set({ votes: [...get().votes, vote] });
    }
  },
  removeVote: (voteId) => {
    set({ votes: get().votes.filter((v) => v.id !== voteId) });
  },
  clearVotes: () => set({ votes: [] }),

  // API
  fetchVote: async () => {
    const votes = await actionWrapper("fetchVoteLoading", {
      action: async ({ roomId, token }) => await getVoteAPI(roomId, token),
    });
    set({ voteResults: votes });
  },

  createVote: async (optionId) => {
    const newVote = await actionWrapper("createVoteLoading", {
      action: async ({ roomId, token }) => {
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, optionId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { vote } = await res.json();
        return vote;
      },
    });
    if (newVote) {
      useUiStore.getState().setError("sendReady", null);
      get().addVote(newVote);
      await get().fetchVote();
    }
  },

  deleteVote: async (voteId, optionId) => {
    const success = await actionWrapper("deleteVoteLoading", {
      action: async ({ roomId, token }) => {
        const res = await fetch('/api/vote', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, optionId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      },
    });
    if (success) {
      get().removeVote(voteId);
      await get().fetchVote();
    }
  },
}));
