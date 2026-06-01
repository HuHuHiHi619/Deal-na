"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/store/auth/useAuth";
import VoteOptions from "@/app/room/[roomId]/vote/page";
import { RoomGuard } from "@/app/component/room/RoomGuard";
import { AppWindow } from "lucide-react";
import useRoomSession from "@/app/hooks/useRoomSession";
import useRoomQuery from "@/app/hooks/query/useRoomQuery";

export default function RoomPage() {
  const { roomId }: { roomId: string } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isJoined, error: sessionError } = useRoomSession();

  const { data: currentRoom } = useRoomQuery(roomId, isJoined);

  useEffect(() => {
    if (isJoined && currentRoom && currentRoom.started_at === null) {
      router.replace(`/room/${roomId}/lobby`);
    }
  }, [isJoined, currentRoom?.started_at, roomId, router]);

  return (
    <RoomGuard
      isJoining={!isJoined && !sessionError}
      isJoined={isJoined}
      roomId={roomId}
      error={sessionError}
      user={user ?? null}
    >
      <div className="min-h-screen backdrop-blur-md">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-rose-300 to-rose-800 backdrop-blur-md rounded-b-xl ring-offset-4 ring-4 ring-rose-400 shadow-sm">
          <div className="max-w-4xl flex items-center gap-4 mx-auto pl-8 py-4 text-2xl font-semibold text-white tracking-wide">
            <AppWindow size={30} />
            <h1 className="text-3xl">{currentRoom?.title}</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <VoteOptions roomId={roomId} isJoined={isJoined}/>
        </main>
      </div>
    </RoomGuard>
  );
}
