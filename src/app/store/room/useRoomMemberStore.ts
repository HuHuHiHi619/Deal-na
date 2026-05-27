import { create } from "zustand";

interface RoomMemberStore {
    members: string[]
    setMembers: (members: string[]) => void
    clearMembers: () => void
}

export const useRoomMemberStore = create<RoomMemberStore>((set) => ({
    members: [],
    setMembers: (members: string[]) => set({ members }),
    clearMembers: () => set({ members: [] })
}))
