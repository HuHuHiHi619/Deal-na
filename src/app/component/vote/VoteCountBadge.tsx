import React from "react";
import { cn } from "@/app/lib/cn";
import { OptionColor, optionBg } from "@/app/lib/optionColors";

interface VoteCountBadgeProps {
  count: number;
  color: OptionColor;
}

// Light chips need dark numerals for contrast (sun is pale yellow).
const DARK_NUMERAL: Partial<Record<OptionColor, boolean>> = { sun: true };

export const VoteCountBadge: React.FC<VoteCountBadgeProps> = ({ count, color }) => {
  return (
    <span
      className={cn(
        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg type-heading shadow-inset-bar",
        optionBg[color],
        DARK_NUMERAL[color] ? "text-ink" : "text-white",
      )}
    >
      {count}
    </span>
  );
};
