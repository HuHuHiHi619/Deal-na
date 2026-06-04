'use client';
import React, { useState } from "react";
import { Ban } from "lucide-react";
import { cn } from "@/app/lib/cn";
import { useAuth } from "@/app/store/auth/useAuth";
import useRoomSession from "@/app/hooks/useRoomSession";

interface ReadyButtonProps {
  remainingVotes: number;
}

const ReadyButton: React.FC<ReadyButtonProps> = ({ remainingVotes }) => {
  const { sendLock } = useRoomSession();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReady = async () => {
    if (remainingVotes === 3) {
      setError("You have to vote at least once before locking in.");
      return;
    }
    if (!sendLock) {
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
    const result = await sendLock(name);
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
        <div className="my-4 flex items-center justify-center gap-2 rounded-xl bg-coral-tint px-4 py-2.5 type-caption font-semibold text-coral">
          <Ban size={16} />
          <span>{error}</span>
        </div>
      )}
      <button
        onClick={handleReady}
        disabled={isReady || isLoading}
        className={cn(
          "type-heading w-full rounded-xl py-4 text-white transition-all duration-300",
          isReady
            ? "cursor-not-allowed bg-mint"
            : isLoading
            ? "cursor-not-allowed bg-muted"
            : "cursor-pointer bg-brand-gradient shadow-glow-coral hover:-translate-y-0.5",
        )}
      >
        {isLoading ? "locking in..." : isReady ? "locked in ✓" : "lock it in ✓"}
      </button>
    </>
  );
};

export default ReadyButton;
