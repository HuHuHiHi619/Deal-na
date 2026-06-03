"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Users, Copy, Check, Play, Plus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/app/store/auth/useAuth";
import { RoomGuard } from "@/app/component/room/RoomGuard";
import useRoomQuery from "@/app/hooks/query/useRoomQuery";
import useOptionsQuery from "@/app/hooks/query/useOptionsQuery";
import useOptionMutations from "@/app/hooks/mutation/useOptionMutations";
import useRoomSession from "@/app/hooks/useRoomSession";

const OPTION_CAP = 3;

export default function LobbyPage() {
  const { roomId }: { roomId: string } = useParams();
  const router = useRouter();
  const { user, session } = useAuth();
  const { isJoined, error: sessionError, totalMembers, readyMembers, sendReady } = useRoomSession();
  const { data: currentRoom } = useRoomQuery(roomId, isJoined);
  const { data: options } = useOptionsQuery(roomId, isJoined);
  const { addOption, isPending: isAddingOption } = useOptionMutations(roomId);

  const [isCopied, setIsCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [optionInput, setOptionInput] = useState("");
  const [isReadying, setIsReadying] = useState(false);

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
  const slotsRemaining = OPTION_CAP - optionCount;
  const optionsFull = optionCount >= OPTION_CAP;

  const isMyReady = readyMembers.includes(user?.id ?? "");
  const allReady = totalMembers > 0 && readyMembers.length >= totalMembers;

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

  const handleReady = async () => {
    if (!sendReady) return;
    setIsReadying(true);
    const name =
      user?.user_metadata?.name ??
      user?.user_metadata?.full_name ??
      user?.email ??
      undefined;
    await sendReady(name);
    setIsReadying(false);
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

  return (
    <RoomGuard
      isJoining={!isJoined && !sessionError}
      isJoined={isJoined}
      roomId={roomId}
      error={sessionError}
      user={user ?? null}
    >
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-rose-300 to-rose-800 backdrop-blur-md rounded-b-xl ring-offset-4 ring-4 ring-rose-400 shadow-sm">
          <div className="max-w-4xl flex items-center gap-4 mx-auto pl-8 py-4 text-2xl font-semibold text-white tracking-wide">
            <h1 className="text-3xl">{currentRoom?.title}</h1>
          </div>
        </header>

        <main className="max-w-sm mx-auto px-4 py-10 flex flex-col gap-8">

          {/* QR + share */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-rose-200 shadow-sm text-center">
              <p className="text-sm text-gray-500 font-medium mb-3">Scan to join</p>
              <QRCodeSVG value={roomUrl} size={160} level="M" bgColor="#fdf2f8" fgColor="#be185d" />
            </div>
            <div className="w-full bg-rose-50 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm border border-rose-100">
              <p className="text-gray-700 text-sm truncate">{roomUrl}</p>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-100 transition-colors"
              >
                {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Member count */}
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Users size={18} className="text-rose-400" />
            <span>{totalMembers} {totalMembers === 1 ? "member" : "members"} in lobby</span>
          </div>

          {/* Options */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Options
              </h2>
              <span className="text-xs text-gray-400">{optionCount} / {OPTION_CAP}</span>
            </div>

            <div className="space-y-2 mb-3">
              {options?.map((option) => (
                <div
                  key={option.id}
                  className="bg-white rounded-xl px-4 py-3 text-sm text-gray-700 border border-rose-100 shadow-sm"
                >
                  {option.title}
                </div>
              ))}
            </div>

            {optionsFull ? (
              <p className="text-xs text-center text-gray-400 py-2">
                All 3 option slots are filled — you&apos;re good to go.
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                    placeholder="Add an option..."
                    disabled={isAddingOption}
                    className="flex-1 rounded-xl border border-rose-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-50"
                  />
                  <button
                    onClick={handleAddOption}
                    disabled={!optionInput.trim() || isAddingOption}
                    className="p-2 rounded-xl bg-rose-400 text-white hover:bg-rose-500 transition-colors disabled:opacity-40"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">
                  {slotsRemaining} slot{slotsRemaining !== 1 ? "s" : ""} remaining
                </p>
              </>
            )}
          </div>

          {/* Readiness */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Ready to vote
              </h2>
              <span className="text-xs text-gray-400">{readyMembers.length} / {totalMembers}</span>
            </div>

            {isMyReady ? (
              <div className="flex items-center gap-2 justify-center py-3 text-emerald-600 text-sm font-medium">
                <CheckCircle2 size={18} />
                <span>You&apos;re ready — waiting for others...</span>
              </div>
            ) : (
              <button
                onClick={handleReady}
                disabled={isReadying}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50"
              >
                {isReadying ? "Confirming..." : "I'm Ready"}
              </button>
            )}
          </div>

          {/* Host: start voting */}
          {isHost && (
            <div className="w-full">
              <button
                onClick={handleStartVoting}
                disabled={!allReady || isStarting}
                className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white text-xl font-medium px-6 py-4 rounded-xl transition-all duration-300 ${
                  !allReady || isStarting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:-translate-y-1 cursor-pointer shadow-md hover:shadow-lg"
                }`}
              >
                <Play size={24} />
                {isStarting ? "Starting..." : "Start Voting →"}
              </button>
              {!allReady && !isStarting && (
                <p className="text-xs text-center text-gray-400 mt-2">
                  Waiting for everyone to press &quot;I&apos;m Ready&quot; before you can start.
                </p>
              )}
              {startError && (
                <p className="text-red-500 text-sm text-center mt-2">{startError}</p>
              )}
            </div>
          )}

          {/* Guest: waiting for host */}
          {!isHost && allReady && (
            <p className="text-gray-400 text-sm text-center animate-pulse">
              Everyone&apos;s ready — waiting for the host to start voting...
            </p>
          )}
        </main>
      </div>
    </RoomGuard>
  );
}
