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
import ReadinessSlots from "@/app/component/room/ReadinessSlots";
import { useVoteStats } from "@/app/hooks/useVoteStats";
import { useUiStore } from "@/app/store/useUiStore";
import LoadingPage from "@/app/component/LoadingPage";
import { useAuth } from "@/app/store/auth/useAuth";
import { Vote, LockKeyhole } from "lucide-react";

interface VoteOptionsProps {
  handleDeleteOption: (optionId: string) => void;
}

const VoteOptions: React.FC<VoteOptionsProps> = ({ handleDeleteOption }) => {
  const options = useOptionStore(useShallow(selectOptions));
  const { user } = useAuth();
  const votes = useVoteStore(useShallow(selectVotes));
  const { createVote, deleteVote } = useVoteStore();
  const { readyMembers, totalMembers, memberNames } = useRoomReadyStore();
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

  const isMyReady = readyMembers.includes(user.id);

  if (isMyReady) {
    return (
      <div className="flex flex-col items-center py-12 px-4 animate-in fade-in duration-500">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <LockKeyhole size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700">You&apos;re locked in</h2>
          <p className="text-gray-400 text-sm mt-1">Waiting for everyone to ready up...</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex justify-between text-xs text-gray-400 mb-3 px-1">
            <span>Readiness</span>
            <span>{readyMembers.length} / {totalMembers}</span>
          </div>
          <ReadinessSlots readyMembers={readyMembers} memberNames={memberNames} />
        </div>
      </div>
    );
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
