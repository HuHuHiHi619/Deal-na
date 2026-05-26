import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { Option, useOptionStore } from "./useOptionStore";
import { supabase } from "@/app/lib/supabase";

export interface RealtimeStore {
  subscribed: boolean;
  subscribe: (roomId: string, userId?: string, name?: string) => void;
  unsubscribe: () => void;
  sendReady?: (userId: string, name?: string) => Promise<boolean>;
}

let activeChannel: RealtimeChannel | null = null;

export const useOptionRealtimeStore = create<RealtimeStore>(
  (set) => ({
    subscribed: false,
    subscribe: (roomId: string) : Promise<void> => {
      return new Promise((resolve, reject) => {

        const { addOption, removeOption } = useOptionStore.getState();
        const channel = supabase
        .channel(`options:${roomId}`)
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
       .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            activeChannel = channel;
            set({ subscribed: true });
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            supabase.removeChannel(channel);
            reject(new Error(`Realtime subscription failed: ${status}`));
          }
        });
      })
      },

      unsubscribe: () => {
        if (activeChannel) {
          supabase.removeChannel(activeChannel);
          activeChannel = null;
        }
        set({ subscribed: false });
      },
  })
);
