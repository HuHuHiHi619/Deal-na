import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useRoom } from "../../store/room/useRoomStore";
import { useRealtimeRoom } from "../../hooks/useRealtimeRoom";
import { X } from "lucide-react";
import { useAsyncAction } from "../../hooks/useAsyncAction";

function ExitRoomButton() {
  const router = useRouter();
  const { roomId }: { roomId: string } = useParams();
  const { exitRoom } = useRoom();
  const { unsubscribeAll } = useRealtimeRoom(roomId);

  const { execute, isLoading, error } = useAsyncAction("exitRoom", {
    onSuccess: () => {
      router.replace("/room");
    },
    onError: (err) => {
      console.log("Exit room error:", err);
    },
  });

  const handleExit = async () => {
    const confirmed = confirm("Are you sure you want to exit the room?");
    if (!confirmed) return;
    
    await execute(async () => {
      unsubscribeAll();
      exitRoom();
    });
  };

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

export default ExitRoomButton;
