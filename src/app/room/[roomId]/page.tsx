"use client";
import { useParams } from "next/navigation";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useAuth } from "@/app/store/auth/useAuth";
import VoteOptions from "@/app/room/[roomId]/vote/page";
import { RoomGuard } from "@/app/component/room/RoomGuard";
import { useRoomSession } from "./RoomSessionProvider";
import { AppWindow } from "lucide-react";

export default function RoomPage() {
  const { roomId }: { roomId: string } = useParams();
  const { user } = useAuth();
  const { deleteOption } = useOptionStore();
  const { currentRoom, clearError, error: storeError } = useRoom();
  const { isJoined, error: sessionError } = useRoomSession();

  const error = sessionError ?? storeError;

  return (
    <RoomGuard
      isJoining={!isJoined && !error}
      isJoined={isJoined}
      roomId={roomId}
      error={error}
      clearError={clearError}
      user={user ?? null}
      currentRoom={currentRoom}
    >
      <div className="min-h-screen backdrop-blur-md">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-rose-300 to-rose-800 backdrop-blur-md rounded-b-xl ring-offset-4 ring-4 ring-rose-400 shadow-sm">
          <div className="max-w-4xl flex items-center gap-4 mx-auto pl-8 py-4 text-2xl font-semibold text-white tracking-wide">
            <AppWindow size={30} />
            <h1 className="text-3xl">{currentRoom?.title}</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <VoteOptions handleDeleteOption={deleteOption} />
        </main>
      </div>
    </RoomGuard>
  );
}
