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
    <div className="min-w-0 flex-1">
      <p
        className={`
  font-medium tracking-wide 
  line-clamp-2 break-words
  ${isMyOption ? "text-rose-700" : "text-indigo-700"}
`}
      >
        {String(title)}
      </p>
    </div>
  );
};
