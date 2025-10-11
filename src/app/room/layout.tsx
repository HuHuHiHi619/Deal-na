'use client'
import { useRealtimeRoom } from "../hooks/useRealtimeRoom";
import { useRoom } from "../store/room/useRoomStore";

export default function RoomParentLayout({ children } : { children: React.ReactNode }) {
  const { currentRoom } = useRoom();
  useRealtimeRoom(currentRoom?.id); 
  return <div>{children}</div>;
}