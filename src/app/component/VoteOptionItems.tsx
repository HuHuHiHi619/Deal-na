import React from "react";
import { MinusIcon, PlusIcon, Trash } from "lucide-react";

interface VoteOptionItemProps {
  option: any;
  mockUser: any;
  myVotes: any[];
  remainingVotes: number;
  handleAddVote: (optionId: string) => void;
  handleRemoveVote: (voteId: string, optionId: string) => void;
  handleDeleteOption: (optionId: string) => void;
}

const VoteOptionItem: React.FC<VoteOptionItemProps> = ({
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

  return (
    <div
      key={option.id}
      className={`relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-md border ${
        isMyOption
          ? "bg-rose-100 border-rose-200/40"
          : "bg-indigo-100 border-indigo-200/40"
      } hover:scale-[1.02]`}
    >
      <div className="flex items-center space-x-4">
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-xl text-white text-lg font-semibold shadow-inner ${
            isMyOption
              ? "bg-rose-400/80"
              : "bg-indigo-400/80"
          }`}
        >
          {myVoteCount}
        </span>

        <p className="text-gray-800 font-medium tracking-wide">
          {String(option.title)}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        {remainingVotes > 0 && (
          <button
            onClick={() => handleAddVote(option.id)}
            className="bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all"
          >
            <PlusIcon size={16} className="text-gray-700" />
          </button>
        )}

        {myVoteCount > 0 && (
          <button
            onClick={() => handleRemoveVote(myVotes[0].id, option.id)}
            className="bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all"
          >
            <MinusIcon size={16} className="text-gray-700" />
          </button>
        )}

        {isMyOption && (
          <button
            onClick={() => handleDeleteOption(option.id)}
            className="bg-rose-100/40 hover:bg-rose-200/60 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all"
          >
            <Trash size={16} className="text-rose-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VoteOptionItem;
