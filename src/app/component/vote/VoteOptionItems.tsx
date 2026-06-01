import React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { VoteOptionContent } from "./VoteOptionContent";
import { VoteCountBadge } from "./VoteCountBadge";
import { VoteButton } from "../button/VoteButton";
import { AuthUser } from "@/app/store/auth/useAuth";
import type { Option, Vote } from "@/app/types";

export type { Option, Vote };

interface VoteOptionItemProps {
  option: Option;
  user: AuthUser;
  myVotes: Vote[];
  remainingVotes: number;
  isPending?: boolean;
  handleAddVote: (optionId: string) => void;
  handleRemoveVote: (optionId: string) => void;
}

export const VoteOptionItem: React.FC<VoteOptionItemProps> = ({
  option,
  user,
  myVotes,
  remainingVotes,
  isPending = false,
  handleAddVote,
  handleRemoveVote,
}) => {
  const isMyOption = option.user_id === user?.id;
  const myVoteCount = myVotes.filter((v) => v.option_id === option.id).length;

  return (
    <div
      className={`relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-md border ${
        isMyOption
          ? "bg-rose-100 border-rose-200/40"
          : "bg-indigo-100 border-indigo-200/40"
      }`}
    >
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <VoteCountBadge count={myVoteCount} isMyOption={isMyOption} />
        <div className="min-w-0 flex-1">
          <VoteOptionContent title={option.title} isMyOption={isMyOption} />
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
        <VoteButton
          onClick={() => handleAddVote(option.id)}
          icon={<PlusIcon size={16} />}
          disabled={remainingVotes <= 0 || isPending}
        />
        <VoteButton
          onClick={() => handleRemoveVote(option.id)}
          icon={<MinusIcon size={16} />}
          disabled={myVoteCount <= 0 || isPending}
        />
      </div>
    </div>
  );
};

export default VoteOptionItem;
