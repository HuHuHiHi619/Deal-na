import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../store/auth/useAuth";
import type { Option } from "@/app/types";

function useOptionsQuery(roomId: string, enable: boolean) {
  const session = useAuth((state) => state.session);
  return useQuery<Option[]>({
    queryKey: ["options", roomId],
    enabled: enable && !!session?.access_token,
    queryFn: async () => {
      const res = await fetch(`/api/room/${roomId}/options`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch options");
      const { options } = await res.json();
      return options;
    },
  });
}

export default useOptionsQuery;
