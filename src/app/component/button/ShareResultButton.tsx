"use client";

import { Check, Share2 } from "lucide-react";
import useClipboard from "@/app/hooks/useClipboard";

interface ShareResultButtonProps {
  /** human-readable summary, e.g. `"Lunch" — the deal is Pizza (4 votes)` */
  shareText: string;
}

export default function ShareResultButton({ shareText }: ShareResultButtonProps) {
  const { isCopied, copyToClipboard } = useClipboard();

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Deal Na", text: shareText, url });
        return;
      } catch {
        /* user dismissed or share failed — fall through to clipboard */
      }
    }
    await copyToClipboard(`${shareText}\n${url}`);
  };

  return (
    <button
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-line bg-card py-3.5 type-body font-semibold text-ink transition-transform hover:scale-[1.01]"
    >
      {isCopied ? <Check size={18} className="text-mint" /> : <Share2 size={18} />}
      {isCopied ? "copied to clipboard" : "share result"}
    </button>
  );
}
