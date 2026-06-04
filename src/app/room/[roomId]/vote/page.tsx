'use client';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ReadyButton from "@/app/component/button/ReadyButton";
import { VoteOptionItem } from "@/app/component/vote/VoteOptionItems";
import ReadinessSlots from "@/app/component/room/ReadinessSlots";
import { useVoteStats } from "@/app/hooks/useVoteStats";
import LoadingPage from "@/app/component/LoadingPage";
import { useAuth } from "@/app/store/auth/useAuth";
import { LockKeyhole, Lightbulb } from "lucide-react";
import { optionColorAt } from "@/app/lib/optionColors";
import useOptionsQuery from "@/app/hooks/query/useOptionsQuery";
import useRoomQuery from "@/app/hooks/query/useRoomQuery";
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
  const { data: currentRoom } = useRoomQuery(roomId, isJoined);
  const { data: votesData } = useVoteQuery(roomId, isJoined);
  const { data: members } = useMembersQuery(roomId, isJoined);
  const { totalMembers, lockedMembers, memberNames } = useRoomSession();
  const { user } = useAuth();
  const { addVote, removeVote, isPending } = useVoteMutations(roomId);
  const router = useRouter();
  const [resultLoading, setResultLoading] = useState(false);

  const { myVotes, remainingVotes } = useVoteStats({
    votes: votesData?.votes,
    userId: user?.id ?? "",
    maxVotes: 3,
  });

  // Use DB member list as denominator — presence totalMembers lags ~300ms (RISK-6)
  useEffect(() => {
    if (members && members.length >= 2 && (members as string[]).every((id) => lockedMembers.includes(id))) {
      setResultLoading(true);
      const timeout = setTimeout(() => {
        router.push(`/room/${roomId}/result`);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [members, lockedMembers, router, roomId]);

  if (!user) return null;

  if (resultLoading) {
    return <LoadingPage title="All votes locked in!" subtitle="Calculating results..." />;
  }

  const isMyReady = lockedMembers.includes(user.id);

  if (isMyReady) {
    return (
      <div className="flex animate-in flex-col items-center py-10 duration-500 fade-in">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-tint">
              <LockKeyhole size={28} className="text-mint" />
            </span>
          </div>
          <h2 className="type-heading text-ink">You&apos;re locked in</h2>
          <p className="type-caption mt-1 text-muted">Waiting for everyone to lock in their votes...</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-3 flex justify-between px-1 type-caption text-muted">
            <span>Readiness</span>
            <span>{lockedMembers.length} / {totalMembers} locked in</span>
          </div>
          <ReadinessSlots readyMembers={lockedMembers} memberNames={memberNames} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="flex items-center gap-2">
          <span className="type-eyebrow text-coral">Voting · Live</span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-mint" />
        </div>
        <h1 className="type-title mt-2 text-ink">{currentRoom?.title}</h1>
        <p className="type-caption mt-1 text-muted">
          you have <span className="font-bold text-ink">{remainingVotes}</span> vote{remainingVotes !== 1 ? "s" : ""} to spend
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {options?.map((option: Option, i: number) => (
          <VoteOptionItem
            key={option.id}
            option={option}
            color={optionColorAt(i)}
            myVotes={myVotes}
            remainingVotes={remainingVotes}
            isPending={isPending}
            handleAddVote={addVote}
            handleRemoveVote={removeVote}
          />
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-sun-tint px-4 py-3">
        <Lightbulb size={16} className="mt-0.5 flex-shrink-0 text-ink" />
        <p className="type-caption text-ink">
          tip — you can give 2 votes to the same option if you really want it
        </p>
      </div>

      <div className="pt-1">
        <ReadyButton remainingVotes={remainingVotes} />
      </div>
    </div>
  );
};

export default VoteOptions;
