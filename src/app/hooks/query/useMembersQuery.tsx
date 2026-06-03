import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../store/auth/useAuth";

function useMembersQuery(roomId: string, enabled: boolean) {
  const session = useAuth((state) => state.session);
  return useQuery<string[]>({
    queryKey: ["members", roomId],
    enabled: enabled && !!session?.access_token,
    queryFn: async () => {
      const res = await fetch(`/api/room/${roomId}/members`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });
}

export default useMembersQuery;
