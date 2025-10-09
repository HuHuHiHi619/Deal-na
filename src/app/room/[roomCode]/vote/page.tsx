import { useMockAuth } from "@/app/store/auth/useMockAuth";
import { useOptionStore } from "@/app/store/option/useOptionStore";
import { useVoteStore } from "@/app/store/vote/useVoteStore";
import React, { useMemo, useState } from "react";

interface VoteOptionsProps {
  handleDeleteOption: (optionId: string) => void;
}

const MAX_VOTE = 3;

const VoteOptions: React.FC<VoteOptionsProps> = ({ handleDeleteOption }) => {
  const { options } = useOptionStore();
  const { mockUser } = useMockAuth();
  const { votes, createVote, deleteVote } = useVoteStore();
  const [error, setError] = useState<string | null>(null);

  const myVotes = useMemo(
    () => votes.filter((v) => v.user_id === mockUser?.id),
    [votes, mockUser?.id]
  );

  const remainingVotes = MAX_VOTE - myVotes.length;

  const handleAddVote = (optionId: string) => {
    if (remainingVotes <= 0) {
      setError("You have reached the maximum number of votes.");
    }
    createVote(optionId);
  };
  const handleRemoveVote = (voteId: string, optionId: string) => {
    if (remainingVotes === MAX_VOTE) {
      setError("You have not made any votes.");
    }
    console.log('im removing vote');
    deleteVote(voteId, optionId);
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Vote Options</h2>
      <div className="grid gap-3">
        {options?.map((option, index) => {
          const isMyOption = option.user_id === mockUser?.id;

          const myVoteCount = myVotes.length;

          return (
            <div key={option.id || index} className="flex items-center gap-3">
              <div
                className={`flex p-3 items-center text-white rounded-lg transition-colors ${
                  isMyOption
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                <p>{myVoteCount}</p>
                <p>{String(option.title)}</p>

                {isMyOption && (
                  <button
                    className="bg-red-500 text-white p-2 rounded-2xl"
                    onClick={() => handleDeleteOption(option.id)}
                  >
                    delete
                  </button>
                )}

                {remainingVotes > 0 && (
                  <button className="text-3xl bg-blue-600 p-4" onClick={() => handleAddVote(option.id)}>+</button>
                ) }

                {myVoteCount > 0 && (
                   <button
                   className="text-3xl bg-purple-600 p-4"
                    onClick={() => handleRemoveVote(myVotes[0].id, option.id)}
                  >
                    -
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VoteOptions;
