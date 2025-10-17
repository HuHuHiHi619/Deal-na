import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useRoom } from "../store/room/useRoomStore";
import { useRealtimeRoom } from "../hooks/useRealtimeRoom";
import { X } from "lucide-react";

function ExitRoomButton() {
  const router = useRouter();
  const { roomCode } : { roomCode: string } = useParams()
  const { exitRoom } = useRoom();
  const { unsubscribeAll } = useRealtimeRoom(roomCode);
  const handleExit = () => {
    try {
      const confirmed = confirm("Are you sure you want to exit the room?");
      if (!confirmed) return;
      unsubscribeAll()
      exitRoom();
      router.replace("/room");
    } catch (error) {
      console.error("handleExit error:", error);
    }
  };

  return (
    <button
      onClick={handleExit}
      className="w-full bg-white/80 text-rose-600 border border-rose-200 px-6 py-3 rounded-xl font-medium hover:text-white hover:bg-rose-400 cursor-pointer  transition-all duration-300 flex items-center justify-center space-x-2"
    >
      <X />
      <span>Exit Room</span>
    </button>
  );
}

export default ExitRoomButton;
