'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useRealtimeRoom } from "@/app/hooks/useRealtimeRoom";
import { usePathname } from "next/navigation";
import { useAuth } from "../store/auth/useAuth";

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

    console.log("Joining room...", roomId);

    joinRoom(roomId, user.id)
      .then(() => {
        lifecycle.hasJoinedInternal = true;
        lifecycle.isJoiningInternal = false;
        setIsJoining(false);
        setIsJoined(true);

        console.log("Room joined");
        subscribeAll();
        lifecycle.onRoomJoined?.();
      })
      .catch((err) => {
        console.error("Failed to join room:", err);
        lifecycle.isJoiningInternal = false;
        setIsJoining(false);
      });

    // ❌ ไม่ต้อง return cleanup function ที่นี่
  }, [roomId, user?.id, pathname, joinRoom, subscribeAll]);

  // 🔹 Effect สำหรับ exit ห้องเมื่อเปลี่ยนหน้า
  useEffect(() => {
    const isInRoomPage = pathname.startsWith("/room/") && !!roomId;
    const lifecycle = lifecycleRef.current;

    if (isInRoomPage || !isJoined) return;

    console.log("User left room page, cleaning up...");

    setIsJoined(false);
    setIsJoining(false);
    lifecycle.hasJoinedInternal = false;
    lifecycle.isJoiningInternal = false;

    exitRoom();
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
