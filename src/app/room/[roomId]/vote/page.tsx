'use client';
import { useOptionStore, selectOptions } from "@/app/store/option/useOptionStore";
import { useRoomReadyStore } from "@/app/store/room/useRoomReadyStore";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useVoteStore, selectVotes } from "@/app/store/vote/useVoteStore";
import { useShallow } from "zustand/shallow";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import ReadyButton from "@/app/component/button/ReadyButton";
import VoteOptionItem from "@/app/component/vote/VoteOptionItems";
import { useVoteStats } from "@/app/hooks/useVoteStats";
import { useUiStore } from "@/app/store/useUiStore";
import LoadingPage from "@/app/component/LoadingPage";
import { useAuth } from "@/app/store/auth/useAuth";
import { Vote } from "lucide-react";

interface VoteOptionsProps {
  handleDeleteOption: (optionId: string) => void;
}

const VoteOptions: React.FC<VoteOptionsProps> = ({ handleDeleteOption }) => {
  const options = useOptionStore(useShallow(selectOptions));
  const { user } = useAuth();
  const votes = useVoteStore(useShallow(selectVotes));
  const { createVote, deleteVote } = useVoteStore();
  const { readyMembers, totalMembers } = useRoomReadyStore();
  const { setLoading, isLoading } = useUiStore();
  const router = useRouter();

  const { myVotes, remainingVotes } = useVoteStats({
    votes,
    userId: user?.id ?? "",
    maxVotes: 3,
  });

  useEffect(() => {
    const roomId = useRoom.getState().currentRoom?.id || "";

    if (totalMembers >= 2 && readyMembers.length === totalMembers) {
      setLoading("resultLoading", true);

      const timeout = setTimeout(() => {
        router.push(`/room/${roomId}/result`);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [readyMembers, totalMembers , router , setLoading]);

  if (!user) return;

  if (isLoading("resultLoading")) {
    return <LoadingPage title="Loading..." subtitle="please waiting for result" />;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-2xl font-light mb-6 pl-4 text-rose-700">
        <Vote size={40} />
        <h2>Vote Options</h2>
      </div>

      <div className="space-y-4">
        {options?.map((option) => (
          <VoteOptionItem
            key={option.id}
            option={option}
            user={user}
            myVotes={myVotes}
            remainingVotes={remainingVotes}
            handleAddVote={createVote}
            handleRemoveVote={deleteVote}
            handleDeleteOption={handleDeleteOption}
          />
        ))}

        <div className="pt-4">
          <ReadyButton userId={user.id} />
        </div>
      </div>
    </div>
  );
};

export default VoteOptions;
