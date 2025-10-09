import { useEffect } from "react";
import { useOptionRealtimeStore } from "../store/option/useOptionRealtimeStore";
import { useRoomRealtimeStore } from "../store/room/useRoomRealtimeStore";
import { useVoteRealtimeStore } from "../store/vote/useVoteRealtimeStore";

export function useRealtimeRoom(roomId: string | undefined) {
  const { subscribe: subscribeRoom, unsubscribe: unsubscribeRoom } =
    useRoomRealtimeStore();
  const { subscribe: subscribeOption, unsubscribe: unsubscribeOption } =
    useOptionRealtimeStore();
  const { subscribe: subscribeVote, unsubscribe: unsubscribeVote } =
    useVoteRealtimeStore();

  useEffect(() => {
    if (!roomId) return;
    console.log("Subscribe all realtime channels for room :", roomId);
    subscribeRoom(roomId);
    subscribeOption(roomId);
    subscribeVote(roomId);
    return () => {
      unsubscribeRoom();
      unsubscribeOption();
      unsubscribeVote();
    };
  }, [roomId]);
}
