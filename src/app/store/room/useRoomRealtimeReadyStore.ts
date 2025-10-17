import { create } from "zustand";
import { supabase } from "@/app/lib/supabase";
import { useRoomReadyStore } from "./useRoomReadyStore";
import { RealtimeStore } from "../option/useOptionRealtimeStore";
import { stat } from "fs";

export const useRoomRealtimeReadyStore = create<RealtimeStore>((set, get) => ({
  channel: null,
  subscribe: (roomId: string) => {
    console.log(`🎯 [READY-STORE] subscribe called with roomId: ${roomId}`);

    const { addReady } = useRoomReadyStore.getState();
    const channel = supabase
      .channel(`room-ready-${roomId}`)
      .on(
        "broadcast",
        {
          event: "User-ready",
        },
        (payload) => {
          console.log("📨 [READY-STORE] Received User-ready:", payload);
          addReady(payload.payload.userId);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`🔔 [READY-STORE] Channel status: ${status}`);
          set({ channel });
        } else if (status === "CHANNEL_ERROR") {
          console.error("Room-realtime error");
        } else if (status === "TIMED_OUT") {
          console.error("Room-realtime timed out");
        }
      });
  },
  sendReady: async (userId: string) => {
    console.log(`🟡 Attempting to send ready for user: ${userId}`);

    const { channel } = get();
    console.log("🔍 Current channel state:", channel);

    if (!channel) {
      console.error(
        "❌ Channel not found - Please wait for subscription to complete"
      );
      return false;
    }

    try {
      console.log("📤 Sending broadcast...");
      const { error } = (await channel.send({
        type: "broadcast",
        event: "User-ready",
        payload: { userId },
      })) as any;

      if (error) {
        console.error("❌ Send error:", error);
        return false;
      }

      console.log("✅ Broadcast sent successfully");

      // อัพเดท local state
      useRoomReadyStore.getState().addReady(userId);
      console.log("✅ Local state updated");
      return true;
    } catch (error) {
      console.error("❌ Unexpected error in sendReady:", error);
      return false;
    }
  },
  unsubscribe: () => {
    const { channel } = get();
    if (channel) supabase.removeChannel(channel);
    set({ channel: null });
  },
}));
