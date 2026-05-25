import { useCallback, useRef } from "react";
import { useOptionRealtimeStore } from "../store/option/useOptionRealtimeStore";
import { useRoomRealtimeStore } from "../store/room/useRoomRealtimeStore";
import { useVoteRealtimeStore } from "../store/vote/useVoteRealtimeStore";
import { useRoomRealtimeReadyStore } from "../store/room/useRoomRealtimeReadyStore";
import { useAuth } from "../store/auth/useAuth";
import { useUiStore } from "../store/useUiStore";

export function useRealtimeRoom(roomId: string | undefined) {
  const { subscribe: subscribeRoom, unsubscribe: unsubscribeRoom } =
    useRoomRealtimeStore();
  const { subscribe: subscribeOption, unsubscribe: unsubscribeOption } =
    useOptionRealtimeStore();
  const { subscribe: subscribeVote, unsubscribe: unsubscribeVote } =
    useVoteRealtimeStore();
  const { subscribe: subscribeReady, unsubscribe: unsubscribeReady } =
    useRoomRealtimeReadyStore();

  const subscribedRoomIdRef = useRef<string | undefined>(undefined);
  const { user } = useAuth();

  const subscribeAll =  useCallback(async () => {

    if (!roomId) {
      return;
    }

    if (!user?.id) {
      return;
    }

    if (subscribedRoomIdRef.current === roomId) {
      return;
    }

    const results = await Promise.allSettled([
      subscribeRoom(roomId),
      subscribeOption(roomId),
      subscribeVote(roomId),
      subscribeReady(roomId, user.id),
    ]);

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      useUiStore.getState().setError('subscriptionError', 'Failed to connect to real-time updates. Please refresh.');
      subscribedRoomIdRef.current = undefined;
      return;
    }

    subscribedRoomIdRef.current = roomId;
  },[roomId , user?.id , subscribeRoom , subscribeOption , subscribeVote , subscribeReady])
  ;

  const unsubscribeAll = useCallback(async () => {
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
