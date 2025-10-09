'use client'
import React, { useEffect } from "react";
import TopicPage from "../topic/page";
import LogoutButton from "../component/Logout";
import CreateRoomButton from "../component/CreateRoomButton";
import OptionsPage from "../option/page";
import { useRoom } from "../store/room/useRoomStore";
import ShareRoom from "../component/ShareRoom";
import { useRealtimeRoom } from "../hooks/useRealtimeRoom";

function Rooms() {
  const { currentRoom } = useRoom();
  
  useRealtimeRoom(currentRoom?.id)

  return (
    <>
      <TopicPage />
      <OptionsPage />
      <CreateRoomButton />
      {currentRoom && (
        <ShareRoom />
      )}
      <LogoutButton />
    </>
  );
}

export default Rooms;
