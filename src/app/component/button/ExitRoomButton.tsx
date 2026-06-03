"use client";

import React from "react";
import { X } from "lucide-react";
import { useParams } from "next/navigation";
import useExitRoomMutation from "@/app/hooks/mutation/useExitRoomMutation";

 export default function ExitRoomButton() {
  const { roomId } = useParams<{ roomId: string }>();
  const { mutate , isPending , error } = useExitRoomMutation({ roomId })
  const handleExit = () => {
    mutate()
  }

  return (
    <>
      <button
        onClick={handleExit}
        disabled={isPending}
        className="w-full bg-rose-400  text-white border border-rose-200 px-6 py-3 rounded-xl font-medium hover:text-xl hover:bg-rose-600 cursor-pointer  transition-all duration-300 flex items-center justify-center space-x-2"
      >
        <X />
        <span>Exit Room</span>
      </button>
      {isPending && <p className="text-sm text-rose-600">Exiting room...</p>}
      {error && <p className="text-sm text-rose-600">{error.message}</p>}
    </>
  );
}

