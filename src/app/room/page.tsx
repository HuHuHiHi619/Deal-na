"use client";
import React from "react";
import TopicPage from "../topic/page";
import LogoutButton from "../component/button/LogoutButton";
import CreateRoomButton from "../component/button/CreateRoomButton";
import OptionsPage from "../option/page";

import ShareRoom from "../component/room/ShareRoom";
import { useRoom } from "../store/room/useRoomStore";
import { useRoomForm } from "../store/useRoomForm";
import { useUiStore } from "../store/useUiStore";

function Rooms() {
  const { currentRoom } = useRoom();
  const { titleInput } = useRoomForm();
  const { isPopup } = useUiStore()
  return (
    <>
      <TopicPage />
      {titleInput ? <OptionsPage /> : null}
      <CreateRoomButton />
      {currentRoom && isPopup &&<ShareRoom />}
      <LogoutButton />
    </>
  );
}

export default Rooms;
