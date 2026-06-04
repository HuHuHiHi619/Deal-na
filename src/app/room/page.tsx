"use client";
import React, { useState } from "react";
import TopicPage from "../topic/page";
import CreateRoomButton from "../component/button/CreateRoomButton";
import OptionsPage from "../option/page";
import ShareRoom from "../component/room/ShareRoom";
import { RoomFormProvider, useRoomFormContext } from "./RoomFormContext";
import useCurrentRoom from "../hooks/useCurrentRoom";
import Confetti from "../component/decor/Confetti";

function RoomsContent() {
  const currentRoom = useCurrentRoom() as { url?: string } | undefined;
  const ctx = useRoomFormContext();
  const titleInput = ctx?.titleInput ?? '';
  const optionsInput = ctx?.optionsInput ?? [];
  const [isPopup, setIsPopup] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream px-[22px] pt-8 pb-10">
      <Confetti variant="create" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-6">
        <TopicPage />
        {titleInput ? <OptionsPage /> : null}
        <CreateRoomButton titleInput={titleInput} optionsInput={optionsInput} />
      </div>

      {currentRoom && isPopup && (
        <ShareRoom room={currentRoom} onClose={() => setIsPopup(false)} />
      )}
    </div>
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
