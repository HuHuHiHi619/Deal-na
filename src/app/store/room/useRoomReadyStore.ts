import { create } from "zustand";

interface RoomReadyStore {
  readyMembers: string[];
  totalMembers: number;
  setReady: (members: string[]) => void;
  addReady: (userId: string) => void;
  setTotalMembers : (count : number) => void
  clearReady : () => void
}

export const useRoomReadyStore = create<RoomReadyStore>((set, get) => ({
  readyMembers: [],
  totalMembers : 0,

  setReady: (members) => set({ readyMembers: members }),
  addReady: (userId) => {
    if (!get().readyMembers.includes(userId)) {
      set({ readyMembers: [...get().readyMembers, userId] });
    }
  },

  setTotalMembers : (count) => set({ totalMembers : count }),

  clearReady : () => set({ readyMembers : [] , totalMembers : 0 })
}));
