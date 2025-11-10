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
import { AppWindow, Vote } from "lucide-react";

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
      <div className="min-h-screen  backdrop-blur-md">
       <header className="sticky top-0 z-10 bg-gradient-to-r from-rose-300 to-rose-800 backdrop-blur-md rounded-b-xl ring-offset-4 ring-4 ring-rose-400 shadow-sm">
          <div className="max-w-4xl flex items-center gap-4 mx-auto pl-8 py-4  text-2xl font-semibold text-white tracking-wide">
            <AppWindow size={30} />
            <h1 className="text-3xl">
              {currentRoom?.title}
            </h1>
            
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
