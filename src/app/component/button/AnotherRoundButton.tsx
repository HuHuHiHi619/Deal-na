"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { stashAnotherRound } from "@/app/lib/anotherRound";

interface AnotherRoundButtonProps {
  isTie: boolean;
  /** current topic — seeds the Create form on a tie */
  title: string;
  /** current option labels — seed the Create form on a tie */
  options: string[];
}

export default function AnotherRoundButton({ isTie, title, options }: AnotherRoundButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // Tie → run the same deal back (pre-fill Create). Clear winner → fresh deal.
    if (isTie) stashAnotherRound({ title, options });
    router.push("/room");
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 type-heading text-cream shadow-md transition-transform hover:-translate-y-0.5"
    >
      another round
      <ArrowRight size={20} />
    </button>
  );
}
