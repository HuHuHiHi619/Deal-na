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
  const { setLoading , setError , isLoading , getError } = useUiStore()
  
  const execute = async (action: () => Promise<T>) => {
    return executeWithUI(actionKey, action, { setLoading , setError }  ,options);
  };

  return { execute, isLoading : isLoading(actionKey), error : getError(actionKey) };
}