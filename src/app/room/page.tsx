'use client'
import React from "react";
import TopicPage from "../topic/page";
import LogoutButton from "../component/LogoutButton";
import CreateRoomButton from "../component/CreateRoomButton";
import OptionsPage from "../option/page";

import ShareRoom from "../component/ShareRoom";
import { useRoom } from "../store/room/useRoomStore";

function Rooms() {
  const { currentRoom } = useRoom();
  
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
