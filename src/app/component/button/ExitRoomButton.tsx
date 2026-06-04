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
        className="flex w-full items-center justify-center gap-1.5 py-2 type-caption font-semibold text-muted transition-colors hover:text-ink disabled:opacity-50"
      >
        <X size={15} />
        <span>{isPending ? "exiting..." : "exit room"}</span>
      </button>
      {error && <p className="text-center type-caption text-coral">{error.message}</p>}
    </>
  );
}

