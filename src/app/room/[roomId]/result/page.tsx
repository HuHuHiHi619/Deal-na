"use client";
import AnotherRoundButton from "@/app/component/button/AnotherRoundButton";
import ExitRoomButton from "@/app/component/button/ExitRoomButton";
import LogoutButton from "@/app/component/button/LogoutButton";
import ShareResultButton from "@/app/component/button/ShareResultButton";
import Confetti from "@/app/component/decor/Confetti";
import { VoteResultsList } from "@/app/component/vote/VoteResultList";
import { WinnersSection } from "@/app/component/vote/WinnerSection";
import WinnerReveal from "@/app/component/vote/WinnerReveal";
import { prefersReducedMotion } from "@/app/lib/motion";
import useOptionsQuery from "@/app/hooks/query/useOptionsQuery";
import useRoomQuery from "@/app/hooks/query/useRoomQuery";
import useVoteQuery from "@/app/hooks/query/useVotesQuery";
import useRoomSession from "@/app/hooks/useRoomSession";
import { useVoteResult } from "@/app/hooks/useVoteResult";
import { optionColorAt, type OptionColor } from "@/app/lib/optionColors";
import type { Option } from "@/app/types";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

function Page() {
  const { roomId }: { roomId: string } = useParams();
  const { isJoined } = useRoomSession();
  const { data: currentRoom } = useRoomQuery(roomId, isJoined);
  const { data: votesData } = useVoteQuery(roomId, isJoined);
  const { data: options } = useOptionsQuery(roomId, isJoined);

  const { winners, results, totalVotes } = useVoteResult({
    voteResults: votesData?.formattedResult ?? [],
  });

  // Slot color stays with an option from Create → Vote → Results (keyed by id).
  const colorByOptionId: Record<string, OptionColor> = {};
  (options ?? []).forEach((o: Option, i: number) => {
    colorByOptionId[o.id] = optionColorAt(i);
  });

  // Gift reveal — plays once per room (sessionStorage), only when results are in
  // and motion is allowed. Decided synchronously during render (not in an effect)
  // so the overlay lands in the same commit as the results — no plain-results flash.
  const decidedRef = useRef(false);
  const showRef = useRef(false);
  const [dismissed, setDismissed] = useState(false);
  const resultReady = (options?.length ?? 0) > 0 && winners.length > 0;

  if (!decidedRef.current && resultReady) {
    decidedRef.current = true;
    let allow = !prefersReducedMotion();
    if (allow) {
      try {
        if (sessionStorage.getItem(`dealna:gift-shown:${roomId}`)) allow = false;
      } catch {
        /* sessionStorage unavailable — still show once this mount */
      }
    }
    showRef.current = allow;
  }
  const showReveal = showRef.current && !dismissed;

  // Persist the once-per-room flag after the reveal actually mounts (side effect
  // out of render). Set at show-time so a refresh mid-reveal won't replay it.
  useEffect(() => {
    if (!showReveal) return;
    try {
      sessionStorage.setItem(`dealna:gift-shown:${roomId}`, "1");
    } catch {
      /* ignore */
    }
  }, [showReveal, roomId]);

  const isTie = winners.length > 1;
  const optionLabels = (options ?? []).map((o: Option) => o.title);
  const shareText = isTie
    ? `"${currentRoom?.title ?? "Our deal"}" — it's a tie: ${winners.map((w) => w.title).join(", ")}`
    : `"${currentRoom?.title ?? "Our deal"}" — the deal is ${winners[0]?.title ?? "?"} (${winners[0]?.voteCount ?? 0} votes)`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream px-[22px] pt-8 pb-10">
      {showReveal && (
        <WinnerReveal
          winners={winners}
          totalVotes={totalVotes}
          onDone={() => setDismissed(true)}
        />
      )}
      <Confetti variant="result" />

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6">
        <WinnersSection winners={winners} totalVotes={totalVotes} />

        <VoteResultsList results={results} colorByOptionId={colorByOptionId} />

        <p className="type-caption text-center text-muted">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""} cast in total
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <ShareResultButton shareText={shareText} />
          <AnotherRoundButton isTie={isTie} title={currentRoom?.title ?? ""} options={optionLabels} />

          <div className="mt-2 border-t border-line pt-2">
            <ExitRoomButton />
            <LogoutButton mini={false} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Page;
