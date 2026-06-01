"use client";

import LoadingPage from "@/app/component/LoadingPage";
import ErrorPage from "@/app/component/ErrorPage";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/app/store/auth/useAuth";

interface RoomGuardProps {
  isJoined: boolean;
  isJoining: boolean;
  roomId: string;
  error: string | null;
  user: AuthUser | null;
  children: React.ReactNode;
}

export function RoomGuard({
  isJoined,
  isJoining,
  roomId,
  error,
  user,
  children,
}: RoomGuardProps) {
  const router = useRouter();

  if (!user) {
    return (
      <LoadingPage title="Checking authentication..." subtitle="please wait" />
    );
  }

  if (error) {
    return (
      <ErrorPage
        error={error}
        onRetry={() => router.push("/")}
      />
    );
  }

  if (isJoining || !isJoined) {
    return (
      <LoadingPage
        title={`Joining room ${roomId}...`}
        subtitle={isJoining ? "Connecting..." : "Setting up..."}
      />
    );
  }

  return <>{children}</>;
}
