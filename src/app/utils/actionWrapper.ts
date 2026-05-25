import { useUiStore } from "../store/useUiStore";
import type { UiKey } from "../store/useUiStore";
import { executeWithUI } from "./actionHelper";
import { getRequiredContext, getRequiredAuth } from "./context";

interface RoomActionFunction<T> {
  action: (context: { userId: string; roomId: string; token: string }) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

interface AuthActionFunction<T> {
  action: (context: { token: string }) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

export async function roomActionWrapper<T>(
  key: UiKey,
  { action, onSuccess, onError }: RoomActionFunction<T>
) {
  const { setLoading, setError } = useUiStore.getState();
  return executeWithUI(
    key,
    async () => {
      const context = getRequiredContext();
      return action(context);
    },
    { setLoading, setError },
    { onSuccess, onError }
  );
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

export const actionWrapper = roomActionWrapper;
