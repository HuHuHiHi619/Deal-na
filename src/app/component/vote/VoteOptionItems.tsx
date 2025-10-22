// components/vote/VoteOptionItem.tsx
import React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { VoteOptionContent } from "./VoteOptionContent";
import { VoteCountBadge } from "./VoteCountBadge";
import { VoteButton } from "../button/VoteButton";
import { DeleteOptionButton } from "../button/DeleteOptionButton";

interface VoteOptionItemProps {
  option: any;
  mockUser: any;
  myVotes: any[];
  remainingVotes: number;
  handleAddVote: (optionId: string) => void;
  handleRemoveVote: (voteId: string, optionId: string) => void;
  handleDeleteOption: (optionId: string) => void;
}

export const VoteOptionItem: React.FC<VoteOptionItemProps> = ({
  option,
  mockUser,
  myVotes,
  remainingVotes,
  handleAddVote,
  handleRemoveVote,
  handleDeleteOption,
}) => {
  const isMyOption = option.user_id === mockUser?.id;
  const myVoteCount = myVotes.filter((vote) => vote.option_id === option.id).length;
  const myVoteForThisOption = myVotes.find((vote) => vote.option_id === option.id);

  return (
    <div
      className={`relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-md border ${
        isMyOption
          ? "bg-rose-100 border-rose-200/40"
          : "bg-indigo-100 border-indigo-200/40"
      } hover:scale-[1.02]`}
    >
      <div className="flex items-center space-x-4">
        <VoteCountBadge count={myVoteCount} isMyOption={isMyOption} />
        <VoteOptionContent title={option.title} isMyOption={isMyOption} />
      </div>

      <div className="flex items-center space-x-2">
        <VoteButton
          onClick={() => handleAddVote(option.id)}
          icon={<PlusIcon size={16} className="text-gray-700" />}
          disabled={remainingVotes <= 0}
        />

        <VoteButton
          onClick={() => handleRemoveVote(myVoteForThisOption?.id, option.id)}
          icon={<MinusIcon size={16} className="text-gray-700" />}
          disabled={myVoteCount <= 0}
        />

        {isMyOption && (
          <DeleteOptionButton
            onClick={() => handleDeleteOption(option.id)}
          />
        )}
      </div>
    </div>
  );
};

export default VoteOptionItem;