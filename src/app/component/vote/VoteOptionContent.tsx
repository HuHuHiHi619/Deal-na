// components/vote/VoteOptionContent.tsx
import React from "react";

interface VoteOptionContentProps {
  title: string;
  isMyOption: boolean;
}

export const VoteOptionContent: React.FC<VoteOptionContentProps> = ({
  title,
  isMyOption,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <p className={`text-gray-800 font-medium tracking-wide ${
        isMyOption ? "text-rose-700" : "text-indigo-700"
      }`}>
        {String(title)}
      </p>
    </div>
  );
};