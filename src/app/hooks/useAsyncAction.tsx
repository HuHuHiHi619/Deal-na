// hooks/useAsyncAction.ts
import { useUiStore } from "../store/useUiStore";
import { executeWithUI } from "../utils/actionHelper";

export function useAsyncAction<T>(
  actionKey: string,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
) {
  const { setLoading, setError, isLoading, getError } = useUiStore();

  const execute = async (action: () => Promise<T>) => {
    try {
      return await executeWithUI(actionKey, action, { setLoading, setError }, options);
    } catch (error) {
      console.warn(`[useAsyncAction] caught unhandled error for ${actionKey}:`, error);
      setError(
        actionKey,
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  return {
    execute,
    isLoading: isLoading(actionKey),
    error: getError(actionKey),
  };
}
