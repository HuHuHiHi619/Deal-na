import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/store/auth/useAuth";

function useOptionMutations(roomId: string) {
  const session = useAuth((s) => s.session);
  const queryClient = useQueryClient();

  const addOption = useMutation({
    mutationFn: (title: string) =>
      fetch(`/api/room/${roomId}/options`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ options: [title] }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to add option");
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["options", roomId] }),
  });

  return {
    addOption: addOption.mutate,
    isPending: addOption.isPending,
  };
}

export default useOptionMutations;
