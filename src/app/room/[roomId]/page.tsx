// page.tsx
"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useRoomMemberStore } from "@/app/store/room/useRoomMemberStore";
import VoteOptions from "@/app/room/[roomId]/vote/page";
import { useAuth } from "@/app/store/auth/useAuth";
import { useRoomLifecycle } from "@/app/hooks/useRoomLifeCycle";
import { RoomGuard } from "@/app/component/room/RoomGuard";

export default function RoomPage() {
  const { roomId }: { roomId: string } = useParams();
  const { user } = useAuth();
  const { fetchOption, deleteOption } = useOptionStore();
  const { addMember } = useRoomMemberStore();

  const {
    currentRoom,
    isJoined,
    isJoining,
    error,
    clearError,
    user: currentUser,
    setOnRoomJoined
  
  } = useRoomLifecycle(roomId);

  useEffect(() => {
  console.log("🎯 useEffect[RoomPage] triggered", { roomId, user });
}, [roomId, user]);

  useEffect(() => {
    if (!user) return;

   setOnRoomJoined(async () => {
      console.log("🟢 Room joined callback executed");
      await fetchOption(roomId);
      addMember(user.id);
    });
  }, [roomId, user, fetchOption, addMember, setOnRoomJoined]);

  
  return (
    <RoomGuard
      isJoining={isJoining}
      isJoined={isJoined}
      roomId={roomId}
      error={error}
      clearError={clearError}
      user={currentUser}
      currentRoom={currentRoom}
    >
      <div className="min-h-screen bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-md">
        <header className="sticky top-0 z-10 bg-white/50 backdrop-blur-md border-b border-white/30 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-semibold text-gray-800 tracking-wide">
              {currentRoom?.title}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Room Code:{" "}
              <span className="font-mono text-indigo-600/80">
                {currentRoom?.roomCode}
              </span>
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div>
            <VoteOptions handleDeleteOption={deleteOption} />
          </div>
        </main>
      </div>
    </RoomGuard>
  );
}
