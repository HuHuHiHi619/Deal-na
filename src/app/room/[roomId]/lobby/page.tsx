"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Plus } from "lucide-react";
import { useAuth } from "@/app/store/auth/useAuth";
import { RoomGuard } from "@/app/component/room/RoomGuard";
import Confetti from "@/app/component/decor/Confetti";
import { cn } from "@/app/lib/cn";
import { optionColorAt, optionBg } from "@/app/lib/optionColors";
import useRoomQuery from "@/app/hooks/query/useRoomQuery";
import useOptionsQuery from "@/app/hooks/query/useOptionsQuery";
import useOptionMutations from "@/app/hooks/mutation/useOptionMutations";
import useRoomSession from "@/app/hooks/useRoomSession";

const OPTION_CAP = 3;

export default function LobbyPage() {
  const { roomId }: { roomId: string } = useParams();
  const router = useRouter();
  const { user, session } = useAuth();
  const { isJoined, error: sessionError, totalMembers, memberNames } = useRoomSession();
  const { data: currentRoom } = useRoomQuery(roomId, isJoined);
  const { data: options } = useOptionsQuery(roomId, isJoined);
  const { addOption, isPending: isAddingOption } = useOptionMutations(roomId);

  const [isCopied, setIsCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [optionInput, setOptionInput] = useState("");

  useEffect(() => {
    if (!isJoined || !currentRoom) return;
    if (currentRoom.started_at) {
      router.push(`/room/${roomId}`);
    }
  }, [isJoined, currentRoom?.started_at, roomId, router]);

  const isHost = !!user && !!currentRoom && currentRoom.created_by === user.id;
  const roomUrl =
    currentRoom?.url ??
    `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`;

  const optionCount = options?.length ?? 0;
  const optionsFull = optionCount >= OPTION_CAP;

  const canStart = totalMembers >= 2;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed || optionsFull) return;
    addOption(trimmed);
    setOptionInput("");
  };

  const handleStartVoting = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/room/${roomId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to start room");
    } catch (err) {
      setIsStarting(false);
      setStartError(err instanceof Error ? err.message : "Failed to start room");
    }
  };

  const members = Array.from(memberNames.entries());
  const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

  return (
    <RoomGuard
      isJoining={!isJoined && !sessionError}
      isJoined={isJoined}
      roomId={roomId}
      error={sessionError}
      user={user ?? null}
    >
      <div className="relative min-h-screen overflow-hidden bg-cream px-[22px] pt-8 pb-10">
        <Confetti variant="share" />

        <main className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6">
          {/* Header */}
          <header className="text-center">
            <p className="type-eyebrow text-coral">Room ready</p>
            <h1 className="type-title mt-2 text-ink">Invite the crew 🎉</h1>
            <p className="type-caption mt-1 text-muted">scan or copy the link below</p>
          </header>

          {/* QR card */}
          <div className="flex flex-col items-center gap-4 rounded-4xl bg-card p-7 shadow-lg">
            <QRCodeSVG value={roomUrl} size={172} level="M" bgColor="#FFFFFF" fgColor="#1F1B2E" />
            <div className="text-center">
              <p className="type-heading text-ink">{currentRoom?.title}</p>
              {currentRoom?.room_code && (
                <p className="type-caption mt-1 text-muted">
                  room <span className="font-bold text-coral">#{currentRoom.room_code}</span>
                </p>
              )}
            </div>
          </div>

          {/* Link pill */}
          <div className="flex items-center gap-3 rounded-2xl bg-card p-2 pl-4 shadow-sm">
            <p className="type-caption flex-1 truncate text-ink">{roomUrl}</p>
            <button
              onClick={handleCopy}
              className="type-caption flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 font-semibold text-cream transition-transform hover:scale-[1.03]"
            >
              {isCopied ? <Check size={15} /> : <Copy size={15} />}
              {isCopied ? "copied" : "copy"}
            </button>
          </div>

          {/* Joined panel */}
          <div className="flex items-center gap-3 rounded-2xl bg-mint-tint px-4 py-3">
            <div className="flex -space-x-2">
              {members.slice(0, 4).map(([id, name], i) => (
                <span
                  key={id}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 border-cream text-[11px] font-bold text-white",
                    optionBg[optionColorAt(i)],
                  )}
                >
                  {initialOf(name)}
                </span>
              ))}
            </div>
            <span className="type-caption flex-1 font-semibold text-ink">
              {totalMembers} {totalMembers === 1 ? "friend" : "friends"} joined
            </span>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-mint" />
          </div>

          {/* Options */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="type-eyebrow text-muted">Options</h2>
              <span className="type-caption text-muted">{optionCount} / {OPTION_CAP}</span>
            </div>

            <div className="flex flex-col gap-2">
              {options?.map((option, i) => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-sm"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white",
                      optionBg[optionColorAt(i)],
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="type-body text-ink">{option.title}</span>
                </div>
              ))}
            </div>

            {optionsFull ? (
              <p className="type-caption mt-2 text-center text-muted">
                All {OPTION_CAP} option slots are filled — you&apos;re good to go.
              </p>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                  placeholder="Add an option..."
                  disabled={isAddingOption}
                  className="type-body flex-1 rounded-xl border-[1.5px] border-line bg-card px-4 py-2.5 text-ink outline-none transition-colors focus:border-coral disabled:opacity-50"
                />
                <button
                  onClick={handleAddOption}
                  disabled={!optionInput.trim() || isAddingOption}
                  className="flex flex-shrink-0 items-center justify-center rounded-xl bg-coral px-3 text-white transition-transform hover:scale-[1.03] disabled:opacity-40"
                >
                  <Plus size={18} />
                </button>
              </div>
            )}
          </section>

          {/* Host: start voting */}
          {isHost && (
            <div>
              <button
                onClick={handleStartVoting}
                disabled={!canStart || isStarting}
                className={cn(
                  "type-heading w-full rounded-xl bg-ink py-4 text-cream transition-all duration-300",
                  !canStart || isStarting
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer shadow-lg hover:-translate-y-0.5",
                )}
              >
                {isStarting ? "Starting..." : "start voting →"}
              </button>
              {!canStart && !isStarting && (
                <p className="type-caption mt-2 text-center text-muted">
                  Waiting for at least one friend to join before you can start.
                </p>
              )}
              {startError && (
                <p className="type-caption mt-2 text-center text-coral">{startError}</p>
              )}
            </div>
          )}

          {/* Guest: waiting for host */}
          {!isHost && (
            <p className="type-caption animate-pulse text-center text-muted">
              Waiting for the host to start voting...
            </p>
          )}
        </main>
      </div>
    </RoomGuard>
  );
}
