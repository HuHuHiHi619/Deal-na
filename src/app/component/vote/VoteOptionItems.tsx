
import React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { VoteOptionContent } from "./VoteOptionContent";
import { VoteCountBadge } from "./VoteCountBadge";
import { VoteButton } from "../button/VoteButton";
import { Option } from "@/app/store/option/useOptionStore";
import { Vote } from "@/app/store/vote/useVoteStore";
import { AuthUser } from "@/app/store/auth/useAuth";


interface VoteOptionItemProps {
  option: Option;
  user: AuthUser;
  myVotes: Vote[];
  remainingVotes: number;
  handleAddVote: (optionId: string) => void;
  handleRemoveVote: (voteId: string, optionId: string) => void;
  handleDeleteOption: (optionId: string) => void;
}

export const VoteOptionItem: React.FC<VoteOptionItemProps> = ({
  option,
  user,
  myVotes,
  remainingVotes,
  handleAddVote,
  handleRemoveVote,
  handleDeleteOption,
}) => {
  const isMyOption = option.user_id === user?.id;
  const myVoteCount = myVotes.filter((vote) => vote.option_id === option.id).length;
  const myVoteForThisOption = myVotes.find((vote) => vote.option_id === option.id);

  return (
    <div
      className={`relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-md border ${
        isMyOption
          ? "bg-rose-100 border-rose-200/40"
          : "bg-indigo-100 border-indigo-200/40"
      } `}
    >
      {/* เนื้อหา - อยู่ด้านซ้าย */}
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <VoteCountBadge count={myVoteCount} isMyOption={isMyOption} />
        <div className="min-w-0 flex-1">
          <VoteOptionContent title={option.title} isMyOption={isMyOption} />
        </div>
      </div>

      {/* ปุ่ม - อยู่ด้านขวา */}
      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
        <VoteButton
          onClick={() => handleAddVote(option.id)}
          icon={<PlusIcon size={16} />}
          disabled={remainingVotes <= 0}
        />

        <VoteButton
          onClick={() => handleRemoveVote(myVoteForThisOption?.id ?? "", option.id)}
          icon={<MinusIcon size={16} />}
          disabled={myVoteCount <= 0}
        />

        {/*
        {isMyOption && (
          <DeleteOptionButton
            onClick={() => handleDeleteOption(option.id)}
          />
        )}
          */}
      </div>
    </div>
  );
};

export default VoteOptionItem;