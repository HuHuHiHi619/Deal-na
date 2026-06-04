import React from "react";

interface VoteOptionContentProps {
  title: string;
}

export const VoteOptionContent: React.FC<VoteOptionContentProps> = ({ title }) => {
  return (
    <div className="min-w-0 flex-1">
      <p className="type-body line-clamp-2 break-words font-semibold text-ink">
        {String(title)}
      </p>
    </div>
  );
};
