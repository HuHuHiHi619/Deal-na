import { create } from "zustand";

interface RoomReadyStore {
  readyMembers: string[];
  setReady: (members: string[]) => void;
  addReady: (userId: string) => void;
  clearReady : () => void
}

export const useRoomReadyStore = create<RoomReadyStore>((set, get) => ({
  readyMembers: [],
  setReady: (members) => set({ readyMembers: members }),
  addReady: (userId) => {
    if (!get().readyMembers.includes(userId)) {
      set({ readyMembers: [...get().readyMembers, userId] });
    }
  },
  clearReady : () => set({ readyMembers : [] })
}));
