import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { create } from "zustand";
import { Option, useOptionStore } from "./useOptionStore";
import { supabase } from "@/app/lib/supabase";

export interface RealtimeStore {
  channel: RealtimeChannel | null;
  subscribe: (roomId: string , userId? : string | undefined) => void;
  unsubscribe: () => void;
  sendReady?: (userId: string) => Promise<boolean>;
}

export const useOptionRealtimeStore = create<RealtimeStore>(
  (set, get) => ({
    channel: null,
    subscribe: (roomId: string) => {
      const { addOption, removeOption } = useOptionStore.getState();
      const channel = supabase
        .channel("options")
        .on<Option>(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "options",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            addOption(payload.new);
          }
        )

        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "options",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            removeOption(payload.old.id);
          }
        )
        .subscribe();
        set({ channel })
    },

    unsubscribe: () => {
      const { channel } = get()
      if (channel) supabase.removeChannel(channel);
      set({ channel: null });
    },
  })
);
