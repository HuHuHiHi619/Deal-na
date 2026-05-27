import { create } from "zustand";

interface RoomReadyStore {
  readyMembers: string[];
  totalMembers: number;
  memberNames: Map<string, string>;
  setReady: (members: string[]) => void;
  setTotalMembers: (count: number) => void;
  setMemberNames: (names: Map<string, string>) => void;
  clearReady: () => void;
}

export const useRoomReadyStore = create<RoomReadyStore>((set) => ({
  readyMembers: [],
  totalMembers: 0,
  memberNames: new Map(),

  setReady: (members) => set({ readyMembers: members }),
  setTotalMembers: (count) => set({ totalMembers: count }),
  setMemberNames: (names) => set({ memberNames: names }),
  clearReady: () => set({ readyMembers: [], totalMembers: 0, memberNames: new Map() }),
}));
