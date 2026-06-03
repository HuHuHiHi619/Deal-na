import { useAuth } from '@/app/store/auth/useAuth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React from 'react'

function useExitRoomMutation({roomId} : {roomId : string}) {
    const session = useAuth(state => state.session)
    const router = useRouter()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn : async () => {
            const res = await fetch(`/api/room/${roomId}/exit`, {
                method : 'POST',
                headers : {
                    'Content-Type' : 'Application/json',
                    Authorization : `Bearer ${session?.access_token}`
                }
            })
        },
        onSuccess : () => {
            queryClient.removeQueries({queryKey : ['room', roomId]})
            queryClient.removeQueries({queryKey : ['options', roomId]})
            queryClient.removeQueries({queryKey : ['votes', roomId]})
            queryClient.removeQueries({queryKey : ['members', roomId]})

            router.push("/room");
        },
        onError : () =>  router.push("/rooms")
    }) 
}

export default useExitRoomMutation