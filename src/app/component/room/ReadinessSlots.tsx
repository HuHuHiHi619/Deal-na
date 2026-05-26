'use client';
import React from "react";
import { Check, Clock } from "lucide-react";

interface ReadinessSlotsProps {
  readyMembers: string[];
  memberNames: Map<string, string>;
}

const ReadinessSlots: React.FC<ReadinessSlotsProps> = ({ readyMembers, memberNames }) => {
  const allUserIds = Array.from(memberNames.keys());

  return (
    <div className="space-y-3">
      {allUserIds.map((userId) => {
        const name = memberNames.get(userId) ?? "Member";
        const isReady = readyMembers.includes(userId);

        return (
          <div
            key={userId}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
              isReady
                ? "bg-emerald-100 border-emerald-300 ring-1 ring-emerald-400 scale-[1.02]"
                : "bg-gray-100 border-gray-200 scale-100"
            }`}
          >
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isReady ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              {isReady ? (
                <Check size={14} className="text-white" />
              ) : (
                <Clock size={14} className="text-gray-500" />
              )}
            </div>

            <span
              className={`font-medium transition-colors duration-300 ${
                isReady ? "text-emerald-800" : "text-gray-500"
              }`}
            >
              {name}
            </span>

            {isReady && (
              <span className="ml-auto text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                Locked
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReadinessSlots;
