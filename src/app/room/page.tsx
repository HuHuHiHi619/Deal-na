"use client";
import React from "react";
import TopicPage from "../topic/page";
import CreateRoomButton from "../component/button/CreateRoomButton";
import OptionsPage from "../option/page";
import ShareRoom from "../component/room/ShareRoom";
import { useRoom } from "../store/room/useRoomStore";
import { useUiStore } from "../store/useUiStore";
import { RoomFormProvider, useRoomFormContext } from "./RoomFormContext";

function RoomsContent() {
  const { currentRoom } = useRoom();
  const { titleInput } = useRoomFormContext();
  const { isPopup } = useUiStore();

  return (
    <>
      <TopicPage />
      {titleInput ? <OptionsPage /> : null}
      <CreateRoomButton />
      {currentRoom && isPopup && <ShareRoom />}
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
