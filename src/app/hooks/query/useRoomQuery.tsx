import { useAuth } from '../../store/auth/useAuth'
import { useQuery } from '@tanstack/react-query'
import type { Room } from '@/app/types'

function useRoomQuery(roomId: string, enabled: boolean) {
    const session = useAuth(state => state.session)

    return useQuery<Room>({
        queryKey: ['room', roomId],
        enabled: enabled && !!session?.access_token,
        queryFn: async () => {
            const res = await fetch(`/api/room/${roomId}`, {
                headers: { Authorization: `Bearer ${session!.access_token}` }
            })
            if (!res.ok) throw new Error('Failed to fetch room')
            const { room } = await res.json()
            return room
        }
    })
}

export default useRoomQuery