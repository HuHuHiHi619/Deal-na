"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/store/auth/useAuth";
import VoteOptions from "@/app/room/[roomId]/vote/page";
import { RoomGuard } from "@/app/component/room/RoomGuard";
import Confetti from "@/app/component/decor/Confetti";
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
      <div className="relative min-h-screen overflow-hidden bg-cream px-[22px] pt-8 pb-10">
        <Confetti variant="vote" />
        <main className="relative z-10 mx-auto w-full max-w-md">
          <VoteOptions roomId={roomId} isJoined={isJoined} />
        </main>
      </div>
    </RoomGuard>
  );
}
