import React from "react";
import { Trash } from "lucide-react";

export interface DeleteOptionButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function DeleteOptionButton({
  onClick,
  disabled = false,
}: DeleteOptionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-rose-100/40 hover:bg-rose-200/60 backdrop-blur-sm p-2 rounded-lg shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Trash size={16} className="text-rose-500" />
    </button>
  );
}