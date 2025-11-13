import { useAuth } from "../store/auth/useAuth";
import { useRoom } from "../store/room/useRoomStore";

export function getRequiredContext() {
    const userId = useAuth.getState().user?.id;
    const roomId = useRoom.getState().currentRoom?.id;

    if (!userId || !roomId) {
        throw new Error(`Context is not ready: userId=${userId}, roomId=${roomId}`);
    }

    return { userId, roomId };
}