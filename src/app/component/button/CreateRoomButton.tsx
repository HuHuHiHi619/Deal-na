"use client";
import { Heart, Ban } from "lucide-react";
import useCreateRoomMutation from "@/app/hooks/mutation/useCreateRoomMutation";

interface RoomInputProps {
  titleInput: string;
  optionsInput: string[];
}

export default function CreateRoomButton({ titleInput, optionsInput }: RoomInputProps) {
  const { mutate, isPending, error } = useCreateRoomMutation();

  const handleCreateRoom = () => {
    if (!titleInput || optionsInput.length <= 0) return;
    mutate({ titleInput, optionsInput });
  };

  return (
    <div className="mt-2 flex flex-col gap-3">
      {error && (
        <div className="bg-coral-tint type-caption flex items-center gap-2 rounded-xl px-4 py-2 text-coral">
          <Ban size={16} />
          <span>{error.message}</span>
        </div>
      )}

      <button
        disabled={isPending}
        onClick={handleCreateRoom}
        className={`bg-brand-gradient type-heading shadow-glow-coral flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-white transition-transform duration-200 ${
          isPending ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
        }`}
      >
        {isPending ? (
          "creating…"
        ) : (
          <>
            start the deal
            <Heart size={20} fill="currentColor" />
          </>
        )}
      </button>
    </div>
  );
}
