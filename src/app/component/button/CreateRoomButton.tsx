"use client";
import React from "react";
import { useRoom } from "../../store/room/useRoomStore";
import { useRoomForm } from "../../store/useRoomForm";
import { HeartHandshake } from "lucide-react";
import { useUiStore } from "../../store/useUiStore";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useAuth } from "@/app/store/auth/useAuth";

function CreateRoomButton() {
  const { createRoom } = useRoom();
  const { titleInput, optionsInput } = useRoomForm();
  const { setIsPopup , setLoading } = useUiStore();
  const { user } = useAuth();
  const { execute } = useAsyncAction("createRoomLoading");

  const handleCreateRoom = async () => {
    setLoading('popupQr', true)
    setIsPopup(true);
    await execute(async () => {
      if (!user) throw new Error("User not found");
      
      if (titleInput.length === 0 || optionsInput.length === 0)
        throw new Error("Title and options cannot be empty");
      
      return await createRoom(titleInput, optionsInput, user.id);
    });
    
  };

  return (
    <div className="px-6">
      <button
        className="w-full text-2xl space-x-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white border border-rose-200 px-6 py-3  rounded-xl font-medium hover:translate-y-[-4px] cursor-pointer transition-all duration-300 flex items-center justify-center"
        onClick={handleCreateRoom}
      >
        <p>PREPARE DEAL</p>
        <HeartHandshake size={28} />
      </button>
    </div>
  );
}

export default CreateRoomButton;
