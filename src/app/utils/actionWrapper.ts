// utils/actionWrapper.ts
import { useUiStore } from "../store/useUiStore";
import { executeWithUI } from "./actionHelper";
import { getRequiredContext } from "./context";

interface ActionFunction<T> {
  action: (context: { userId: string; roomId: string }) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

export async function actionWrapper<T>(
  key: string,
  { action, onSuccess, onError }: ActionFunction<T>
) {
  const { setLoading , setError } = useUiStore.getState()
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