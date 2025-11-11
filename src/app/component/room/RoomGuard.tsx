"use client";

import LoadingPage from "@/app/component/LoadingPage";
import ErrorPage from "@/app/component/ErrorPage";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/app/store/auth/useAuth";
import { Room } from "@/app/store/room/useRoomStore";

interface RoomGuardProps {
  isJoined : boolean
  isJoining: boolean;
  roomId: string;
  error: string | Error | null;
  clearError: () => void;
  user: AuthUser | null;
  children: React.ReactNode;
  currentRoom: Room | null
}

export function RoomGuard({
  currentRoom,
  isJoined,
  isJoining,
  roomId,
  error,
  clearError,
  user,
  children,
}: RoomGuardProps) {
  const router = useRouter();
  const errorMessage = error instanceof Error ? error.message : error;
  // 1️⃣ ยังไม่มี user
  if (!user) {
    return (
      <LoadingPage title="Checking authentication..." subtitle="please wait" />
    );
  }
  if (!currentRoom) {
  console.log("⚠️ RoomGuard detected missing room", { currentRoom, isJoining, error });
}

  // 2️⃣ มี error
  if (errorMessage) {
     console.log("🚨 error guard triggered:", errorMessage);
    return (
      <ErrorPage
        error={errorMessage}
        onRetry={() => {
          clearError();
          router.push("/");
        }}
      />
    );
  }

  // 3️⃣ ยัง join ไม่เสร็จ
  if (isJoining || !isJoined) {
    return (
      <LoadingPage
        title={`Joining room ${roomId}...`}
        subtitle={isJoining ? "Connecting..." : "Setting up..."}
      />
    );
  }

  // 4️⃣ ทุกอย่างพร้อมแล้ว
  return <>{children}</>;
}
