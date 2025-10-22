"use client";
import React from "react";
import { useRoom } from "../../store/room/useRoomStore";
import { useMockAuth } from "../../store/auth/useMockAuth";
import { useRoomForm } from "../../store/useRoomForm";
import { HeartHandshake } from "lucide-react";
import { useUiStore } from "../../store/useUiStore";
import { useRouter } from "next/navigation";
import { useAsyncAction } from "../../hooks/useAsyncAction";

function CreateRoomButton() {
  const { createRoom } = useRoom();
  const { titleInput, optionsInput } = useRoomForm();
  const { setIsPopup , setLoading } = useUiStore();
  const { mockUser, logout } = useMockAuth();
  const router = useRouter();
  const { execute } = useAsyncAction("createRoomLoading");

  const handleCreateRoom = async () => {
    setLoading('popupQr', true)
    setIsPopup(true);
    await execute(async () => {
      if (!mockUser) throw new Error("Mock user not found");
      
      if (titleInput.length === 0 || optionsInput.length === 0)
        throw new Error("Title and options cannot be empty");
      
      return await createRoom(titleInput, optionsInput, mockUser.id);
    });
    
  };

  const handleMockLogout = () => {
    logout();
    router.push("/");
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
      <button onClick={handleMockLogout} className="bg-emerald-400 text-white">
        Mock logout
      </button>
    </div>
  );
}

export default CreateRoomButton;
