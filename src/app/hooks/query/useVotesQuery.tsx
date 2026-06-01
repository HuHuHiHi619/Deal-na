import { useAuth } from "../../store/auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { VotesQueryData } from "@/app/types";

function useVoteQuery(roomId: string, enable: boolean) {
  const session = useAuth((state) => state.session);
  return useQuery<VotesQueryData>({
    queryKey: ["votes", roomId],
    enabled: enable && !!session?.access_token,
    queryFn: async () => {
      const res = await fetch(`/api/room/${roomId}/votes/results`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch votes");
      const { votes, formattedResult } = await res.json();
      return { votes, formattedResult };
    },
  });
}

export default useVoteQuery;
