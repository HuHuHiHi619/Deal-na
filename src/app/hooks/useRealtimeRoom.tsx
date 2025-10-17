import { useCallback, useEffect, useRef } from "react";
import { useOptionRealtimeStore } from "../store/option/useOptionRealtimeStore";
import { useRoomRealtimeStore } from "../store/room/useRoomRealtimeStore";
import { useVoteRealtimeStore } from "../store/vote/useVoteRealtimeStore";
import { useRoomRealtimeReadyStore } from "../store/room/useRoomRealtimeReadyStore";

export function useRealtimeRoom(roomId: string | undefined) {
  const { subscribe: subscribeRoom, unsubscribe: unsubscribeRoom } =
    useRoomRealtimeStore();
  const { subscribe: subscribeOption, unsubscribe: unsubscribeOption } =
    useOptionRealtimeStore();
  const { subscribe: subscribeVote, unsubscribe: unsubscribeVote } =
    useVoteRealtimeStore();
  const { subscribe: subscribeReady, unsubscribe: unsubscribeReady } =
    useRoomRealtimeReadyStore();

  console.log("🟢 useRealtimeRoom called with roomId:", roomId); // 👈 เพิ่ม log นี้

  const subscribedRoomIdRef = useRef<string | undefined>(undefined);

  const subscribeAll = async () => {
    if (!roomId) {
      console.log("❌ No roomId, skipping subscription");
      return;
    }

    if (subscribedRoomIdRef.current === roomId) {
      console.log("Already subscribed to roomId:", roomId);
      return;
    }

    try {
      await Promise.all([
        subscribeRoom(roomId),
        subscribeOption(roomId),
        subscribeVote(roomId),
        subscribeReady(roomId),
      ]);
      subscribedRoomIdRef.current = roomId;
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  const unsubscribeAll = useCallback(async () => {
    console.log("🟡 Manual unsubscribe called");
    try {
      await Promise.allSettled([
        unsubscribeRoom(),
        unsubscribeOption(),
        unsubscribeVote(),
        unsubscribeReady(),
      ]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      subscribedRoomIdRef.current = undefined;
    } catch (error) {
      console.error("Unsubscribe error:", error);
    }
  }, [unsubscribeRoom, unsubscribeOption, unsubscribeVote, unsubscribeReady]);

  return {subscribeAll , unsubscribeAll };
}
