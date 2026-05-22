import { create } from "zustand";
import { supabase } from "@/app/lib/supabase";
import { useRoomReadyStore } from "./useRoomReadyStore";
import { RealtimeStore } from "../option/useOptionRealtimeStore";


interface PresencePayload {
  userId: string;
  isReady: boolean;
  joinedAt?: string;
  readyAt?: string;
}

export const useRoomRealtimeReadyStore = create<RealtimeStore>((set, get) => ({
  channel: null,
  subscribe: (roomId: string, userId?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const { setReady } = useRoomReadyStore.getState();

      const presenceConfig = userId ? { key: userId } : undefined;

      const ch = supabase
        .channel(`room-ready-${roomId}`, {
          config: {
            ...(presenceConfig ? { presence: presenceConfig } : {}),
          },
        })
        .on("presence", { event: "sync" }, () => {
          const state = ch.presenceState<PresencePayload>();
          const allUsers = Object.keys(state);
          const totalInRoom = allUsers.length;
          useRoomReadyStore.getState().setTotalMembers(totalInRoom);

          const readyUsers = allUsers.filter(
            (key) => state[key]?.[0]?.isReady === true
          );
          setReady(readyUsers);
        })
        .on("presence", { event: "join" }, () => {})
        .on("presence", { event: "leave" }, () => {})
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            set({ channel: ch });

            // Track user in room
            if (userId) {
              try {
                await ch.track({
                  userId,
                  isReady: false,
                  joinedAt: new Date().toISOString(),
                });

                await new Promise<void>((resolveTrack, rejectTrack) => {
                  const MAX_RETRIES = 30;
                  let retries = 0;
                  const checkState = () => {
                    const state = ch.presenceState<PresencePayload>();
                    if (state[userId]) {
                      resolveTrack();
                    } else if (retries >= MAX_RETRIES) {
                      rejectTrack(new Error("Presence track timed out"));
                    } else {
                      retries++;
                      setTimeout(checkState, 100);
                    }
                  };
                  checkState();
                })

              } catch (err) {
                console.warn(
                  "⚠️ [READY-STORE] track failed (userId present) :",
                  err
                );
              }
            }

            // sync state
            const state = ch.presenceState<PresencePayload>();
            const allUsers = Object.keys(state);
            const totalInRoom = allUsers.length;
            const readyUsers = allUsers.filter(
              (key) => state[key]?.[0]?.isReady === true
            );

            useRoomReadyStore.getState().setTotalMembers(totalInRoom);
            if (readyUsers.length > 0) setReady(readyUsers);

            resolve();
          } else if (status === "CHANNEL_ERROR") {
            console.error(
              `❌ Error subscribing to room-ready-${roomId} channel`
            );
            reject(new Error("Channel error"));
          } else if (status === "TIMED_OUT") {
            console.error(
              `❌ Timed out subscribing to room-ready-${roomId} channel`
            );
            reject(new Error("Channel timeout"));
          }
        });
    });
  },

  sendReady: async (userId: string) => {
    const { channel } = get();

    if (!channel) {
      console.error("❌ Channel not found");
      return false;
    }

     if (channel.state !== "joined") {
      console.error("❌ Channel not joined, current state:", channel.state);
      throw new Error("Channel not ready");
    }

    try {
      const trackResult = await channel.track({
        userId,
        isReady: true,
        readyAt: new Date().toISOString(),
      });

      if (trackResult === "ok") {
        return true;
      } else {
        console.error("❌ Track failed:", trackResult);
        return false;
      }
    } catch (error) {
      console.error("❌ Unexpected error in sendReady:", error);
      return false;
    }
  },

  unsubscribe: () => {
    const { channel } = get();
    if (channel) {
      try {
        channel.untrack();
      } catch (err) {
        console.warn("⚠️ untrack failed:", err);
      }
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn("⚠️ removeChannel failed:", err);
      }
    }
    set({ channel: null });
    useRoomReadyStore.getState().clearReady();
  },
}));
