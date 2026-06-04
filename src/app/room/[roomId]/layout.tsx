"use client";

import React from "react";
import { useAuth } from "@/app/store/auth/useAuth";
import { RoomSessionProvider } from "./RoomSessionProvider";
import LoadingPage from "@/app/component/LoadingPage";


export default function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = React.use(params);
  const session = useAuth((state) => state.session);

  if (!session) return <LoadingPage />;

  const name =
    session.user.user_metadata?.name ??
    session.user.user_metadata?.full_name ??
    session.user.email ??
    "Player";

  return (
    <div className="min-h-screen bg-cream">
      <RoomSessionProvider roomId={roomId} userId={session.user.id} token={session.access_token} name={name}>
        {children}
      </RoomSessionProvider>
    </div>
  );
}
