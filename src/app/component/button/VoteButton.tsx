import React from "react";
import { cn } from "@/app/lib/cn";
import { OptionColor, optionBg } from "@/app/lib/optionColors";

interface VoteButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  /** "fill" = solid option color (add), "ghost" = neutral (remove) */
  tone?: "fill" | "ghost";
  color?: OptionColor;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  onClick,
  icon,
  disabled = false,
  tone = "ghost",
  color = "coral",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-md transition-all hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100",
        tone === "fill"
          ? cn(optionBg[color], color === "sun" ? "text-ink" : "text-white")
          : "bg-line/60 text-muted",
      )}
    >
      {icon}
    </button>
  );
};
