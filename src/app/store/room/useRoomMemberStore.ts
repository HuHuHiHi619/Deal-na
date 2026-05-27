import { create } from "zustand";

interface RoomMemberStore {
    members : string[]
    setMembers : (members: string[]) => void
    addMember : (userId : string) => void
    removeMember : (userId : string) => void
    clearMembers : () => void
}

export const useRoomMemberStore = create<RoomMemberStore>((set , get) => ({
    members : [],
    setMembers : (members: string[]) => set({ members }),
    addMember : (userId: string) => {
        const { members } = get();
        if (members.includes(userId)) return;
        set({ members: [...members, userId] });
    },
    removeMember : (userId: string) => set({ members : get().members.filter(member => member !== userId) }),
    clearMembers : () => set({ members : [] })
}))