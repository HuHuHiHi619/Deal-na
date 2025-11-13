import { create } from "zustand";
import { RealtimeStore } from "../option/useOptionRealtimeStore";
import { supabase } from "@/app/lib/supabase";
import { useRoom } from "./useRoomStore";
import { useRoomMemberStore } from "./useRoomMemberStore";

export const useRoomRealtimeStore = create<RealtimeStore>((set, get) => ({
  channel: null,
  subscribe: (roomId: string) : Promise<void> => {
    return new Promise((resolve) => {
      
      const { createRoom } = useRoom.getState();
      const { addMember } = useRoomMemberStore.getState();
      const channel = supabase.channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          createRoom(payload.new.title, payload.new.options, payload.new.user_id);
        }
      )
      .on(
        'postgres_changes',
        {
          event : 'INSERT',
          schema : 'public',
          table : 'room_members',
          filter : `room_id=eq.${roomId}`
        },(payload) => {
          addMember(payload.new.user_id);
          
        }
      )
      .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to room:${roomId}`);
            resolve();
          }
        });
      set({ channel })
    })
    },
    unsubscribe: () => {
    const channel = get().channel;
    if (channel) supabase.removeChannel(channel);
    set({ channel: null });
  },
}));
