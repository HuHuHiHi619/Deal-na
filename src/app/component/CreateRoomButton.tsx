"use client";
import React from "react";
import { useRoom } from "../store/room/useRoomStore";
import { useMockAuth } from "../store/auth/useMockAuth";
import { useRoomForm } from "../store/useRoomForm";

function CreateRoomButton() {
  const { createRoom } = useRoom();
  const { titleInput, optionsInput } = useRoomForm();
  const { mockUser } = useMockAuth();

  const handleCreateRoom = async () => {
    console.log("creating room...");
    if (!mockUser) return;
    if (titleInput.length === 0 || optionsInput.length === 0) return;
    await createRoom(titleInput, optionsInput, mockUser.id);
  };
  return (
    <div className="px-6">
      <button className="w-full text-2xl bg-linear-to-br from-pink-400 to-rose-500 text-white border border-rose-200 px-6 py-3  rounded-xl font-medium hover:bg-rose-50 hover:border-rose-300 transition-all duration-300 flex items-center justify-center space-x-2" onClick={handleCreateRoom}>
        Create Room
      </button>
    </div>
  );
}

export default CreateRoomButton;
