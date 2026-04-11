"use client";

import React from "react";
import { X } from "lucide-react";
import { useExitRoom } from "@/app/hooks/useExitRoom";

 export default function ExitRoomButton() {
  const { handleExit, isLoading, error } = useExitRoom();

  return (
    <>
      <button
        onClick={handleExit}
        disabled={isLoading}
        className="w-full bg-rose-400  text-white border border-rose-200 px-6 py-3 rounded-xl font-medium hover:text-xl hover:bg-rose-600 cursor-pointer  transition-all duration-300 flex items-center justify-center space-x-2"
      >
        <X />
        <span>Exit Room</span>
      </button>
      {isLoading && <p className="text-sm text-rose-600">Exiting room...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </>
  );
}

