'use client';
import React from "react";
import { Check, Clock } from "lucide-react";
import { cn } from "@/app/lib/cn";

interface ReadinessSlotsProps {
  readyMembers: string[];
  memberNames: Map<string, string>;
}

const ReadinessSlots: React.FC<ReadinessSlotsProps> = ({ readyMembers, memberNames }) => {
  const allUserIds = Array.from(memberNames.keys());

  return (
    <div className="flex flex-col gap-3">
      {allUserIds.map((userId) => {
        const name = memberNames.get(userId) ?? "Member";
        const isReady = readyMembers.includes(userId);

        return (
          <div
            key={userId}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300",
              isReady
                ? "bg-mint-tint scale-[1.02]"
                : "bg-line/40 scale-100",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                isReady ? "bg-mint" : "bg-line",
              )}
            >
              {isReady ? (
                <Check size={14} className="text-white" />
              ) : (
                <Clock size={14} className="text-muted" />
              )}
            </div>

            <span
              className={cn(
                "type-body font-semibold transition-colors duration-300",
                isReady ? "text-ink" : "text-muted",
              )}
            >
              {name}
            </span>

            {isReady && (
              <span className="type-eyebrow ml-auto text-mint">Locked</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReadinessSlots;
