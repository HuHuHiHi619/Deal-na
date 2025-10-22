// components/RoomGuard.tsx
"use client";

import LoadingPage from "@/app/component/LoadingPage";
import ErrorPage from "@/app/component/ErrorPage";
import { useRouter } from "next/navigation";

interface RoomGuardProps {
  isJoining: boolean;
  currentRoom: any;
  roomCode: string;
  error: string | null;
  clearError: () => void;
  mockUser: any;
  children: React.ReactNode;
}

export function RoomGuard({
  currentRoom,
  isJoining,
  roomCode,
  error,
  clearError,
  mockUser,
  children,
}: RoomGuardProps) {
  const router = useRouter();

  // 1️⃣ ยังไม่มี user
  if (!mockUser) {
    return (
      <LoadingPage title="Checking authentication..." subtitle="please wait" />
    );
  }

  // 2️⃣ มี error
  if (error) {
    return (
      <ErrorPage
        error={error}
        onRetry={() => {
          clearError();
          router.push("/");
        }}
      />
    );
  }

  // 3️⃣ ยัง join ไม่เสร็จ
  if (isJoining || !currentRoom || currentRoom.roomCode !== roomCode) {
    return (
      <LoadingPage
        title={`Joining room ${roomCode}...`}
        subtitle={isJoining ? "Connecting..." : "Setting up..."}
      />
    );
  }

  // 4️⃣ ทุกอย่างพร้อมแล้ว
  return <>{children}</>;
}
