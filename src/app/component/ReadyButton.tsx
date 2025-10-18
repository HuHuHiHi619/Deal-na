import React, { useState } from "react";
import { useRoomRealtimeReadyStore } from "@/app/store/room/useRoomRealtimeReadyStore";

const ReadyButton: React.FC<{ mockUserId: string }> = ({ mockUserId }) => {
  const { sendReady } = useRoomRealtimeReadyStore();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReady = async () => {
    if (!sendReady) {
      setError("Ready function is not available");
      return;
    }
    const maxRetries = 10;
    let retries = 0;
    while (retries < maxRetries) {
      const { channel } = useRoomRealtimeReadyStore.getState();
      if (channel) {
        const result = await sendReady(mockUserId);
        if (!result) {
          setError("Failed to send ready. Please try again");
        }
        setIsReady(true);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries++;
    }
    setError("Connection not ready. Please refresh and try again.");
  };

  return (
    <button
      id="ready-button"
      onClick={handleReady}
      className={`w-full p-2 rounded-xl transition-all duration-500 ease-in-out ${
        isReady
          ? "bg-emerald-500 ring-offset-4 ring-2 ring-emerald-500 text-white scale-105 shadow-lg"
          : "btn-gradient scale-100"
      }`}
    >
      {isReady ? "I AM READY" : "READY?"}
    </button>
  );
};

export default ReadyButton;
