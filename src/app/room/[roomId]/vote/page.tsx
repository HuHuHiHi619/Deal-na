'use client';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReadyButton from "@/app/component/button/ReadyButton";
import { VoteOptionItem } from "@/app/component/vote/VoteOptionItems";
import ReadinessSlots from "@/app/component/room/ReadinessSlots";
import { useVoteStats } from "@/app/hooks/useVoteStats";
import LoadingPage from "@/app/component/LoadingPage";
import { useAuth } from "@/app/store/auth/useAuth";
import { Vote, LockKeyhole } from "lucide-react";
import useOptionsQuery from "@/app/hooks/query/useOptionsQuery";
import useVoteQuery from "@/app/hooks/query/useVotesQuery";
import useMembersQuery from "@/app/hooks/query/useMembersQuery";
import useRoomSession from "@/app/hooks/useRoomSession";
import useVoteMutations from "@/app/hooks/mutation/useVoteMutations";
import type { Option } from "@/app/types";

interface VoteOptionsProps {
  roomId: string;
  isJoined: boolean;
}

const VoteOptions: React.FC<VoteOptionsProps> = ({ roomId, isJoined }) => {
  const { data: options } = useOptionsQuery(roomId, isJoined);
  const { data: votesData } = useVoteQuery(roomId, isJoined);
  const { data: members } = useMembersQuery(roomId, isJoined);
  const { totalMembers, readyMembers, memberNames, sendUnready } = useRoomSession();
  const { user } = useAuth();
  const { addVote, removeVote, isPending } = useVoteMutations(roomId);
  const router = useRouter();
  const [resultLoading, setResultLoading] = useState(false);

  // Reset lobby ready state when entering the vote page
  useEffect(() => {
    sendUnready?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { myVotes, remainingVotes } = useVoteStats({
    votes: votesData?.votes,
    userId: user?.id ?? "",
    maxVotes: 3,
  });

  // Use DB member list as denominator — presence totalMembers lags ~300ms (RISK-6)
  useEffect(() => {
    if (members && members.length >= 2 && (members as string[]).every((id) => readyMembers.includes(id))) {
      setResultLoading(true);
      const timeout = setTimeout(() => {
        router.push(`/room/${roomId}/result`);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [members, readyMembers, router, roomId]);

  if (!user) return null;

  if (resultLoading) {
    return <LoadingPage title="All votes locked in!" subtitle="Calculating results..." />;
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
          <p className="text-gray-400 text-sm mt-1">Waiting for everyone to lock in their votes...</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="flex justify-between text-xs text-gray-400 mb-3 px-1">
            <span>Readiness</span>
            <span>{readyMembers.length} / {totalMembers} locked in</span>
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
        <h2>Cast Your Votes</h2>
      </div>

      <p className="text-sm text-gray-400 pl-4 mb-4">
        You have <span className="font-semibold text-rose-500">{remainingVotes}</span> vote{remainingVotes !== 1 ? "s" : ""} remaining
      </p>

      <div className="space-y-4">
        {options?.map((option: Option) => (
          <VoteOptionItem
            key={option.id}
            option={option}
            user={user}
            myVotes={myVotes}
            remainingVotes={remainingVotes}
            isPending={isPending}
            handleAddVote={addVote}
            handleRemoveVote={removeVote}
          />
        ))}

        <div className="pt-4">
          <ReadyButton remainingVotes={remainingVotes} />
        </div>
      </div>
    </div>
  );
};

export default VoteOptions;
