import React, { useContext } from "react";
import { RoomSessionContext } from "../room/[roomId]/RoomSessionProvider";

function useRoomSession() {
  const context = useContext(RoomSessionContext);
  if (!context)
    throw new Error("useRoomSession must be used within RoomSessionProvider");
  return context;
}

export default useRoomSession;
