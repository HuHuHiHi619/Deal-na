import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useRoomMemberStore } from "@/app/store/room/useRoomMemberStore";
import { useRoomReadyStore } from "@/app/store/room/useRoomReadyStore";
import { useRoomRealtimeReadyStore } from "@/app/store/room/useRoomRealtimeReadyStore";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { MinusIcon, PlusIcon, TextCursor, Trash } from "lucide-react";

interface VoteOptionsProps {
  handleDeleteOption: (optionId: string) => void;
}

const MAX_VOTE = 3;

const VoteOptions: React.FC<VoteOptionsProps> = ({ handleDeleteOption }) => {
  const { options } = useOptionStore();
  const { mockUser } = useMockAuth();
  const { votes, createVote, deleteVote } = useVoteStore();
  const { sendReady } = useRoomRealtimeReadyStore();
  const { members, addMember } = useRoomMemberStore();
  const { readyMembers } = useRoomReadyStore();
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const votesArr = Array.isArray(votes) ? votes : [];

  const myVotes = useMemo(
    () => votesArr.filter((v) => v.user_id === mockUser?.id),
    [votes, mockUser?.id]
  );

  const remainingVotes = MAX_VOTE - myVotes.length;

  const handleReady = async (userId: string) => {
    if (!sendReady) {
      setError("Ready function is not available");
      return;
    }
    const maxRetries = 10;
    let retries = 0;
    while (retries < maxRetries) {
      const { channel } = useRoomRealtimeReadyStore.getState();
      if (channel) {
        console.log("Channel is ready , sending...");
        const result = await sendReady(userId);
        if (!result) {
          setError("Failed to send ready. Please try again");
        }
        setIsReady(true);
        return;
      }

      console.log(`Waiting for channel ${retries + 1}/ ${maxRetries}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries++;
    }
    setError("Connection not ready. Please refresh and try again.");
  };

  const handleAddVote = (optionId: string) => {
    console.log("im adding vote", optionId);
    if (remainingVotes <= 0) {
      setError("You have reached the maximum number of votes.");
    }
    createVote(optionId);
  };
  const handleRemoveVote = (voteId: string, optionId: string) => {
    if (remainingVotes === MAX_VOTE) {
      setError("You have not made any votes.");
    }
    console.log("im removing vote");
    deleteVote(voteId, optionId);
  };

  useEffect(() => {
    const roomCode = useRoom.getState().currentRoom?.roomCode || "";
    if (members.length > 0 && members.length === readyMembers.length) {
      router.push(`/room/${roomCode}/result`);
    }
  }, [members, readyMembers]);

  if (!mockUser) return;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-light mb-6 text-rose-700">Vote Options</h2>
      <div className="space-y-4">
        {options?.map((option) => {
          const isMyOption = option.user_id === mockUser?.id;
          const myVoteCount = myVotes.filter(
            (vote) => vote.option_id === option.id
          ).length;

          return (
            <div
              key={option.id}
              className={`relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-md border ${
                isMyOption
                  ? "bg-rose-100 border-rose-200/40 from-rose-50/60 to-pink-50/60"
                  : "bg-indigo-100 border-indigo-200/40 from-lavender-50/60 to-periwinkle-50/60"
              } hover:scale-[1.02]`}
            >
              <div className="flex items-center space-x-4">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-xl text-white text-lg font-semibold shadow-inner ${
                    isMyOption
                      ? "bg-rose-400/80 backdrop-blur-sm"
                      : "bg-indigo-400/80 backdrop-blur-sm"
                  }`}
                >
                  {myVoteCount}
                </span>

                <p className="text-gray-800 font-medium tracking-wide">
                  {String(option.title)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {remainingVotes > 0 && (
                  <button
                    onClick={() => handleAddVote(option.id)}
                    className="vote-button bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all"
                  >
                    <PlusIcon size={16} className="text-gray-700" />
                  </button>
                )}

                {myVoteCount > 0 && (
                  <button
                    onClick={() => handleRemoveVote(myVotes[0].id, option.id)}
                    className="vote-button bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all"
                  >
                    <MinusIcon size={16} className="text-gray-700" />
                  </button>
                )}

                {isMyOption && (
                  <button
                    onClick={() => handleDeleteOption(option.id)}
                    className="trash-button bg-rose-100/40 hover:bg-rose-200/60 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all"
                  >
                    <Trash size={16} className="text-rose-500" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-4">
          <button
            id="ready-button"
            onClick={() => handleReady(mockUser.id)}
            className={`w-full p-2 rounded-xl transition-all duration-500 ease-in-out
    ${
      isReady
        ? "bg-emerald-500 ring-offset-4 ring-2 ring-emerald-500 text-white scale-105 shadow-lg"
        : "btn-gradient scale-100"
    }
  `}
          >
            {isReady ? "I AM READY" : "READY?"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteOptions;
