import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useRoomMemberStore } from "@/app/store/room/useRoomMemberStore";
import { useRoomReadyStore } from "@/app/store/room/useRoomReadyStore";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import ReadyButton from "@/app/component/button/ReadyButton";
import VoteOptionItem from "@/app/component/vote/VoteOptionItems";
import { useVoteStats } from "@/app/hooks/useVoteStats";
import { useUiStore } from "@/app/store/useUiStore";
import LoadingPage from "@/app/component/LoadingPage";

interface VoteOptionsProps {
  handleDeleteOption: (optionId: string) => void;
}

const VoteOptions: React.FC<VoteOptionsProps> = ({ handleDeleteOption }) => {
  const { options } = useOptionStore();
  const { mockUser } = useMockAuth();
  const { votes, createVote, deleteVote } = useVoteStore();
  const { readyMembers , totalMembers} = useRoomReadyStore();
  const { setLoading , isLoading } = useUiStore();
  const router = useRouter();

  const { myVotes , remainingVotes } = useVoteStats({
    votes ,
    mockUserId : mockUser?.id ?? '',
    maxVotes : 3
  })

  useEffect(() => {
    const roomCode = useRoom.getState().currentRoom?.roomCode || "";

    console.log(`Ready: ${readyMembers.length}/${totalMembers}`);

    if (totalMembers >= 2 && readyMembers.length === totalMembers) {
      setLoading('resultLoading', true);

    const timeout = setTimeout(() => {
        router.push(`/room/${roomCode}/result`);
      },1000)
      return () => clearTimeout(timeout)
    }
  }, [ readyMembers, totalMembers ]);

  if (!mockUser) return;

  if (isLoading('resultLoading')) {
    return (
      <LoadingPage title="Loading..." subtitle="please wait" />
    );
  }

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
