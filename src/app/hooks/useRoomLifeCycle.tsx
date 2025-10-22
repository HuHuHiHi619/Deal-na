// hooks/useRoomLifecycle.ts
import { useEffect, useRef } from "react";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useRealtimeRoom } from "@/app/hooks/useRealtimeRoom";
import { useRouter, usePathname } from "next/navigation";

export function useRoomLifecycle(roomCode: string) {
  const joiningRef = useRef(false);
  const hasJoinedRef = useRef<string | null>(null);
  
  const { joinRoom, currentRoom, error, clearError, exitRoom } = useRoom();
  const { subscribeAll, unsubscribeAll } = useRealtimeRoom(roomCode);
  const { mockUser } = useMockAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ⭐ useEffect สำหรับ join room (ตรงตามโค้ดเดิม)
  useEffect(() => {
    const isInRoomPage = pathname?.startsWith('/room/') && roomCode;
    
    if (!mockUser || !isInRoomPage) {
      console.log("❌ Not in room page or no user");
      return;
    }

    if (hasJoinedRef.current === roomCode) {
      console.log("⏳ Already joined room:", roomCode);
      return;
    }

    if (currentRoom && currentRoom.roomCode !== roomCode) {
      console.log("🔄 Switching rooms, leaving current room first");
      exitRoom();
    }

    if (currentRoom?.roomCode === roomCode) {
      console.log("✅ Already in this room");
      hasJoinedRef.current = roomCode;
      return;
    }

    if (joiningRef.current) {
      console.log("⏳ Join already in progress");
      return;
    }

    console.log("🟡 Starting to join room:", roomCode);
    joiningRef.current = true;
   
    const joinSetup = async () => {
      try {
        await joinRoom(roomCode, mockUser.id);
        console.log("✅ Successfully joined room");
        hasJoinedRef.current = roomCode; 
      } catch (err) {
        console.error("❌ Failed to join room:", err);
        hasJoinedRef.current = null;
        setTimeout(() => router.push("/"), 2000);
      } finally {
        joiningRef.current = false;
      }
    };

    joinSetup();

    return () => {
      if(currentRoom?.roomCode === roomCode) {
        console.log('Cleanup : leaving room:', roomCode);
        exitRoom();
      }
      hasJoinedRef.current = null;
      joiningRef.current = false;
    }
  }, [roomCode, mockUser?.id, pathname]); // ⭐ dependency เหมือนโค้ดเดิม

  // ⭐ useEffect แยกสำหรับ subscribe (เหมือนโค้ดเดิม)
  useEffect(() => {
    if (!currentRoom || currentRoom.roomCode !== roomCode) {
      console.log("❌ Not in room yet, skipping subscription");
      return;
    }

    console.log("🟢 Setting up subscriptions for room:", roomCode);
    subscribeAll();

    return () => {
      console.log("🔴 Cleaning up subscriptions for room:", roomCode);
      unsubscribeAll();
    };
  }, [currentRoom?.roomCode, roomCode]); // ⭐ dependency เหมือนโค้ดเดิม

  return {
    isJoining: joiningRef.current,
    currentRoom,
    error,
    clearError,
    mockUser,
  };
}