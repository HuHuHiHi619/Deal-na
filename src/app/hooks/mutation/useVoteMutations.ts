import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/store/auth/useAuth";

function useVoteMutations(roomId: string) {
  const session = useAuth((s) => s.session);
  const queryClient = useQueryClient();

  const addVote = useMutation({
    mutationFn: (optionId: string) =>
      fetch(`/api/room/${roomId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to add vote");
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["votes", roomId] }),
  });

  const removeVote = useMutation({
    mutationFn: (optionId: string) =>
      fetch(`/api/room/${roomId}/vote`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to remove vote");
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["votes", roomId] }),
  });

  return {
    addVote: addVote.mutate,
    removeVote: removeVote.mutate,
    isPending: addVote.isPending || removeVote.isPending,
  };
}

export default useVoteMutations;
