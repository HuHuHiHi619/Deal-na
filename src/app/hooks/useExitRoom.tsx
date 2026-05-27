import { useAsyncAction } from "./useAsyncAction";
import { useRouter } from "next/navigation";
import { useRoom } from "../store/room/useRoomStore";

export function useExitRoom() {
  const router = useRouter();
  const { exitRoom } = useRoom();

  const { execute, isLoading, error } = useAsyncAction("exitRoom", {
    onSuccess: () => {
      router.replace("/room");
    },
    onError: (err) => {
      console.error("Exit room error:", err);
    },
  });

  const handleExit = async () => {
    const confirmed = confirm("Are you sure you want to exit the room?");
    if (!confirmed) return;
    await execute(async () => {
      exitRoom();
      // RoomSessionProvider cleanup tears down the channel on unmount
    });
  };

  return { handleExit, isLoading, error };
}
