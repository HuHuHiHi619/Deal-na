import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useRoomMemberStore } from "@/app/store/room/useRoomMemberStore";
import { useRoomReadyStore } from "@/app/store/room/useRoomReadyStore";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import ReadyButton from "@/app/component/ReadyButton";
import VoteOptionItem from "@/app/component/VoteOptionItems";

interface VoteOptionsProps {
  handleDeleteOption: (optionId: string) => void;
}

const MAX_VOTE = 3;

const VoteOptions: React.FC<VoteOptionsProps> = ({ handleDeleteOption }) => {
  const { options } = useOptionStore();
  const { mockUser } = useMockAuth();
  const { votes, createVote, deleteVote } = useVoteStore();
  const { members} = useRoomMemberStore();
  const { readyMembers } = useRoomReadyStore();
  const router = useRouter();

  const votesArr = Array.isArray(votes) ? votes : [];

  const myVotes = useMemo(
    () => votesArr.filter((v) => v.user_id === mockUser?.id),
    [votes, mockUser?.id]
  );

  const remainingVotes = MAX_VOTE - myVotes.length;

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
        {options?.map((option) => (
          <VoteOptionItem
            key={option.id}
            option={option}
            mockUser={mockUser}
            myVotes={myVotes}
            remainingVotes={remainingVotes}
            handleAddVote={createVote}
            handleRemoveVote={deleteVote}
            handleDeleteOption={handleDeleteOption}
          />
        ))}

        <div className="pt-4">
          <ReadyButton mockUserId={mockUser.id} />
        </div>
      </div>
    </div>

  );
};

export default VoteOptions;
