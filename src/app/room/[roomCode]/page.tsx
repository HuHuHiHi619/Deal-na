// page.tsx
"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import { useRoomMemberStore } from "@/app/store/room/useRoomMemberStore";
import VoteOptions from "@/app/room/[roomCode]/vote/page";

export default function RoomPage() {
  const { roomCode }: { roomCode: string } = useParams();
  const { mockUser } = useMockAuth();
  const { fetchOption, deleteOption } = useOptionStore();
  const { addMember } = useRoomMemberStore();

  useEffect(() => {
    if (!roomCode || !mockUser) return;
    fetchOption(roomCode);
    addMember(mockUser.id);
  }, [roomCode, mockUser, fetchOption, addMember]);

  return (
    <div className="p-8">
      <VoteOptions handleDeleteOption={deleteOption} />
    </div>
  );
}
