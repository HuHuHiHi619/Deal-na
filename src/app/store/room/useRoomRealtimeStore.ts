import { create } from "zustand";
import { RealtimeStore } from "../option/useOptionRealtimeStore";
import { supabase } from "@/app/lib/supabase";
import { useRoomMemberStore } from "./useRoomMemberStore";

export const useRoomRealtimeStore = create<RealtimeStore>((set, get) => ({
  channel: null,
  subscribe: (roomId: string) : Promise<void> => {
    return new Promise((resolve, reject) => {
      const { addMember } = useRoomMemberStore.getState();
      const channel = supabase.channel(`room:${roomId}`)
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
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            supabase.removeChannel(channel);
            reject(new Error(`Realtime subscription failed: ${status}`));
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
