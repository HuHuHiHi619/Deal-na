import { useAuth } from '@/app/store/auth/useAuth'
import { validateForm } from '@/app/utils/validateForm'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

interface CreateRoomMutationProps {
    titleInput : string 
    optionsInput : string[]
}

function useCreateRoomMutation() {
    const router = useRouter()
    const session = useAuth(state => state.session)
    const queryClient = useQueryClient()

  return useMutation({
    mutationFn : async ({titleInput , optionsInput} : CreateRoomMutationProps) => {
        if(!session?.access_token) throw new Error("No session")
        const { valid , error } = validateForm(titleInput , optionsInput)
        if(!valid || !optionsInput) throw new Error(error)
        
        const res = await fetch("/api/room",{
            method  : "POST",
            headers : {
                "Content-Type" : "application/json",
                Authorization : `Bearer ${session.access_token}`
            },
            body : JSON.stringify({titleInput , optionsInput})
        })
        if(!res.ok) {
            const error = await res.json()
            throw new Error(error.message || "Failed to create room")
        }
        const { room } = await res.json()
        return room 
    },
    onSuccess : (room) => {
        queryClient.setQueryData(['currentRoom'], room)
        queryClient.invalidateQueries({queryKey : ["rooms"]})
        router.push(`/room/${room.id}/lobby`);
    },
    onError : (error) => {
        console.error("Create room error:",error)
    }
 
  })
}

export default useCreateRoomMutation