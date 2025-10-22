// components/vote/VoteCountBadge.tsx
import React from "react";

interface VoteCountBadgeProps {
  count: number;
  isMyOption: boolean;
}

export const VoteCountBadge: React.FC<VoteCountBadgeProps> = ({
  count,
  isMyOption,
}) => {
  return (
    <span
      className={`flex items-center justify-center w-10 h-10 rounded-xl text-white text-lg font-semibold shadow-inner ${
        isMyOption
          ? "bg-rose-400/80"
          : "bg-indigo-400/80"
      }`}
    >
      {count}
    </span>
  );
};