"use client";

import { use } from "react";
import { RoomSessionProvider } from "./RoomSessionProvider";

export default function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-md">
      <RoomSessionProvider roomId={roomId}>
        {children}
      </RoomSessionProvider>
    </div>
  );
}
