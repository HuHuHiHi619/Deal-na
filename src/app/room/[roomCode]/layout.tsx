"use client";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { subscribe } from "diagnostics_channel";
import { useRealtimeRoom } from "@/app/hooks/useRealtimeRoom";

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const joiningRef = useRef(false);
  const hasJoinedRef = useRef<string | null>(null);
  const { roomCode }: { roomCode: string } = useParams();
  const { joinRoom, currentRoom, error , clearError, exitRoom } = useRoom();
  const { subscribeAll , unsubscribeAll } = useRealtimeRoom(roomCode);
  const { mockUser } = useMockAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ⭐ useEffect สำหรับ join room
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
        hasJoinedRef.current = roomCode; // ⭐ เซ็ตตรงนี้
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
  }, [roomCode, mockUser?.id, pathname]);

  // ⭐ useEffect แยกสำหรับ subscribe (รันเสมอเมื่อมี currentRoom)
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
  }, [currentRoom?.roomCode, roomCode]); // ⭐ รันทุกครั้งที่ currentRoom เปลี่ยน
  // Loading states
  if (!mockUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              router.push("/");
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // กำลัง join หรือยังไม่มี currentRoom
  if (joiningRef.current || !currentRoom || currentRoom.roomCode !== roomCode) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <p>Joining room {roomCode}...</p>
        <p className="text-sm text-gray-500 mt-2">
          {joiningRef.current ? "Connecting..." : "Setting up..."}
        </p>
      </div>
    </div>
  );
}

  // Render room content
  return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">{currentRoom.title}</h1>
            <p className="text-gray-600 text-sm">
              Room Code:{" "}
              <span className="font-mono">{currentRoom.roomCode}</span>
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </div>
  );
}