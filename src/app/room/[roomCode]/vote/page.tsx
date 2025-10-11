import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useRoomMemberStore } from "@/app/store/room/useRoomMemberStore";
import { useRoomReadyStore } from "@/app/store/room/useRoomReadyStore";
import { useRoomRealtimeReadyStore } from "@/app/store/room/useRoomRealtimeReadyStore";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

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
  const router = useRouter();

  const myVotes = useMemo(
    () => votes.filter((v) => v.user_id === mockUser?.id),
    [votes, mockUser?.id]
  );

  const remainingVotes = MAX_VOTE - myVotes.length;

  const handleReady = async (userId: string) => {
    if (sendReady) {
      const result = await sendReady(userId);
      if (result) {
        router.push(`/room/${useRoom.getState().currentRoom?.roomCode}/result`);
      }
    }
  };

  const handleAddVote = (optionId: string) => {
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
        {options?.map((option, index) => {
          const isMyOption = option.user_id === mockUser?.id;
          const myVoteCount = myVotes.length;

          return (
            <div
              key={option.id || index}
              className={`relative flex items-center justify-between p-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md ${
                isMyOption
                  ? "bg-gradient-to-r from-rose-50 to-pink-50 border-l-4 border-rose-400"
                  : "bg-gradient-to-r from-lavender-50 to-periwinkle-50 border-l-4 border-lavender-400"
              }`}
            >
              <div className="flex items-center space-x-4">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-medium ${
                    isMyOption ? "bg-rose-400" : "bg-lavender-500"
                  }`}
                >
                  {myVoteCount}
                </span>
                <p className="text-gray-700 font-medium">
                  {String(option.title)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {isMyOption && (
                  <button
                    className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors flex items-center"
                    onClick={() => handleDeleteOption(option.id)}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                )}

                {remainingVotes > 0 && (
                  <button
                    className="bg-lavender-100 text-lavender-700 w-10 h-10 rounded-full flex items-center justify-center hover:bg-lavender-200 transition-colors text-xl font-light"
                    onClick={() => handleAddVote(option.id)}
                  >
                    +
                  </button>
                )}

                {myVoteCount > 0 && (
                  <button
                    className="bg-periwinkle-100 text-periwinkle-700 w-10 h-10 rounded-full flex items-center justify-center hover:bg-periwinkle-200 transition-colors text-xl font-light"
                    onClick={() => handleRemoveVote(myVotes[0].id, option.id)}
                  >
                    -
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-4">
          <button
            onClick={() => handleReady(mockUser.id)}
            className="bg-gradient-to-r from-rose-400 to-pink-400 text-white px-6 py-3 rounded-xl font-medium w-full shadow-sm hover:shadow-md transition-all duration-300 hover:from-rose-500 hover:to-pink-500"
          >
            READY
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteOptions;
