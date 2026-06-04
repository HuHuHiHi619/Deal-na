import React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/app/lib/cn";
import { OptionColor, optionBorder } from "@/app/lib/optionColors";
import { VoteOptionContent } from "./VoteOptionContent";
import { VoteCountBadge } from "./VoteCountBadge";
import { VoteButton } from "../button/VoteButton";
import type { Option, Vote } from "@/app/types";

export type { Option, Vote };

interface VoteOptionItemProps {
  option: Option;
  color: OptionColor;
  myVotes: Vote[];
  remainingVotes: number;
  isPending?: boolean;
  handleAddVote: (optionId: string) => void;
  handleRemoveVote: (optionId: string) => void;
}

export const VoteOptionItem: React.FC<VoteOptionItemProps> = ({
  option,
  color,
  myVotes,
  remainingVotes,
  isPending = false,
  handleAddVote,
  handleRemoveVote,
}) => {
  const myVoteCount = myVotes.filter((v) => v.option_id === option.id).length;
  const selected = myVoteCount > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl bg-card p-3.5 shadow-sm transition-all duration-300",
        selected ? cn("border-2", optionBorder[color]) : "border-2 border-transparent",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <VoteCountBadge count={myVoteCount} color={color} />
        <VoteOptionContent title={option.title} />
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <VoteButton
          tone="ghost"
          onClick={() => handleRemoveVote(option.id)}
          icon={<MinusIcon size={18} />}
          disabled={myVoteCount <= 0 || isPending}
        />
        <VoteButton
          tone="fill"
          color={color}
          onClick={() => handleAddVote(option.id)}
          icon={<PlusIcon size={18} />}
          disabled={remainingVotes <= 0 || isPending}
        />
      </div>
    </div>
  );
};

export default VoteOptionItem;
