// components/vote/VoteButton.tsx
import React from "react";

interface VoteButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  onClick,
  icon,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-white/40 hover:bg-white/60 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {icon}
    </button>
  );
};