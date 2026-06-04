"use client";
import React from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/app/lib/cn";
import { optionColorAt, optionBg } from "@/app/lib/optionColors";

interface OptionFormProps {
  options: string[];
  setOptions: (newOptions: string[]) => void;
  addOption: () => void;
  removeOption: (index: number) => void;
}

function OptionForm({ options, setOptions, addOption, removeOption }: OptionFormProps) {
  const handleOptionsChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === options.length - 1) addOption();
    }
  };

  return (
    <div className="space-y-3">
      {options?.map((option: string, index: number) => {
        const color = optionColorAt(index);
        return (
          <div
            key={index}
            className="bg-card shadow-sm flex items-center gap-3 rounded-xl p-3"
          >
            <span
              className={cn(
                "type-heading flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white",
                optionBg[color]
              )}
            >
              {index + 1}
            </span>
            <input
              type="text"
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={(e) => handleOptionsChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              name="options"
              className="type-body flex-1 bg-transparent text-ink placeholder-muted/50 focus:outline-none"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                aria-label={`Remove option ${index + 1}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-line/60 text-muted hover:text-ink cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addOption}
        className="type-body border-line text-muted hover:border-coral hover:text-coral flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 cursor-pointer transition-colors"
      >
        <Plus size={18} className="text-coral" />
        add another option
      </button>
    </div>
  );
}

export default OptionForm;
