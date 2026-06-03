"use client";
import React, { useState } from "react";
import TopicPage from "../topic/page";
import CreateRoomButton from "../component/button/CreateRoomButton";
import OptionsPage from "../option/page";
import ShareRoom from "../component/room/ShareRoom";
import { RoomFormProvider, useRoomFormContext } from "./RoomFormContext";
import useCurrentRoom from "../hooks/useCurrentRoom";

function RoomsContent() {
  const currentRoom = useCurrentRoom() as { url?: string } | undefined;
  const ctx = useRoomFormContext();
  const titleInput = ctx?.titleInput ?? '';
  const optionsInput = ctx?.optionsInput ?? [];
  const [isPopup, setIsPopup] = useState(false);

  return (
    <>
      <TopicPage />
      {titleInput ? <OptionsPage /> : null}
      <CreateRoomButton titleInput={titleInput} optionsInput={optionsInput} />
      {currentRoom && isPopup && (
        <ShareRoom room={currentRoom} onClose={() => setIsPopup(false)} />
      )}
    </>
  );
}

function Rooms() {
  return (
    <RoomFormProvider>
      <RoomsContent />
    </RoomFormProvider>
  );
}

export default Rooms;
