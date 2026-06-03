"use client";
import React from "react";
import { HeartHandshake, Ban } from "lucide-react";
import useCreateRoomMutation from "@/app/hooks/mutation/useCreateRoomMutation";

interface RoomInputProps {
  titleInput : string ,
  optionsInput : string[]
}

export default function CreateRoomButton({titleInput , optionsInput} : RoomInputProps) {

  const { mutate , isPending , error } = useCreateRoomMutation() 
  const handleCreateRoom = () => {
    if(!titleInput || optionsInput.length <= 0) return
    mutate({titleInput , optionsInput})
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {error && (
        <div className="w-md flex gap-2 items-center justify-center bg-rose-200 text-red-500 mb-4 py-2 px-4 text-sm shadow-md font-medium rounded-xl ">
          <Ban />
          <span>{error.message}</span>
        </div>
      )}

      <button
        disabled={isPending}
        className={`w-md  text-2xl bg-gradient-to-r from-rose-400 to-pink-400 text-white  px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-300 ${
          isPending
            ? "opacity-60 cursor-not-allowed"
            : "hover:translate-y-[-4px] cursor-pointer"
        }`}
        onClick={handleCreateRoom}
      >
        {isPending ? "CREATING..." : "PREPARE DEAL"}
        <HeartHandshake size={28} className="ml-2" />
      </button>
    </div>
  );
}
