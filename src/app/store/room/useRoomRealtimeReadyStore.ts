import { create } from "zustand";
import { supabase } from "@/app/lib/supabase";
import { useRoomReadyStore } from "./useRoomReadyStore";
import { RealtimeStore } from "../option/useOptionRealtimeStore";
import { stat } from "fs";

interface PresencePayload {
  userId: string;
  isReady: boolean;
  joinedAt?: string;
  readyAt?: string;
}

export const useRoomRealtimeReadyStore = create<RealtimeStore>((set, get) => ({
  channel: null,
  subscribe: (roomId: string, userId?: string) => {
    // ตรงนี้มีปัญหา
    console.log(
      `🎯 [READY-STORE] subscribe called with roomId: ${roomId}, userId: ${userId}`
    );
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
        console.log("🟡 Presence sync event received:", state);

        const allUsers = Object.keys(state);
        const totalInRoom = allUsers.length;
        console.log(`🟡 All users in room : ${totalInRoom} :`, allUsers);
        useRoomReadyStore.getState().setTotalMembers(totalInRoom);

        const readyUsers = allUsers.filter(
          (key) => state[key]?.[0]?.isReady === true
        );
        console.log("🟡 Ready users in room :", readyUsers);
        setReady(readyUsers);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("🟡 Presence join event received:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("🟡 Presence leave event received:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          console.log(`🟡 Subscribed to room-ready-${roomId} channel`);

          set({ channel: ch });

          // Track user in room
          if (userId) {
            try {
              await ch.track({
                userId,
                isReady: false,
                joinedAt: new Date().toISOString(),
              });
            } catch (err) {
              console.warn(
                "⚠️ [READY-STORE] track failed (userId present) :",
                err
              );
            }
          } else {
            console.log(
              "⚠️ [READY-STORE] No userId provided — skipping track()"
            );
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
        } else if (status === "CHANNEL_ERROR") {
          console.error(`❌ Error subscribing to room-ready-${roomId} channel`);
        } else if (status === "TIMED_OUT") {
          console.error(
            `❌ Timed out subscribing to room-ready-${roomId} channel`
          );
        }
      });
  },

  sendReady: async (userId: string) => {
    console.log(`🟡 Attempting to send ready for user: ${userId}`);

    const { channel } = get();
    console.log("🔍 Current channel state:", channel);

    if (!channel) {
      console.error("❌ Channel not found");
      return false;
    }

    try {
      // Update presence state to isReady: true
      console.log("📤 Tracking presence as ready...");
      const trackResult = await channel.track({
        userId,
        isReady: true,
        readyAt: new Date().toISOString(),
      });

      if (trackResult === "ok") {
        console.log("✅ Presence tracked successfully");
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
        console.log("🔌 [READY-STORE] Unsubscribing and untracking");
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
