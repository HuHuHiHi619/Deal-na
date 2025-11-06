"use client";
import React from "react";
import { HeartHandshake ,  Ban } from "lucide-react";
import { useRoom } from "../../store/room/useRoomStore";
import { useRoomForm } from "../../store/useRoomForm";
import { useUiStore } from "../../store/useUiStore";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useAuth } from "@/app/store/auth/useAuth";

export default function CreateRoomButton() {
  const { createRoom } = useRoom();
  const { titleInput, optionsInput } = useRoomForm();
  const { setIsPopup, setLoading } = useUiStore();
  const { user } = useAuth();

  const { execute, isLoading, error } = useAsyncAction("createRoomLoading", {
    onSuccess: (data) => {
      console.log("✅ Room created successfully:", data);
    },
    onError: (err) => {
      console.log("❌ Create room error:", err);
    },
  });

  const validateForm = (title: string, optionsInput: string[]) => {
    const options = optionsInput.map((o) => o.trim()).filter((o) => o);
    if (!title.trim()) return { valid: false, error: "Title is required" };
    if (options.length === 0)
      return { valid: false, error: "Options are required at least 1" };
    return { valid: true, options };
  };

  const handleCreateRoom = async () => {
    await execute(async () => {
      if (!user) throw new Error("User not found");

      const { valid, options, error } = validateForm(titleInput, optionsInput);

      if (!valid) throw new Error(error);
      if (options === undefined) throw new Error("options is undefined");

      const result = await createRoom(titleInput.trim(), options, user.id);
      setLoading("popupQr", true);
      setIsPopup(true);

      return result;
    });
  };

  return (
    <div className="flex justify-center flex-col items-center p-4">
      {error && (
        <div className="w-md flex gap-2 items-center justify-center bg-rose-200 text-red-500 mb-4 py-2 px-4 text-sm shadow-md font-medium rounded-xl ">
          <Ban />
          <span>{error}</span>
        </div>
      )}

      <button
        disabled={isLoading}
        className={`w-md text-2xl bg-gradient-to-r from-rose-400 to-pink-400 text-white border border-rose-200 px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-300 ${
          isLoading
            ? "opacity-60 cursor-not-allowed"
            : "hover:translate-y-[-4px] cursor-pointer"
        }`}
        onClick={handleCreateRoom}
      >
        {isLoading ? "CREATING..." : "PREPARE DEAL"}
        <HeartHandshake size={28} className="ml-2" />
      </button>
    </div>
  );
}
