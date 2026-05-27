'use client';
import React, { useState } from "react";
import { useRoomSession } from "@/app/room/[roomId]/RoomSessionProvider";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useVoteStats } from "@/app/hooks/useVoteStats";
import { useVoteStore, selectVotes } from "@/app/store/vote/useVoteStore";
import { useAuth } from "@/app/store/auth/useAuth";
import { useShallow } from "zustand/shallow";
import { Ban } from "lucide-react";

const ReadyButton: React.FC<{ userId: string }> = ({ userId }) => {
  const { sendReady } = useRoomSession();
  const [isReady, setIsReady] = useState(false);
  const votes = useVoteStore(useShallow(selectVotes));
  const { user } = useAuth();
  const { remainingVotes } = useVoteStats({
    votes,
    userId: user?.id ?? "",
    maxVotes: 3,
  });

  const { execute, isLoading, error } = useAsyncAction("sendReady", {
    onSuccess: () => {
      setIsReady(true);
    },
    onError: (err) => {
      console.error("Send ready error:", err);
    },
  });

  const handleReady = async () => {
    if (!sendReady) throw new Error("Connection not ready. Please wait...");

    await execute(async () => {
      if (remainingVotes === 3) {
        throw new Error("You have to vote at least 1");
      }
      const name =
        user?.user_metadata?.name ??
        user?.user_metadata?.full_name ??
        user?.email ??
        undefined;
      const result = await sendReady(userId, name);
      if (!result) throw new Error("Failed to send ready. Please try again");
      return result;
    });
  };

  return (
    <>
      {error && (
        <div className="flex my-4 gap-2 items-center justify-center bg-rose-200 text-red-500 mb-4 py-2 px-4 text-sm shadow-md font-medium rounded-xl">
          <Ban />
          <span>{error}</span>
        </div>
      )}
      <button
        id="ready-button"
        onClick={handleReady}
        className={`w-full p-2 rounded-2xl transition-all duration-500 ease-in-out ${
          isReady
            ? "bg-emerald-500 ring-offset-4 ring-2 ring-emerald-500 text-white cursor-not-allowed"
            : isLoading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "btn-gradient"
        }`}
      >
        {isLoading ? "Connecting..." : isReady ? "I AM READY" : "READY?"}
      </button>
    </>
  );
};

export default ReadyButton;
