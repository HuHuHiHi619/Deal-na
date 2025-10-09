import { create } from "zustand";
import { RealtimeStore } from "../option/useOptionRealtimeStore";
import { supabase } from "@/app/lib/supabase";
import { useRoom } from "./useRoomStore";

export const useRoomRealtimeStore = create<RealtimeStore>((set, get) => ({
  channel: null,
  subscribe: (roomId: string) => {
    const { createRoom, joinRoom } = useRoom.getState();
    const channel = supabase.channel("rooms")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "rooms",
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
            joinRoom(payload.new.room_code, payload.new.user_id);
        }
    )
    .subscribe()
    set({ channel })
  },
  unsubscribe: () => {
    const channel = get().channel;
    if (channel) supabase.removeChannel(channel);
    set({ channel: null });
  },
}));
