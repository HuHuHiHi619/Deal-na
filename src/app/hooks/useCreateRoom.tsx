import { useAuth } from "../store/auth/useAuth";
import { useRoom } from "../store/room/useRoomStore";
import { useRoomForm } from "../store/useRoomForm";
import { useUiStore } from "../store/useUiStore";
import { validateForm } from "../utils/validateForm";
import { useAsyncAction } from "./useAsyncAction";

export function useCreateRoom() {
    const { createRoom } = useRoom()
    const { titleInput , optionsInput } = useRoomForm();
    const { setIsPopup, setLoading } = useUiStore();
    const { user } = useAuth()

    const { execute , isLoading , error } = useAsyncAction('createRoomLoading' , {
        onSuccess: (data) => {
            console.log("✅ Room created successfully:", data);
        },
        onError: (err) => {
            console.log("❌ Create room error:", err);
        }
    })

    const handleCreateRoom = async () => {
        return await execute(async () => {
            if(!user) throw new Error('User not found');
            const { valid , options , error } = validateForm(titleInput , optionsInput)
            if(!valid) throw new Error(error)
            if(options === undefined) throw new Error('options is undefined')

            const result = await createRoom(titleInput.trim() , options , user.id)

            setLoading('popupQr' , true)
            setIsPopup(true)

            return result
        })
    }

    return {
        handleCreateRoom,
        isLoading,
        error
    }
}