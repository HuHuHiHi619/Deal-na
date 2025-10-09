import { create } from "zustand";

interface RoomMemberStore {
    member : string[]
    setMember : (member : string[]) => void
    addMember : (userId : string) => void
}

export const useRoomMemberStore = create<RoomMemberStore>((set , get) => ({
    member : [],

    setMember : (member) => set({member}),
    addMember : (userId: string) => set({ member : [...get().member , userId ] })
    
}))