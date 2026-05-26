'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useRealtimeRoom } from "@/app/hooks/useRealtimeRoom";
import { usePathname } from "next/navigation";
import { useAuth } from "../store/auth/useAuth";
import { useVoteStore } from "../store/vote/useVoteStore";
import { useRoomMemberStore } from "../store/room/useRoomMemberStore";
import { useOptionStore } from "../store/option/useOptionStore";

export function useRoomLifecycle(roomId: string) {
  const { joinRoom, currentRoom, error, clearError, exitRoom } = useRoom();
  const { subscribeAll, unsubscribeAll } = useRealtimeRoom(roomId);
  const { user } = useAuth();
  const pathname = usePathname();

  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const lifecycleRef = useRef<{
    isJoiningInternal: boolean;
    hasJoinedInternal: boolean;
    onRoomJoined: (() => void) | null;
  }>({
    isJoiningInternal: false,
    hasJoinedInternal: false,
    onRoomJoined: null,
  });

  const setOnRoomJoined = useCallback((callback: () => void) => {
    lifecycleRef.current.onRoomJoined = callback;
  }, []);

  // 🔹 Effect สำหรับ join ห้อง
  useEffect(() => {
    const isInRoomPage = pathname.startsWith("/room/") && !!roomId;
    const lifecycle = lifecycleRef.current;

    if (!isInRoomPage || !user) return;
    if (lifecycle.isJoiningInternal || lifecycle.hasJoinedInternal) return;

    lifecycle.isJoiningInternal = true;
    setIsJoining(true);

    joinRoom(roomId)
      .then(async () => {
        lifecycle.hasJoinedInternal = true;
        lifecycle.isJoiningInternal = false;
        setIsJoining(false);
        setIsJoined(true);

        await subscribeAll();
        lifecycle.onRoomJoined?.();
      })
      .catch((err) => {
        console.error("Failed to join room:", err);
        lifecycle.isJoiningInternal = false;
        setIsJoining(false);
      });

    //  ไม่ต้อง return cleanup function 
  }, [roomId, user, user?.id, pathname, joinRoom, subscribeAll]);

 
  useEffect(() => {
    const isInRoomPage = pathname.startsWith("/room/") && !!roomId;
    const lifecycle = lifecycleRef.current;

    if (isInRoomPage || !isJoined) return;

    setIsJoined(false);
    setIsJoining(false);
    lifecycle.hasJoinedInternal = false;
    lifecycle.isJoiningInternal = false;

    exitRoom();
    useVoteStore.getState().clearVotes();
    useRoomMemberStore.getState().clearMembers();
    useOptionStore.getState().setOptions([]);
    unsubscribeAll();
  }, [pathname, isJoined, exitRoom, unsubscribeAll, roomId]);

  return {
    isJoining,
    isJoined,
    error,
    currentRoom,
    user,
    clearError,
    setOnRoomJoined,
  };
}
