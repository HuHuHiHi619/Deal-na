import { useCallback, useRef } from "react";
import { useOptionRealtimeStore } from "../store/option/useOptionRealtimeStore";
import { useRoomRealtimeStore } from "../store/room/useRoomRealtimeStore";
import { useVoteRealtimeStore } from "../store/vote/useVoteRealtimeStore";
import { useRoomRealtimeReadyStore } from "../store/room/useRoomRealtimeReadyStore";
import { useAuth } from "../store/auth/useAuth";

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
  const { user } = useAuth();

  const subscribeAll =  useCallback(async () => {

    if (!roomId) {
      console.log("❌ No roomId, skipping subscription");
      return;
    }

    if (!user?.id) {
      console.log("❌ No user, skipping subscription");
      return;
    }

    if (subscribedRoomIdRef.current === roomId) {
      console.log("✅ Already subscribed to roomId:", roomId);
      return;
    }

    console.log("📡 Starting subscriptions for room:", roomId);

    try {
      // ✅ รอให้ทุก subscription เสร็จ
      await Promise.allSettled([
        subscribeRoom(roomId),
        subscribeOption(roomId),
        subscribeVote(roomId),
        subscribeReady(roomId, user.id),
      ]);
      
      subscribedRoomIdRef.current = roomId;
      console.log("✅ All subscriptions completed for room:", roomId);
      
    } catch (error) {
      console.error("❌ Subscription error:", error);
      subscribedRoomIdRef.current = undefined;
    }
  },[roomId , user?.id , subscribeRoom , subscribeOption , subscribeVote , subscribeReady])
  ;

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
