"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VoteOptions from "@/app/room/[roomCode]/vote/page";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useUiStore } from "@/app/store/useUiStore";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";

export default function RoomPage() {
  const { roomCode }: { roomCode: string } = useParams();
  const { currentRoom } = useRoom();
  const { mockUser } = useMockAuth();
  const { deleteOption, fetchOption } = useOptionStore();
  const { fetchVote } = useVoteStore();

  const handleDeleteOption = (optionId: string) => {
    deleteOption(optionId);
  };

  useEffect(() => {
    if (!roomCode || !mockUser) return;
    fetchOption(roomCode);
    fetchVote()
  }, [roomCode, mockUser, fetchOption]);

  if (!currentRoom) {
    return (
      <div className="text-center py-8">
        <p>Loading room...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{currentRoom.title}</h1>
        <p className="text-gray-600">
          Room Code: <span className="font-mono">{currentRoom.roomCode}</span>
        </p>
      </div>
      <VoteOptions
        handleDeleteOption={handleDeleteOption}
      />
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Room Information</h3>
        <p className="text-sm text-gray-600">Status: {currentRoom.status}</p>
        <p className="text-sm text-gray-600">
          Created: {new Date(currentRoom.createdAt).toLocaleString()}
        </p>
        {currentRoom.expiredAt && (
          <p className="text-sm text-gray-600">
            Expires: {new Date(currentRoom.expiredAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
