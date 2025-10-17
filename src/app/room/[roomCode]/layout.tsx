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
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-xl">
      <div className="text-center bg-white/40 px-8 py-6 rounded-2xl shadow-md border border-white/30 backdrop-blur-md">
        <p className="text-gray-700 text-lg font-medium tracking-wide">
          Checking authentication...
        </p>
        <p className="text-gray-500 text-sm mt-2">Please wait</p>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-xl">
      <div className="text-center bg-white/40 px-8 py-6 rounded-2xl shadow-md border border-white/30 backdrop-blur-md">
        <p className="text-rose-600 mb-4 text-lg font-medium">{error}</p>
        <button
          onClick={() => {
            clearError();
            router.push("/");
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-400 to-pink-400 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-300"
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
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-xl">
      <div className="text-center bg-white/40 px-8 py-6 rounded-2xl shadow-md border border-white/30 backdrop-blur-md">
        <p className="text-gray-700 text-lg font-medium">
          Joining room <span className="text-indigo-500">{roomCode}</span>...
        </p>
        <p className="text-sm text-gray-500 mt-2 animate-pulse">
          {joiningRef.current ? "Connecting..." : "Setting up..."}
        </p>
      </div>
    </div>
  );
}

// Render room content
return (
  <div className="min-h-screen bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-md">
    <header className="sticky top-0 z-10 bg-white/50 backdrop-blur-md border-b border-white/30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-wide">
          {currentRoom.title}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Room Code:{" "}
          <span className="font-mono text-indigo-600/80">
            {currentRoom.roomCode}
          </span>
        </p>
      </div>
    </header>

    <main className="max-w-4xl mx-auto px-4 py-8">
      {children}
    </main>
  </div>
);
}