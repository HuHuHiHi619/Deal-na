'use client'
import React from "react";
import { useRoom } from "../store/room/useRoomStore";
import { useMockAuth } from "../store/auth/useMockAuth";
import { useRoomForm } from "../store/useRoomForm";



function CreateRoomButton() {

  const { createRoom } = useRoom()
  const { titleInput, optionsInput } = useRoomForm()
  const { mockUser } = useMockAuth();

  const handleCreateRoom = async () => {
    console.log('creating room...')
    if(!mockUser) return
    if(titleInput.length === 0 || optionsInput.length === 0) return
    await createRoom(titleInput, optionsInput, mockUser.id)
  }
  return (
    <>
      <button className="bg-green-600 text-4xl p-4" onClick={handleCreateRoom}>Create Room</button>
    </>
  );
}

export default CreateRoomButton;
