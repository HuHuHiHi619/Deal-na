import { useAsyncAction } from "./useAsyncAction";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "../store/room/useRoomStore";
import { useRealtimeRoom } from "./useRealtimeRoom";

export function useExitRoom() {
  const router = useRouter();
  const { roomId }: { roomId: string } = useParams();
  const { exitRoom } = useRoom();
  const { unsubscribeAll } = useRealtimeRoom(roomId);

  const { execute, isLoading, error } = useAsyncAction("exitRoom" , {
    onSuccess : () => {
      router.replace("/room");
    },
    onError : (err) => {
      console.error("Exit room error:", err);
    },
  });

  const handleExit = async () => {
    const confirmed = confirm("Are you sure you want to exit the room?");
    if (!confirmed) return;
    await execute(async () => {
      unsubscribeAll();
      exitRoom();
    })
  }

  return {  handleExit, isLoading, error };

}


