import { useUiStore } from "../store/useUiStore";
import type { UiKey } from "../store/useUiStore";
import { executeWithUI } from "./actionHelper";
import { getRequiredAuth } from "./context";

interface AuthActionFunction<T> {
  action: (context: { token: string }) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

export async function authActionWrapper<T>(
  key: UiKey,
  { action, onSuccess, onError }: AuthActionFunction<T>
) {
  const { setLoading, setError } = useUiStore.getState();
  return executeWithUI(
    key,
    async () => {
      const context = getRequiredAuth();
      return action(context);
    },
    { setLoading, setError },
    { onSuccess, onError }
  );
}

export const actionWrapper = authActionWrapper;
