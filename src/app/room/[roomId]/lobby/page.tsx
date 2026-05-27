"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Users, Copy, Check, Play } from "lucide-react";
import { useAuth } from "@/app/store/auth/useAuth";
import { useRoom } from "@/app/store/room/useRoomStore";
import { useRoomMemberStore } from "@/app/store/room/useRoomMemberStore";
import { RoomGuard } from "@/app/component/room/RoomGuard";
import { useRoomSession } from "../RoomSessionProvider";

export default function LobbyPage() {
  const { roomId }: { roomId: string } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { currentRoom, startRoom, clearError, error: storeError } = useRoom();
  const { members } = useRoomMemberStore();
  const { isJoined, error: sessionError } = useRoomSession();

  const error = sessionError ?? storeError;

  const [isCopied, setIsCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Navigate when room starts (host: optimistic; guests: realtime UPDATE → fetchRoom → startedAt set)
  useEffect(() => {
    if (!isJoined || !currentRoom) return;
    if (currentRoom.startedAt) {
      router.push(`/room/${roomId}`);
    }
  }, [isJoined, currentRoom?.startedAt, roomId, router]);

  const isHost = !!user && !!currentRoom && currentRoom.createdBy === user.id;
  const roomUrl =
    currentRoom?.url ??
    `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartVoting = async () => {
    if (!currentRoom) return;
    setIsStarting(true);
    setStartError(null);
    try {
      await startRoom(currentRoom.id);
    } catch (err) {
      setIsStarting(false);
      setStartError(err instanceof Error ? err.message : "Failed to start room");
    }
  };

  return (
    <RoomGuard
      isJoining={!isJoined && !error}
      isJoined={isJoined}
      roomId={roomId}
      error={error}
      clearError={clearError}
      user={user ?? null}
      currentRoom={currentRoom}
    >
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 bg-gradient-to-r from-rose-300 to-rose-800 backdrop-blur-md rounded-b-xl ring-offset-4 ring-4 ring-rose-400 shadow-sm">
          <div className="max-w-4xl flex items-center gap-4 mx-auto pl-8 py-4 text-2xl font-semibold text-white tracking-wide">
            <h1 className="text-3xl">{currentRoom?.title}</h1>
          </div>
        </header>

        <main className="max-w-sm mx-auto px-4 py-10 flex flex-col items-center gap-8">
          {/* QR Code */}
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-rose-200 shadow-sm text-center">
            <p className="text-sm text-gray-500 font-medium mb-3">Scan to join</p>
            <QRCodeSVG
              value={roomUrl}
              size={160}
              level="M"
              bgColor="#fdf2f8"
              fgColor="#be185d"
            />
          </div>

          {/* Share link */}
          <div className="w-full bg-rose-50 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm border border-rose-100">
            <p className="text-gray-700 text-sm truncate">{roomUrl}</p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-100 transition-colors"
            >
              {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
            </button>
          </div>

          {/* Member count */}
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Users size={18} className="text-rose-400" />
            <span>
              {members.length} {members.length === 1 ? "member" : "members"} joined
            </span>
          </div>

          {/* Host action / non-host wait */}
          {isHost ? (
            <>
              <button
                onClick={handleStartVoting}
                disabled={isStarting}
                className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white text-xl font-medium px-6 py-4 rounded-xl transition-all duration-300 ${
                  isStarting
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:-translate-y-1 cursor-pointer shadow-md hover:shadow-lg"
                }`}
              >
                <Play size={24} />
                {isStarting ? "Starting..." : "Start Voting →"}
              </button>
              {startError && (
                <p className="text-red-500 text-sm text-center">{startError}</p>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center animate-pulse">
              Waiting for the host to start voting...
            </p>
          )}
        </main>
      </div>
    </RoomGuard>
  );
}
