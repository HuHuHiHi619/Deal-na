'use client';
import React, { useState } from "react";
import { Ban } from "lucide-react";
import { useAuth } from "@/app/store/auth/useAuth";
import useRoomSession from "@/app/hooks/useRoomSession";

interface ReadyButtonProps {
  remainingVotes: number;
}

const ReadyButton: React.FC<ReadyButtonProps> = ({ remainingVotes }) => {
  const { sendReady } = useRoomSession();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReady = async () => {
    if (remainingVotes === 3) {
      setError("You have to vote at least once before locking in.");
      return;
    }
    if (!sendReady) {
      setError("Connection not ready. Please wait...");
      return;
    }
    setIsLoading(true);
    setError(null);
    const name =
      user?.user_metadata?.name ??
      user?.user_metadata?.full_name ??
      user?.email ??
      undefined;
    const result = await sendReady(name);
    if (!result) {
      setError("Failed to lock in. Please try again.");
      setIsLoading(false);
      return;
    }
    setIsReady(true);
    setIsLoading(false);
  };

  return (
    <>
      {error && (
        <div className="flex my-4 gap-2 items-center justify-center bg-rose-200 text-red-500 mb-4 py-2 px-4 text-sm shadow-md font-medium rounded-xl">
          <Ban size={16} />
          <span>{error}</span>
        </div>
      )}
      <button
        onClick={handleReady}
        disabled={isReady || isLoading}
        className={`w-full p-2 rounded-2xl transition-all duration-500 ease-in-out ${
          isReady
            ? "bg-emerald-500 ring-offset-4 ring-2 ring-emerald-500 text-white cursor-not-allowed"
            : isLoading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "btn-gradient"
        }`}
      >
        {isLoading ? "Locking in..." : isReady ? "Locked In ✓" : "Lock In My Votes"}
      </button>
    </>
  );
};

export default ReadyButton;
