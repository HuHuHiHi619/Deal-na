import type { UiKey } from "../store/useUiStore";

export async function executeWithUI<T>(
  key: UiKey,
  action: () => Promise<T>,
  ui: {
    setLoading: (key: UiKey, value: boolean) => void;
    setError: (key: UiKey, message: string | null) => void;
  },
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
): Promise<T | undefined> {
  const { setLoading, setError } = ui;

  setLoading(key, true);
  setError(key, null); 

  try {
    const result = await action();
    options?.onSuccess?.(result);
    return result;
  } catch (error : unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";

    console.error(`[executeWithUI] ${key} failed:`, message);
    setError(key, message);

    options?.onError?.(error);

    return undefined; 
  } finally {
    setLoading(key, false);
  }
}
