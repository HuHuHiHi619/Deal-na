"use client";
import { useParams } from "next/navigation";
import { useRoomLifecycle } from "@/app/hooks/useRoomLifeCycle";
import { RoomGuard } from "@/app/component/room/RoomGuard";

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roomCode }: { roomCode: string } = useParams();
  const { currentRoom, isJoining , error, clearError, mockUser } =
    useRoomLifecycle(roomCode);

  // Render room content
  return (
    <RoomGuard
      isJoining={isJoining}
      currentRoom={currentRoom}
      roomCode={roomCode}
      error={error}
      clearError={clearError}
      mockUser={mockUser}
    >
      <div className="min-h-screen bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-md">
        <header className="sticky top-0 z-10 bg-white/50 backdrop-blur-md border-b border-white/30 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-semibold text-gray-800 tracking-wide">
              {currentRoom?.title}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Room Code:{" "}
              <span className="font-mono text-indigo-600/80">
                {currentRoom?.roomCode}
              </span>
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </div>
    </RoomGuard>
  );
}
