import { create } from "zustand";

interface RoomMemberStore {
    members : string[]
    addMember : (userId : string) => void
    removeMember : (userId : string) => void
    clearMembers : () => void
}

export const useRoomMemberStore = create<RoomMemberStore>((set , get) => ({
    members : [],
    addMember : (userId: string) => set({ members : [...get().members , userId ] }),
    removeMember : (userId: string) => set({ members : get().members.filter(member => member !== userId) }),
    clearMembers : () => set({ members : [] })
}))