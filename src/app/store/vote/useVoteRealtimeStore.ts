import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";
import { create } from "zustand";
import { RealtimeStore } from "../option/useOptionRealtimeStore";
import { useVoteStore, Vote } from "./useVoteStore";

let activeChannel: RealtimeChannel | null = null;

export const useVoteRealtimeStore = create<RealtimeStore>((set) => ({
  subscribed: false,
  subscribe: (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const { addVote, deleteVote } = useVoteStore.getState();
      const channel = supabase
        .channel(`votes:${roomId}`)
        .on<Vote>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "votes",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            addVote(payload.new);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "votes",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            deleteVote(payload.old.id, payload.old.option_id);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            activeChannel = channel;
            set({ subscribed: true });
            resolve();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            supabase.removeChannel(channel);
            reject(new Error(`Realtime subscription failed: ${status}`));
          }
        });
    });
  },
  unsubscribe: async () => {
    if (activeChannel) {
      const ch = activeChannel;
      activeChannel = null;
      await supabase.removeChannel(ch);
    }
    set({ subscribed: false });
  },
}));
