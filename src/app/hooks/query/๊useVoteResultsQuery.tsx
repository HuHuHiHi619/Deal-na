import React from "react";
import { useAuth } from "../../store/auth/useAuth";
import { useQuery } from "@tanstack/react-query";

function useVoteQuery(roomId: string, enable: boolean) {
  const session = useAuth((state) => state.session);
  return useQuery({
    queryKey: ["results", roomId],
    enabled: enable && !!session?.access_token,
    queryFn: async () => {
      const res = await fetch(`/api/room/${roomId}/votes/results`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if(!res.ok) throw new Error ('Failed to fetch vote results')
      const result = await res.json()
      return result
    },
  });
}

export default useVoteQuery;
