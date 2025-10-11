import { useRouter } from "next/navigation";
import React from "react";
import { useRoom } from "../store/room/useRoomStore";

function ExitRoomButton() {
  const router = useRouter();
  const { exitRoom } = useRoom();

  const handleExit = () => {
    try {
      const confirmed = confirm("Are you sure you want to exit the room?");
      if (!confirmed) return;
      exitRoom();
      router.push("/room");
    } catch (error) {
      console.error("handleExit error:", error);
    }
  };

  return (
    <button
      onClick={handleExit}
      className="w-full bg-white/80 text-rose-600 border border-rose-200 px-6 py-3 rounded-xl font-medium hover:bg-rose-50 hover:border-rose-300 transition-all duration-300 flex items-center justify-center space-x-2"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span>Exit Room</span>
    </button>
  );
}

export default ExitRoomButton;
