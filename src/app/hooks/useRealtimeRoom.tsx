import { useEffect } from "react";
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

  useEffect(() => {
    console.log("🟡 useEffect triggered, roomId:", roomId); // 👈 เพิ่ม log นี้
    
    if (!roomId) {
      console.log("❌ No roomId, skipping subscription");
      return;
    }
    
    subscribeRoom(roomId);
    subscribeOption(roomId);
    subscribeVote(roomId);
    subscribeReady(roomId);
    
    return () => {
      console.log("🟡 Cleaning up subscriptions");
      unsubscribeRoom();
      unsubscribeOption();
      unsubscribeVote();
      unsubscribeReady();
    };
  }, [roomId]);
}