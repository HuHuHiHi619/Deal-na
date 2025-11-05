import React, { useState } from "react";
import { useRoomRealtimeReadyStore } from "@/app/store/room/useRoomRealtimeReadyStore";
import { useAsyncAction } from "../../hooks/useAsyncAction";

const ReadyButton: React.FC<{ userId: string }> = ({ userId }) => {
  const { sendReady , channel } = useRoomRealtimeReadyStore();
  const [isReady, setIsReady] = useState(false);

  const { execute, isLoading, error } = useAsyncAction("sendReady", {
    onSuccess: () => {
      setIsReady(true);
    },
    onError: (err) => {
      console.log("Send ready error:", err);
    },
  });

  const handleReady = async () => {
    if (!sendReady) throw new Error("Ready function is not available");
    if (!channel || channel.state !== 'joined') {
      console.error("❌ Channel not ready:", channel?.state);
      throw new Error("Connection not ready. Please wait...");
    }
    await execute(async () => {
      const maxRetries = 20;
      let retries = 0;

      while (retries < maxRetries) {
        const { channel } = useRoomRealtimeReadyStore.getState();
        if (channel && channel.state === 'joined') {
            console.log(`✅ Channel ready, sending ready (attempt ${retries + 1})`);
          const result = await sendReady(userId);
          if (!result)
            throw new Error("Failed to send ready. Please try again");
          return result;
        }
        await new Promise((res) => setTimeout(res, 300));
        retries++;
      }
      throw new Error("Connection not ready. Please refresh and try again.");
    });
  };

  return (
    <>
      <button
        id="ready-button"
        onClick={handleReady}
        className={`w-full p-2 rounded-xl transition-all duration-500 ease-in-out ${
          isReady
            ? "bg-emerald-500 text-white animate-bounce"
            : isLoading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "btn-gradient"
        }`}
      >
        {isLoading ? "Connecting..." : isReady ? "I AM READY" : "READY?"}
      </button>
      {error && (
        <p className="text-red-500 text-sm font-medium mt-1">{error}</p>
      )}
    </>
  );
};

export default ReadyButton;
