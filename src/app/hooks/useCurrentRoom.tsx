import { useQueryClient } from '@tanstack/react-query'
import React from 'react'

function useCurrentRoom() {
  const queryClient = useQueryClient()
  return queryClient.getQueryData(['currentRoom'])
}

export default useCurrentRoom