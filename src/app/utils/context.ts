import { useAuth } from "../store/auth/useAuth";
import { useRoom } from "../store/room/useRoomStore";

export function getRequiredAuth() {
    const token = useAuth.getState().session?.access_token;
    if (!token) {
        throw new Error("Session expired. Please log in again.");
    }
    return { token };
}

export function getRequiredContext() {
    const userId = useAuth.getState().user?.id;
    const roomId = useRoom.getState().currentRoom?.id;
    const token = useAuth.getState().session?.access_token;

    if (!userId || !roomId) {
        throw new Error(`Context is not ready: userId=${userId}, roomId=${roomId}`);
    }
    if (!token) {
        throw new Error("Session expired. Please log in again.");
    }

    return { userId, roomId, token };
}