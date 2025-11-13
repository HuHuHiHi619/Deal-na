import { supabase } from "@/app/lib/supabase";

import { create } from "zustand";
import { RealtimeStore } from "../option/useOptionRealtimeStore";
import { useVoteStore, Vote } from "./useVoteStore";

export const useVoteRealtimeStore = create<RealtimeStore>((set, get) => ({
  channel: null,
  subscribe: (roomId: string): Promise<void> => {
    return new Promise((resolve) => {
      const { addVote, deleteVote } = useVoteStore.getState();
      const channel = supabase
        .channel("votes")
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
            console.log(`✅ Subscribed to vote:${roomId}`);
            resolve();
          }
        });
      set({ channel });
    });
  },
  unsubscribe: () => {
    const { channel } = get();
    if (channel) supabase.removeChannel(channel);
    set({ channel: null });
  },
}));
